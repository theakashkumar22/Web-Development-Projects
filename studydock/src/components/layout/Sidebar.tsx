import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, UploadCloud as CloudUpload, Settings, X, PanelLeft, PanelRight } from 'lucide-react';
import { useSubjects } from '../../hooks/useSubjects';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onToggle, isMobile }) => {
  const { subjects } = useSubjects();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:sticky top-0 left-0 z-30 h-screen
          ${isOpen ? 'w-72' : 'w-16'} 
          bg-white dark:bg-gray-800 
          transform ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          transition-all duration-300 ease-in-out
          border-r border-gray-200 dark:border-gray-700
          flex flex-col
        `}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-700">
          <NavLink to="/" className="flex items-center space-x-2">
            {isOpen && <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
            {isOpen && <span className="text-lg font-semibold">StudyDock</span>}
          </NavLink>
          {isMobile ? (
            <button 
              onClick={onClose}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          ) : (
            <button
              onClick={onToggle}
              className={`hidden md:block p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                !isOpen ? "absolute left-1/2 transform -translate-x-1/2" : ""
              }`}
            >
              {isOpen ? <PanelRight size={20} /> : <PanelLeft size={20} />}
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-1">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" isOpen={isOpen} />
            
            {/* Subjects section */}
            <li className="mt-5">
              {isOpen && (
                <div className="px-3 pb-1 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                  Subjects
                </div>
              )}
              <ul className="space-y-1">
                <NavItem 
                  to="/subjects" 
                  icon={<BookOpen size={20} />} 
                  label="All Subjects" 
                  exact
                  isOpen={isOpen}
                />
                {isOpen && // Render subjects only when isOpen is true
                  subjects.map(subject => (
                    <NavItem 
                      key={subject.id}
                      to={`/subjects/${subject.id}`}
                      icon={
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: subject.color || '#4F46E5' }}
                        ></div>
                      }
                      label={subject.name}
                      className="pl-8 pr-3"
                      activeClassName="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      isOpen={isOpen}
                    />
                  ))
                }
              </ul>
            </li>

            {/* Other main links */}
            <li className="mt-5">
              {isOpen && (
                <div className="px-3 pb-1 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                  Tools
                </div>
              )}
            </li>
            <NavItem to="/planner" icon={<Calendar size={20} />} label="Study Planner" isOpen={isOpen} />
            <NavItem to="/backup" icon={<CloudUpload size={20} />} label="Backup & Restore" isOpen={isOpen} />
            <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" isOpen={isOpen} />
          </ul>
        </nav>
      </aside>
    </>
  );
};

interface NavItemProps {
  to: string;
  icon?: React.ReactNode;
  label: string;
  exact?: boolean;
  className?: string;
  activeClassName?: string;
  isOpen: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ 
  to, 
  icon, 
  label, 
  exact = false,
  className = "",
  activeClassName = "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
  isOpen
}) => {
  return (
    <li>
      <NavLink
        to={to}
        end={exact}
        className={({ isActive }) => `
          flex items-center px-3 py-2 text-sm font-medium rounded-md
          transition-colors duration-150 ease-in-out
          ${className}
          ${isActive 
            ? activeClassName
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }
        `}
        title={!isOpen ? label : undefined}
      >
        {icon && <span className="mr-3">{icon}</span>}
        {isOpen && <span>{label}</span>}
      </NavLink>
    </li>
  );
};

export default Sidebar;