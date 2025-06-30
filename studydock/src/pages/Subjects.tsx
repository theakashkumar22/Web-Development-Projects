import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { useSubjects } from '../hooks/useSubjects';
import { Subject } from '../db/database';

const Subjects: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject } = useSubjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#4F46E5' });

  const openAddModal = () => {
    setCurrentSubject(null);
    setFormData({ name: '', color: '#4F46E5' });
    setIsModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setCurrentSubject(subject);
    setFormData({ 
      name: subject.name, 
      color: subject.color || '#4F46E5' 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentSubject) {
      // Update existing subject
      if (currentSubject.id) {
        await updateSubject(currentSubject.id, formData);
      }
    } else {
      // Add new subject
      await addSubject(formData);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this subject? All notes, flashcards, and quizzes in this subject will also be deleted.')) {
      await deleteSubject(id);
    }
  };

  const colorOptions = [
    { name: 'Indigo', value: '#4F46E5' },
    { name: 'Teal', value: '#0D9488' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Rose', value: '#E11D48' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Purple', value: '#7C3AED' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Subjects</h2>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
        >
          <Plus size={18} className="mr-1" />
          Add Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No subjects yet</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Get started by adding your first subject
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          >
            <Plus size={18} className="mr-1" />
            Add Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div 
              key={subject.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md"
            >
              <div 
                className="h-2" 
                style={{ backgroundColor: subject.color || '#4F46E5' }}
              ></div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">{subject.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(subject)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => subject.id && handleDelete(subject.id)}
                      className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <Link
                    to={`/subjects/${subject.id}/notes`}
                    className="flex-1 text-center py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Notes
                  </Link>
                  <Link
                    to={`/subjects/${subject.id}/flashcards`}
                    className="flex-1 text-center py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Flashcards
                  </Link>
                  <Link
                    to={`/subjects/${subject.id}/quizzes`}
                    className="flex-1 text-center py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Quizzes
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-medium">
                {currentSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Color
                </label>
                <div className="flex space-x-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      style={{ backgroundColor: color.value }}
                      className={`w-8 h-8 rounded-full ${
                        formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm text-sm"
                >
                  {currentSubject ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;