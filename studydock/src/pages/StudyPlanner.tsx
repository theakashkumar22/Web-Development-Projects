import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, StudyTask, StudySession, Subject } from '../db/database';
import { Calendar, Clock, CheckSquare, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, startOfMonth, endOfMonth, addDays, addMonths, isSameDay, parseISO, isValid, eachDayOfInterval } from 'date-fns';

const StudyPlanner = () => {
  // Calendar and date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'quarter'>('week');
  
  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueDate: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [sessionForm, setSessionForm] = useState({
    subjectId: '',
    duration: '30',
    notes: ''
  });

  // Period navigation state (month/quarter view)
  const [currentPeriodStart, setCurrentPeriodStart] = useState<Date>(
    startOfWeek(new Date())
  );

  // Database queries
  const subjects = useLiveQuery(
    () => db.subjects.toArray(),
    []
  ) || [];

  const tasks = useLiveQuery(
    () => {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      
      return db.studyTasks
        .where('dueDate')
        .between(start, end)
        .toArray();
    },
    [selectedDate]
  ) || [];

  const sessions = useLiveQuery(
    () => {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      
      return db.studySessions
        .where('date')
        .between(start, end)
        .toArray();
    },
    [selectedDate]
  ) || [];

  // Get sessions for the past 90 days for activity heatmap
  const allSessions = useLiveQuery(
    () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      
      return db.studySessions
        .where('date')
        .aboveOrEqual(startDate)
        .toArray();
    },
    []
  ) || [];

  // When view mode changes, update the period start accordingly
  useEffect(() => {
    if (viewMode === 'week') {
      setCurrentPeriodStart(startOfWeek(selectedDate));
    } else if (viewMode === 'month') {
      setCurrentPeriodStart(startOfMonth(selectedDate));
    } else {
      setCurrentPeriodStart(startOfMonth(selectedDate));
    }
  }, [viewMode, selectedDate]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskForm.title || !taskForm.subjectId) return;
    
    const dueDate = parseISO(taskForm.dueDate);
    if (!isValid(dueDate)) return;
    
    try {
      await db.studyTasks.add({
        title: taskForm.title,
        description: taskForm.description,
        subjectId: parseInt(taskForm.subjectId),
        dueDate: dueDate,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setTaskForm({
        title: '',
        description: '',
        subjectId: '',
        dueDate: format(selectedDate, 'yyyy-MM-dd')
      });
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const addSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionForm.subjectId || !sessionForm.duration) return;
    
    try {
      await db.studySessions.add({
        subjectId: parseInt(sessionForm.subjectId),
        date: selectedDate,
        duration: parseInt(sessionForm.duration),
        notes: sessionForm.notes
      });
      
      setSessionForm({
        subjectId: '',
        duration: '30',
        notes: ''
      });
      setShowSessionModal(false);
    } catch (error) {
      console.error('Error adding session:', error);
    }
  };

  const toggleTaskCompletion = async (task: StudyTask) => {
    if (!task.id) return;
    
    try {
      await db.studyTasks.update(task.id, {
        completed: !task.completed,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const deleteTask = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await db.studyTasks.delete(id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const deleteSession = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this study session?')) {
      try {
        await db.studySessions.delete(id);
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const getSubjectName = (id: number) => {
    const subject = subjects.find(s => s.id === id);
    return subject ? subject.name : 'Unknown Subject';
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      const days = direction === 'prev' ? -7 : 7;
      setCurrentPeriodStart(addDays(currentPeriodStart, days));
    } else if (viewMode === 'month') {
      const months = direction === 'prev' ? -1 : 1;
      setCurrentPeriodStart(addMonths(currentPeriodStart, months));
    } else {
      const months = direction === 'prev' ? -3 : 3;
      setCurrentPeriodStart(addMonths(currentPeriodStart, months));
    }
  };
  
  const getDaysToDisplay = () => {
    if (viewMode === 'week') {
      return Array.from({ length: 7 }, (_, i) => addDays(currentPeriodStart, i));
    } else if (viewMode === 'month') {
      const monthEnd = endOfMonth(currentPeriodStart);
      return eachDayOfInterval({ start: currentPeriodStart, end: monthEnd });
    } else {
      const quarterEnd = addMonths(currentPeriodStart, 3);
      const days = [];
      let current = new Date(currentPeriodStart);
      
      while (current < quarterEnd) {
        days.push(new Date(current));
        current = addDays(current, 1);
      }
      
      return days;
    }
  };
  
  const getHeatmapData = () => {
    const data: Record<string, number> = {};
    
    allSessions.forEach(session => {
      const dateKey = format(session.date, 'yyyy-MM-dd');
      data[dateKey] = (data[dateKey] || 0) + session.duration;
    });
    
    return data;
  };
  
  const heatmapData = getHeatmapData();

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Upper Section - Calendar and Heatmap */}
      <div className="space-y-6 mb-6">
        {/* Calendar View Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {viewMode === 'week' ? 'Weekly Overview' : 
                viewMode === 'month' ? 'Monthly Overview' : 'Quarterly Overview'}
            </h3>
            
            <div className="flex items-center">
              <div className="rounded-md flex items-center border border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 text-sm ${viewMode === 'week' 
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 text-sm ${viewMode === 'month' 
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Month
                </button>
                <button 
                  onClick={() => setViewMode('quarter')}
                  className={`px-3 py-1 text-sm ${viewMode === 'quarter' 
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Quarter
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => navigatePeriod('prev')}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft size={20} />
              </button>
              
              <h4 className="font-semibold">
                {viewMode === 'week' 
                  ? `Week of ${format(currentPeriodStart, 'MMM d, yyyy')}` 
                  : viewMode === 'month'
                    ? format(currentPeriodStart, 'MMMM yyyy')
                    : `${format(currentPeriodStart, 'MMM yyyy')} - ${format(addMonths(currentPeriodStart, 2), 'MMM yyyy')}`
                }
              </h4>
              
              <button 
                onClick={() => navigatePeriod('next')}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className={`grid gap-1 ${
              viewMode === 'week' 
                ? 'grid-cols-7' 
                : 'grid-cols-7'
            }`}>
              {/* Show day labels for week view */}
              {viewMode === 'week' && ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs uppercase text-center text-gray-500 dark:text-gray-400 py-1">
                  {day}
                </div>
              ))}
              
              {/* Show day labels for month/quarter view */}
              {viewMode !== 'week' && ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} className="text-xs uppercase text-center text-gray-500 dark:text-gray-400 py-1">
                  {day}
                </div>
              ))}
              
              {/* Calendar grid - with empty slots for month/quarter view */}
              {viewMode !== 'week' && Array.from({ length: currentPeriodStart.getDay() }, (_, i) => (
                <div key={`empty-start-${i}`} className="p-2"></div>
              ))}
              
              {getDaysToDisplay().map((day, i) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const hasActivity = heatmapData[dateKey] && heatmapData[dateKey] > 0;
                const intensity = hasActivity 
                  ? heatmapData[dateKey] < 30 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : heatmapData[dateKey] < 60 
                      ? 'bg-green-200 dark:bg-green-800/40' 
                      : heatmapData[dateKey] < 120 
                        ? 'bg-green-300 dark:bg-green-700/50' 
                        : 'bg-green-400 dark:bg-green-600/60'
                  : '';
                
                return (
                  <button
                    key={i}
                    className={`
                      ${viewMode === 'week' ? 'p-1' : 'p-1 h-12'}
                      rounded-md text-center transition-colors
                      ${isSameDay(day, selectedDate) 
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                        : intensity || 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                    `}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`
                      ${viewMode === 'week' ? 'text-lg' : 'text-sm'} font-semibold 
                      ${isSameDay(day, new Date()) 
                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' 
                        : ''}
                    `}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Activity indicator */}
                    {hasActivity && viewMode === 'week' && (
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {Math.round(heatmapData[dateKey])} min
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Study Activity Heatmap */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-medium">Study Activity</h3>
          </div>
          
          <div className="p-4">
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 90 }, (_, i) => {
                const day = addDays(new Date(), -89 + i);
                const dateKey = format(day, 'yyyy-MM-dd');
                const minutes = heatmapData[dateKey] || 0;
                
                let bgClass = 'bg-gray-100 dark:bg-gray-700';
                if (minutes > 0) {
                  if (minutes < 30) bgClass = 'bg-green-100 dark:bg-green-900/30';
                  else if (minutes < 60) bgClass = 'bg-green-300 dark:bg-green-800/50';
                  else if (minutes < 120) bgClass = 'bg-green-500 dark:bg-green-700';
                  else bgClass = 'bg-green-700 dark:bg-green-600';
                }
                
                return (
                  <div 
                    key={i}
                    className={`h-4 w-4 rounded-sm ${bgClass}`}
                    title={`${format(day, 'MMM d')}: ${minutes} minutes`}
                  ></div>
                );
              })}
            </div>
            
            <div className="mt-2 flex justify-end items-center text-xs text-gray-500 dark:text-gray-400">
              <span className="mr-1">Less</span>
              <div className="flex space-x-1">
                <div className="h-3 w-3 rounded-sm bg-gray-100 dark:bg-gray-700"></div>
                <div className="h-3 w-3 rounded-sm bg-green-100 dark:bg-green-900/30"></div>
                <div className="h-3 w-3 rounded-sm bg-green-300 dark:bg-green-800/50"></div>
                <div className="h-3 w-3 rounded-sm bg-green-500 dark:bg-green-700"></div>
                <div className="h-3 w-3 rounded-sm bg-green-700 dark:bg-green-600"></div>
              </div>
              <span className="ml-1">More</span>
            </div>
            
            {/* Simple analytics summary */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Object.keys(heatmapData).length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Days Studied
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Object.values(heatmapData).reduce((sum, val) => sum + val, 0)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Height Task and Session Containers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Tasks for selected day - Fixed height with scrollable content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col h-96">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium">Tasks for {format(selectedDate, 'MMM d')}</h3>
            <button
              onClick={() => setShowTaskModal(true)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="p-6 text-center">
                <CheckSquare className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  No tasks for this day
                </p>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="mt-3 inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                >
                  <Plus size={16} className="mr-1" />
                  Add Task
                </button>
              </div>
            ) : (
              <ul className="divide-y dark:divide-gray-700">
                {tasks.map(task => (
                  <li key={task.id} className="p-4 flex items-start">
                    <button
                      onClick={() => toggleTaskCompletion(task)}
                      className={`p-1 rounded-md mr-3 flex-shrink-0 ${
                        task.completed 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      <CheckSquare size={20} className={task.completed ? 'fill-current' : ''} />
                    </button>
                    
                    <div className="flex-1">
                      <p className={`font-medium ${
                        task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''
                      }`}>
                        {task.title}
                      </p>
                      
                      {task.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {task.description}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getSubjectName(task.subjectId)}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => task.id && deleteTask(task.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Study Sessions for selected day - Fixed height with scrollable content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col h-96">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium">Study Sessions for {format(selectedDate, 'MMM d')}</h3>
            <button
              onClick={() => setShowSessionModal(true)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  No study sessions for this day
                </p>
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="mt-3 inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                >
                  <Plus size={16} className="mr-1" />
                  Add Session
                </button>
              </div>
            ) : (
              <ul className="divide-y dark:divide-gray-700">
                {sessions.map(session => (
                  <li key={session.id} className="p-4 flex items-start">
                    <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/30 mr-3">
                      <Clock size={20} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium">
                        {getSubjectName(session.subjectId)}
                      </p>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {session.duration} minutes
                      </p>
                      
                      {session.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {session.notes}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => session.id && deleteSession(session.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-medium">Add New Task</h3>
            </div>
            
            <form onSubmit={addTask} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <select
                  value={taskForm.subjectId}
                  onChange={(e) => setTaskForm({ ...taskForm, subjectId: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm text-sm"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-medium">Add Study Session</h3>
            </div>
            
            <form onSubmit={addSession} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <select
                  value={sessionForm.subjectId}
                  onChange={(e) => setSessionForm({ ...sessionForm, subjectId: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={sessionForm.duration}
                  onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  min="1"
                  required
                />
              </div>
              
                            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm text-sm"
                >
                  Add Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;