import React, { useEffect, useState } from 'react';
import { useParams, Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { BookOpen, Brain, HelpCircle } from 'lucide-react';
import { useSubjects } from '../hooks/useSubjects';
import { db, Subject } from '../db/database';

const SubjectDetail: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { getSubject } = useSubjects();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchSubject = async () => {
      if (subjectId) {
        try {
          const data = await getSubject(parseInt(subjectId));
          setSubject(data || null);
        } catch (error) {
          console.error('Error fetching subject:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSubject();
  }, [subjectId, getSubject]);

  // If we're directly on the subject route without a tab, redirect to notes
  if (!loading && subject && location.pathname === `/subjects/${subjectId}`) {
    return <Navigate to={`/subjects/${subjectId}/notes`} replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium mb-2">Subject not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          The subject you're looking for doesn't exist or has been deleted.
        </p>
        <Link
          to="/subjects"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to Subjects
        </Link>
      </div>
    );
  }

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  return (
    <div>
      <div 
        className="h-2 w-full rounded-full mb-4" 
        style={{ backgroundColor: subject.color || '#4F46E5' }}
      ></div>
      
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">{subject.name}</h2>
      </div>
      
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex -mb-px space-x-8">
          <NavTab 
            to={`/subjects/${subjectId}/notes`}
            isActive={isActive(`/subjects/${subjectId}/notes`)}
            icon={<BookOpen size={18} />}
            label="Notes"
          />
          <NavTab 
            to={`/subjects/${subjectId}/flashcards`}
            isActive={isActive(`/subjects/${subjectId}/flashcards`)}
            icon={<Brain size={18} />}
            label="Flashcards"
          />
          <NavTab 
            to={`/subjects/${subjectId}/quizzes`}
            isActive={isActive(`/subjects/${subjectId}/quizzes`)}
            icon={<HelpCircle size={18} />}
            label="Quizzes"
          />
        </nav>
      </div>
      
      <Outlet />
    </div>
  );
};

interface NavTabProps {
  to: string;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}

const NavTab: React.FC<NavTabProps> = ({ to, isActive, icon, label }) => {
  return (
    <Link
      to={to}
      className={`
        flex items-center pb-3 px-1 text-sm font-medium
        ${isActive 
          ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-b-2 border-transparent'
        }
      `}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </Link>
  );
};

export default SubjectDetail;