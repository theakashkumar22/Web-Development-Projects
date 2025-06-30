import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../db/database';
import { Settings as SettingsIcon, Moon, Sun, Trash, Database } from 'lucide-react';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [dbSize, setDbSize] = useState<string>('Calculating...');
  const [isClearing, setIsClearing] = useState(false);
  
  // Calculate database size
  useEffect(() => {
    const calculateSize = async () => {
      try {
        // Get counts from each table
        const subjectsCount = await db.subjects.count();
        const notesCount = await db.notes.count();
        const flashcardsCount = await db.flashcards.count();
        const quizzesCount = await db.quizzes.count();
        const sessionsCount = await db.studySessions.count();
        const tasksCount = await db.studyTasks.count();
        
        // Display total items
        const totalItems = subjectsCount + notesCount + flashcardsCount + 
                          quizzesCount + sessionsCount + tasksCount;
        
        setDbSize(`${totalItems} items`);
      } catch (error) {
        console.error('Error calculating database size:', error);
        setDbSize('Unknown');
      }
    };
    
    calculateSize();
  }, []);

  // Clear all data
  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
      try {
        setIsClearing(true);
        
        // Delete and recreate database
        await db.delete();
        await db.open();
        
        // Update size
        setDbSize('0 items');
        
        setIsClearing(false);
        alert('All data has been cleared successfully.');
      } catch (error) {
        console.error('Error clearing database:', error);
        setIsClearing(false);
        alert('An error occurred while clearing data. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <SettingsIcon className="h-6 w-6 text-indigo-500 mr-2" />
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          
          {/* Appearance */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 border-b pb-2 dark:border-gray-700">
              Appearance
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose light or dark mode
                </p>
              </div>
              
              <button
                onClick={toggleTheme}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition
                    ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
                <span className="sr-only">Toggle Theme</span>
                {theme === 'dark' ? (
                  <Moon size={12} className="absolute right-1 text-indigo-200" />
                ) : (
                  <Sun size={12} className="absolute left-1 text-amber-400" />
                )}
              </button>
            </div>
          </div>
          
          {/* Data Management */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 border-b pb-2 dark:border-gray-700">
              Data Management
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Local Database Size</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Amount of data stored in your browser
                  </p>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm">
                  <Database size={14} className="inline mr-1" />
                  {dbSize}
                </div>
              </div>
              
              <div>
                <button
                  onClick={clearAllData}
                  disabled={isClearing}
                  className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isClearing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Clearing Data...
                    </>
                  ) : (
                    <>
                      <Trash size={18} className="mr-2" />
                      Clear All Data
                    </>
                  )}
                </button>
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                  Warning: This will permanently delete all your subjects, notes, flashcards, and study records.
                </p>
              </div>
            </div>
          </div>
          
          {/* About */}
          <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2 dark:border-gray-700">
              About StudyDock
            </h3>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Version: 1.0.0
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                StudyDock is an offline-first study companion that helps you organize notes, 
                create flashcards, generate quizzes, and track your study progress.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All your data is stored locally on your device for privacy and offline access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;