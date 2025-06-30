import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Brain, Calendar } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Fade in content after mount
    const contentTimer = setTimeout(() => setShowContent(true), 500);
    
    // Auto-complete after animation
    const completeTimer = setTimeout(onComplete, 3000);
    
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
      <div className={`text-center transition-opacity duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <BookOpen size={48} className="text-indigo-600 dark:text-indigo-400" />
            <div className="absolute -top-1 -right-1">
              <Sparkles size={20} className="text-amber-500" />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">StudyDock</h1>
        <p className="text-gray-600 dark:text-gray-400">Your Offline-First Study Companion</p>
        
        <div className="mt-8">
          <div className="animate-pulse flex justify-center space-x-1">
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;