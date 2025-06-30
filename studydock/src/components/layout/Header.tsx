import React, { useState, useEffect } from 'react';
import { Menu, Moon, Sun, BellDot, CheckCircle2, Timer, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation } from 'react-router-dom';
import { db } from '../../db/database';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  isMobile: boolean;
  onPomodoroToggle: () => void;
}

interface Notification {
  id: string;
  type: 'task' | 'flashcard';
  message: string;
  read: boolean;
  relatedId?: number;
  subjectId?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  isSidebarOpen, 
  onSidebarToggle,
  isMobile,
  onPomodoroToggle
}) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Dashboard';
    if (path === '/subjects') return 'My Subjects';
    if (path.includes('/subjects/') && path.includes('/notes')) return 'Notes';
    if (path.includes('/subjects/') && path.includes('/flashcards')) return 'Flashcards';
    if (path.includes('/subjects/') && path.includes('/quizzes')) return 'Quizzes';
    if (path === '/planner') return 'Study Planner';
    if (path === '/backup') return 'Backup & Restore';
    if (path === '/settings') return 'Settings';
    
    if (path.includes('/subjects/')) {
      return 'Subject Details';
    }
    
    return 'StudyStash';
  };

  const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    return yesterday;
  };

  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const fetchIncompleteTasks = async () => {
    try {
      const yesterday = getYesterday();
      
      const overdueTasks = await db.studyTasks
        .where('dueDate')
        .belowOrEqual(yesterday)
        .and(task => !task.completed)
        .toArray();
        
      const taskNotifications: Notification[] = [];
      
      for (const task of overdueTasks) {
        const subject = await db.subjects.get(task.subjectId);
        const subjectName = subject ? subject.name : 'Unknown Subject';
        
        taskNotifications.push({
          id: `task-${task.id}`,
          type: 'task',
          message: `Overdue task: ${subjectName} - ${task.title}`,
          read: false,
          relatedId: task.id,
          subjectId: task.subjectId
        });
      }
      
      return taskNotifications;
    } catch (error) {
      console.error("Error fetching incomplete tasks:", error);
      return [];
    }
  };

  const fetchDueFlashcards = async () => {
    try {
      const today = getToday();
      
      const dueFlashcards = await db.flashcards
        .where('nextReviewDate')
        .belowOrEqual(today)
        .toArray();
      
      const flashcardsBySubject = new Map<number, number>();
      
      dueFlashcards.forEach(flashcard => {
        const count = flashcardsBySubject.get(flashcard.subjectId) || 0;
        flashcardsBySubject.set(flashcard.subjectId, count + 1);
      });
      
      const flashcardNotifications: Notification[] = [];
      
      for (const [subjectId, count] of flashcardsBySubject.entries()) {
        const subject = await db.subjects.get(subjectId);
        const subjectName = subject ? subject.name : 'Unknown Subject';
        
        flashcardNotifications.push({
          id: `flashcard-${subjectId}`,
          type: 'flashcard',
          message: `${count} flashcards due for review in ${subjectName}`,
          read: false,
          subjectId: subjectId
        });
      }
      
      return flashcardNotifications;
    } catch (error) {
      console.error("Error fetching due flashcards:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      const taskNotifications = await fetchIncompleteTasks();
      const flashcardNotifications = await fetchDueFlashcards();
      
      const allNotifications = [...taskNotifications, ...flashcardNotifications];
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    };
    
    loadNotifications();
    
    const intervalId = setInterval(loadNotifications, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const toggleNotificationsPanel = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
    
    const updatedUnreadCount = notifications.filter(notification => 
      !notification.read && notification.id !== id
    ).length;
    setUnreadCount(updatedUnreadCount);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationAction = async (notification: Notification) => {
    if (notification.type === 'task' && notification.relatedId) {
      try {
        await db.studyTasks.update(notification.relatedId, { completed: true });
        
        setNotifications(notifications.filter(n => n.id !== notification.id));
        setUnreadCount(prev => Math.max(0, prev - (notification.read ? 0 : 1)));
      } catch (error) {
        console.error("Error completing task:", error);
      }
    } else if (notification.type === 'flashcard' && notification.subjectId) {
      window.location.href = `/subjects/${notification.subjectId}/flashcards`;
    }
    
    markAsRead(notification.id);
  };

  return (
    <header className="sticky top-0 z-10 h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
      {isMobile && (
        <button
          onClick={onMenuClick}
          className="block md:hidden p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Menu size={20} />
        </button>
      )}

      <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      
      <div className="flex-1"></div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={onPomodoroToggle}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Toggle Pomodoro Timer"
        >
          <Timer size={20} />
        </button>
        
        <div className="relative">
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            aria-label="Notifications"
            onClick={toggleNotificationsPanel}
          >
            <BellDot size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
  <div className="fixed sm:absolute right-0 top-16 sm:top-full mt-2 w-full sm:w-80 max-w-[calc(100vw-1rem)] bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700 mx-2 sm:mx-0">
    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h3 className="font-medium">Notifications</h3>
      {unreadCount > 0 && (
        <button 
          onClick={markAllAsRead} 
          className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Mark all as read
        </button>
      )}
    </div>
    
    <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
      {notifications.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No notifications
        </div>
      ) : (
        notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-3 border-b border-gray-100 dark:border-gray-700 ${
              notification.read ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
            } flex justify-between items-start cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={() => handleNotificationAction(notification)}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${
                notification.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'
              } truncate`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {notification.type === 'task' ? 'Click to mark as complete' : 'Click to review flashcards'}
              </p>
            </div>
            {!notification.read && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(notification.id);
                }} 
                className="ml-2 text-green-500 hover:text-green-700 p-1 flex-shrink-0"
                aria-label="Mark as read"
              >
                <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  </div>
)}
        </div>
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;