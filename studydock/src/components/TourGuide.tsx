import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourGuideProps {
  onComplete: () => void;
  onSkip: () => void;
}

const TourGuide: React.FC<TourGuideProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 2, left: 2 });
  const [tooltipTransform, setTooltipTransform] = useState('');

  const steps: TourStep[] = [
    {
      target: '[data-tour="dashboard"]',
      title: 'Welcome to StudyDock!',
      content: 'This is your dashboard where you can see an overview of your study progress.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="subjects"]',
      title: 'Manage Subjects',
      content: 'Create and organize your subjects here. Each subject can contain notes, flashcards, and quizzes.',
      placement: 'right'
    },
    {
      target: '[data-tour="planner"]',
      title: 'Study Planner',
      content: 'Plan your study sessions and track your progress with our integrated Pomodoro timer.',
      placement: 'right'
    },
    {
      target: '[data-tour="ai-chat"]',
      title: 'AI Study Assistant',
      content: 'Get help with your studies using our AI-powered study assistant.',
      placement: 'left'
    }
  ];

  useEffect(() => {
    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    return () => window.removeEventListener('resize', positionTooltip);
  }, [currentStep]);

  const positionTooltip = () => {
    const targetElement = document.querySelector(steps[currentStep].target);
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const placement = steps[currentStep].placement || 'bottom';
    
    let top = 0;
    let left = 0;
    let transform = '';
    
    // Tooltip dimensions
    const tooltipWidth = 300;
    const tooltipHeight = 150;

    switch (placement) {
      case 'top':
        top = rect.top - 10;
        left = rect.left + (rect.width / 2);
        transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        top = rect.bottom + 10;
        left = rect.left + (rect.width / 2);
        transform = 'translate(-50%, 0)';
        break;
      case 'left':
        top = rect.top + (rect.height / 2);
        left = rect.left - 10;
        transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        top = rect.top + (rect.height / 2);
        left = rect.right + 10;
        transform = 'translate(0, -50%)';
        break;
    }

    setTooltipPosition({ top, left });
    setTooltipTransform(transform);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Highlight the target element
  useEffect(() => {
    const targetElement = document.querySelector(steps[currentStep].target);
    if (targetElement) {
      targetElement.classList.add('tour-highlight');
    }
    
    return () => {
      if (targetElement) {
        targetElement.classList.remove('tour-highlight');
      }
    };
  }, [currentStep]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      <div 
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-72"
        style={{ 
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: tooltipTransform
        }}
      >
        <button 
          onClick={onSkip}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={16} />
        </button>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">{steps[currentStep].title}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {steps[currentStep].content}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep 
                    ? 'bg-indigo-600 dark:bg-indigo-400' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <ChevronLeft size={16} className="mr-1" />
                Back
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex items-center px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
            >
              {currentStep === steps.length - 1 ? (
                'Finish'
              ) : (
                <>
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add a style for highlighting the target element */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.3);
          border-radius: 4px;
        }
      `}</style>
    </>
  );
};

export default TourGuide;