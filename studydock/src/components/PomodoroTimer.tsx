import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Settings, ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';

interface PomodoroTimerProps {
  onClose: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onClose }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 350, y: window.innerHeight - 230 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4
  });
  
  const [sessionCount, setSessionCount] = useState(0);
  const timerRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Create and inject the CSS style for no-select
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .no-select {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
    `;
    
    // Append to document head
    document.head.appendChild(styleElement);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Play notification sound
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play();
    
    if (!isBreak) {
      // Work session completed
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      
      // Determine break type
      if (newSessionCount % settings.sessionsUntilLongBreak === 0) {
        setTimeLeft(settings.longBreak * 60);
      } else {
        setTimeLeft(settings.shortBreak * 60);
      }
    } else {
      // Break completed, start work session
      setTimeLeft(settings.workDuration * 60);
    }
    
    setIsBreak(!isBreak);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimeLeft(settings.workDuration * 60);
    setIsRunning(false);
    setIsBreak(false);
    setSessionCount(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
      
      // Add class to body to make all text unselectable
      document.body.classList.add('no-select');
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const maxX = window.innerWidth - containerRef.current.offsetWidth;
      const maxY = window.innerHeight - containerRef.current.offsetHeight;
      
      setPosition({
        x: Math.min(Math.max(0, e.clientX - dragOffset.x), maxX),
        y: Math.min(Math.max(0, e.clientY - dragOffset.y), maxY)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Remove the unselectable class from body when dragging ends
    document.body.classList.remove('no-select');
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current) {
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
      setIsDragging(true);
      
      // Add class to body to make all text unselectable
      document.body.classList.add('no-select');
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && containerRef.current) {
      const touch = e.touches[0];
      const maxX = window.innerWidth - containerRef.current.offsetWidth;
      const maxY = window.innerHeight - containerRef.current.offsetHeight;
      
      setPosition({
        x: Math.min(Math.max(0, touch.clientX - dragOffset.x), maxX),
        y: Math.min(Math.max(0, touch.clientY - dragOffset.y), maxY)
      });
      
      // Prevent default to avoid scrolling while dragging
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Remove the unselectable class from body when dragging ends
    document.body.classList.remove('no-select');
  };

  useEffect(() => {
    if (isDragging) {
      // Mouse events
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      // Touch events
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      // Mouse events cleanup
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // Touch events cleanup
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      
      // Make sure to remove the class when component unmounts if it's still dragging
      if (isDragging) {
        document.body.classList.remove('no-select');
      }
    };
  }, [isDragging]);

  // Add a useEffect to handle clean up if component unmounts while dragging
  useEffect(() => {
    return () => {
      // Ensure the no-select class is removed when component unmounts
      document.body.classList.remove('no-select');
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-all ${
        isMinimized ? 'w-48' : 'w-80'
      }`}
      style={{
        top: position.y,
        left: position.x,
        zIndex: 40
      }}
    >
      {/* Header - Draggable area */}
      <div 
        className="p-3 border-b dark:border-gray-700 flex items-center justify-between cursor-move"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="flex items-center select-none">
          <Timer size={18} className="text-indigo-600 dark:text-indigo-400 mr-2" />
          {!isMinimized && (
          <span className="font-medium">
            {isBreak ? 'Break Time' : 'Focus Time'} 
          </span> )}
        </div>

        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          
          {!isMinimized && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Settings size={16} />
            </button>
          )}
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className={`p-4 ${isMinimized ? 'text-center' : ''}`}>
        <div className="text-4xl font-bold mb-4 text-center select-none">
          {formatTime(timeLeft)}
        </div>
        
        {!isMinimized && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4 select-none">
            Session {sessionCount + 1} of {settings.sessionsUntilLongBreak}
          </div>
        )}
        
        <div className="flex justify-center space-x-2">
          <button
            onClick={toggleTimer}
            className={`p-2 rounded-full ${
              isRunning
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            }`}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button
            onClick={resetTimer}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && !isMinimized && (
        <div className="p-4 border-t dark:border-gray-700">
          <h4 className="font-medium mb-3">Timer Settings</h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm">Work Duration (minutes)</label>
              <input
                type="number"
                value={settings.workDuration}
                onChange={(e) => setSettings({ ...settings, workDuration: parseInt(e.target.value) })}
                className="w-full mt-1 p-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                min="1"
                max="60"
              />
            </div>
            
            <div>
              <label className="text-sm">Short Break (minutes)</label>
              <input
                type="number"
                value={settings.shortBreak}
                onChange={(e) => setSettings({ ...settings, shortBreak: parseInt(e.target.value) })}
                className="w-full mt-1 p-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                min="1"
                max="30"
              />
            </div>
            
            <div>
              <label className="text-sm">Long Break (minutes)</label>
              <input
                type="number"
                value={settings.longBreak}
                onChange={(e) => setSettings({ ...settings, longBreak: parseInt(e.target.value) })}
                className="w-full mt-1 p-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                min="5"
                max="60"
              />
            </div>
            
            <div>
              <label className="text-sm">Sessions until Long Break</label>
              <input
                type="number"
                value={settings.sessionsUntilLongBreak}
                onChange={(e) => setSettings({ ...settings, sessionsUntilLongBreak: parseInt(e.target.value) })}
                className="w-full mt-1 p-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;