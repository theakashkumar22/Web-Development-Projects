import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db/database';
import { format } from 'date-fns';
import { BookOpen, Clock, Brain, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Get today's study sessions
  const todaySessions = useLiveQuery(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return db.studySessions
      .where('date')
      .between(today, tomorrow)
      .toArray();
  }, []) || [];

  // Calculate total study time today
  const todayStudyTime = todaySessions.reduce((total, session) => total + session.duration, 0);

  // Handle task completion
  const toggleTaskCompletion = async (taskId: number, currentStatus: boolean) => {
    await db.studyTasks.update(taskId, { completed: !currentStatus });
  };
  
  // Get counts for various items
  const notesCount = useLiveQuery(() => db.notes.count(), []) || 0;
  const flashcardsCount = useLiveQuery(() => db.flashcards.count(), []) || 0;
  const upcomingTasks = useLiveQuery(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return db.studyTasks
      .where('dueDate')
      .between(today, nextWeek)
      .and(task => !task.completed)
      .limit(5)
      .toArray();
  }, []) || [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Welcome to StudyDock!</h2>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Today's Study Time" 
          value={`${todayStudyTime} mins`} 
          icon={<Clock className="h-8 w-8 text-indigo-500" />} 
        />
        <StatsCard 
          title="Notes" 
          value={notesCount.toString()} 
          icon={<BookOpen className="h-8 w-8 text-teal-500" />} 
        />
        <StatsCard 
          title="Flashcards" 
          value={flashcardsCount.toString()} 
          icon={<Brain className="h-8 w-8 text-amber-500" />} 
        />
      </div>
      
      {/* Upcoming Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Upcoming Tasks</h3>
          <Link to="/planner" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center text-sm">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {upcomingTasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 py-4 text-center">
            No upcoming tasks. Add some in the Study Planner!
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {upcomingTasks.map(task => (
              <li key={task.id} className="py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Due: {format(task.dueDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <button 
                        onClick={() => toggleTaskCompletion(task.id, task.completed)}
                        className={`mt-1 mr-3 flex-shrink-0 ${task.completed ? 'text-green-500' : 'text-gray-400 hover:text-indigo-500'}`}
                      >
                        {task.completed ? 
                          <CheckCircle className="h-5 w-5" /> : 
                          <CheckCircle2 className="h-5 w-5" />
                        }
                      </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Study Streak / Calendar Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Study Calendar</h3>
          <Link to="/planner" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center text-sm">
            Full Planner <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Calendar className="h-16 w-16 text-indigo-500 mr-4" />
          <div>
            <p className="text-lg font-semibold">Your study calendar awaits!</p>
            <p className="text-gray-500 dark:text-gray-400">
              Track your progress and maintain your study streak
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-900/30 mr-4">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;