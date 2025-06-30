import React, { useState } from 'react';
import { db } from '../db/database';
import { Download, Upload, Info, Check, AlertTriangle } from 'lucide-react';

const BackupRestore: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Export all data
  const exportData = async () => {
    try {
      setIsExporting(true);
      setMessage(null);
      
      // Collect all data from the database
      const subjects = await db.subjects.toArray();
      const notes = await db.notes.toArray();
      const flashcards = await db.flashcards.toArray();
      const quizzes = await db.quizzes.toArray();
      const studySessions = await db.studySessions.toArray();
      const studyTasks = await db.studyTasks.toArray();
      
      // Create export object
      const exportData = {
        subjects,
        notes,
        flashcards,
        quizzes,
        studySessions,
        studyTasks,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      // Convert to JSON and create download
      const jsonStr = JSON.stringify(exportData);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `studystash-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ type: 'error', text: 'Failed to export data. Please try again.' });
    } finally {
      setIsExporting(false);
    }
  };

  // Import data from file
  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      setMessage(null);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          // Validate data structure
          if (!data.subjects || !data.notes || !data.flashcards) {
            throw new Error('Invalid backup file format');
          }
          
          // Confirm import
          if (!window.confirm('This will replace all your existing data. Are you sure you want to proceed?')) {
            setIsImporting(false);
            return;
          }
          
          // Clear existing database
          await db.delete();
          await db.open();
          
          // Import data
          if (data.subjects.length) await db.subjects.bulkAdd(data.subjects);
          if (data.notes.length) await db.notes.bulkAdd(data.notes);
          if (data.flashcards.length) await db.flashcards.bulkAdd(data.flashcards);
          if (data.quizzes.length) await db.quizzes.bulkAdd(data.quizzes);
          if (data.studySessions.length) await db.studySessions.bulkAdd(data.studySessions);
          if (data.studyTasks.length) await db.studyTasks.bulkAdd(data.studyTasks);
          
          setMessage({ type: 'success', text: 'Data imported successfully! Refresh the page to see your data.' });
        } catch (error) {
          console.error('Import error:', error);
          setMessage({ type: 'error', text: 'Failed to import data. Make sure the file is a valid StudyStash backup.' });
        } finally {
          setIsImporting(false);
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('File reading error:', error);
      setMessage({ type: 'error', text: 'Failed to read the file. Please try again.' });
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Data Backup & Restore</h2>
          
          <div className="flex items-start bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg mb-6">
            <Info className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">About Backups</p>
              <p className="mt-1 text-sm">
                StudyDock stores all your data locally on your device. Regular backups ensure your study materials are safe.
                Export your data periodically and store the file in a secure location.
              </p>
            </div>
          </div>
          
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            }`}>
              {message.type === 'success' ? (
                <Check className="h-5 w-5 mb-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 mb-2" />
              )}
              <p>{message.text}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export */}
            <div className="border dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Export Data</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Export all your subjects, notes, flashcards, quizzes, and study records as a JSON file.
              </p>
              <button
                onClick={exportData}
                disabled={isExporting}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={18} className="mr-2" />
                    Export Backup
                  </>
                )}
              </button>
            </div>
            
            {/* Import */}
            <div className="border dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Restore Data</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Import a previously exported backup file to restore your data.
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                  Warning: This will replace all existing data!
                </span>
              </p>
              <label className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                {isImporting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={18} className="mr-2" />
                    Import Backup
                  </>
                )}
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          
          <div className="mt-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Google Drive Integration</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Connect your Google Drive account to automatically back up your data to the cloud.
              Your data will be encrypted before uploading to ensure privacy.
            </p>
            <button
              onClick={() => alert('This feature is coming soon!')}
              className="flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Connect Google Drive
              <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded">
                Coming Soon
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;