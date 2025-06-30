import React, { useState } from 'react';
import { ArrowLeft, Save, X, ChevronDown, Tag, Clock, Video, Settings } from 'lucide-react';
import { db, Note } from '../db/database';

interface NoteEditorProps {
  note: Note | null;
  subjectId: number;
  onClose: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, subjectId, onClose }) => {
  const [form, setForm] = useState({
    title: note?.title || '',
    content: note?.content || '',
    tags: note?.tags ? note.tags.join(', ') : '',
    videoUrl: note?.videoUrl || '',
    videoTimestamp: note?.videoTimestamp ? note.videoTimestamp.toString() : ''
  });

  const [showProperties, setShowProperties] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const now = new Date();
    const tagsArray = form.tags
      ? form.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];
    
    const noteData = {
      subjectId,
      title: form.title,
      content: form.content,
      tags: tagsArray,
      videoUrl: form.videoUrl || undefined,
      videoTimestamp: form.videoTimestamp 
        ? parseInt(form.videoTimestamp) 
        : undefined,
      updatedAt: now
    };
    
    try {
      if (note && note.id) {
        await db.notes.update(note.id, noteData);
      } else {
        await db.notes.add({
          ...noteData,
          createdAt: now
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving note:", error);
      setIsSaving(false);
    }
  };

  // Close properties dropdown when clicking outside
  const closePropertiesDropdown = () => {
    if (showProperties) {
      setShowProperties(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-4 w-full max-w-xs sm:max-w-md">
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close editor"
          >
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
          
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleInputChange}
            className="text-lg sm:text-xl font-medium bg-transparent border-none focus:ring-0 px-0 w-full placeholder-gray-400 dark:placeholder-gray-500 dark:text-white"
            placeholder="Untitled Note"
            required
          />
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Properties Dropdown - Simplified on mobile */}
          <div className="relative">
            <button
              onClick={() => setShowProperties(!showProperties)}
              className="flex items-center space-x-1 px-2 py-1.5 sm:px-3 text-sm rounded-md border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-expanded={showProperties}
              aria-haspopup="true"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Properties</span>
              <ChevronDown size={16} className={`transition-transform ${showProperties ? 'rotate-180' : ''}`} />
            </button>
            
            {showProperties && (
              <>
                {/* Backdrop for closing the dropdown on mobile */}
                <div 
                  className="fixed inset-0 z-0" 
                  onClick={closePropertiesDropdown}
                  aria-hidden="true"
                />
                
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-10 p-3 space-y-4">
                  <div>
                    <label htmlFor="tags" className="flex items-center text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                      <Tag size={14} className="mr-2" />
                      Tags
                    </label>
                    <input
                      id="tags"
                      name="tags"
                      type="text"
                      value={form.tags}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border rounded-md dark:border-gray-600 dark:bg-gray-700"
                      placeholder="important, exam, review"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="videoUrl" className="flex items-center text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                      <Video size={14} className="mr-2" />
                      Video URL
                    </label>
                    <input
                      id="videoUrl"
                      name="videoUrl"
                      type="url"
                      value={form.videoUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border rounded-md dark:border-gray-600 dark:bg-gray-700"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="videoTimestamp" className="flex items-center text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                      <Clock size={14} className="mr-2" />
                      Timestamp (seconds)
                    </label>
                    <input
                      id="videoTimestamp"
                      name="videoTimestamp"
                      type="number"
                      value={form.videoTimestamp}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border rounded-md dark:border-gray-600 dark:bg-gray-700"
                      placeholder="e.g. 120 for 2:00"
                      min="0"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Cancel button - Text hidden on mobile */}
          <button
            onClick={onClose}
            className="px-2 py-1.5 sm:px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Cancel"
          >
            <X size={16} />
            <span className="hidden sm:inline ml-1">Cancel</span>
          </button>
          
          {/* Save button - Text hidden on mobile */}
          <button
            onClick={handleSave}
            disabled={isSaving || !form.title || !form.content}
            className={`px-2 py-1.5 sm:px-3 text-sm rounded-md flex items-center transition-colors ${
              isSaving || !form.title || !form.content
                ? 'bg-indigo-400 dark:bg-indigo-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700'
            } text-white`}
            aria-label="Save note"
          >
            {isSaving ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Save size={16} />
            )}
            <span className="hidden sm:inline ml-1">Save</span>
          </button>
        </div>
      </div>

      {/* Content Editor - Using flex-1 instead of h-full to prevent double scrollbar */}
      <div className="flex-1 relative">
        <textarea
          id="content"
          name="content"
          value={form.content}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full p-4 sm:p-6 border-none focus:ring-0 resize-none text-gray-800 dark:text-gray-200 dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Start writing your note here..."
          required
        />
      </div>
    </div>
  );
};

export default NoteEditor;