import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import SubjectDetail from './pages/SubjectDetail';
import Notes from './pages/Notes';
import Flashcards from './pages/Flashcards';
import Quizzes from './pages/Quizzes';
import StudyPlanner from './pages/StudyPlanner';
import BackupRestore from './pages/BackupRestore';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import AIChat from './components/AIChat';
import SplashScreen from './components/SplashScreen';
import TourGuide from './components/TourGuide';
import PomodoroTimer from './components/PomodoroTimer';
import LandingPage from './components/LandingPage';

// This component handles route checking for conditional rendering
const AppContent = () => {
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (!hasVisited) {
      setShowTour(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);

  const handleTourComplete = () => {
    setShowTour(false);
  };

  const handleTourSkip = () => {
    setShowTour(false);
  };

  // Check if the current path includes 'quizzes'
  const isQuizzesPage = location.pathname.includes('/quizzes');

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout onPomodoroToggle={() => setShowPomodoro(!showPomodoro)} />}>
          <Route index element={<Dashboard />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="subjects/:subjectId" element={<SubjectDetail />}>
            <Route path="notes" element={<Notes />} />
            <Route path="flashcards" element={<Flashcards />} />
            <Route path="quizzes" element={<Quizzes />} />
          </Route>
          <Route path="planner" element={<StudyPlanner />} />
          <Route path="backup" element={<BackupRestore />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      
      {/* Only show AIChat if not on the quizzes page */}
      {!isQuizzesPage && <AIChat />}
      
      {showPomodoro && (
        <PomodoroTimer onClose={() => setShowPomodoro(false)} />
      )}
      
      {showTour && (
        <TourGuide 
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showLanding, setShowLanding] = useState(false);
  
  useEffect(() => {
    // Check if this is the very first visit
    const isFirstVisit = !localStorage.getItem('hasSeenLanding');
    setShowLanding(isFirstVisit);
  }, []);
  
  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleGetStarted = () => {
    setShowLanding(false);
    localStorage.setItem('hasSeenLanding', 'true');
  };

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <ThemeProvider>
      <Router>
        {showSplash ? (
          <SplashScreen onComplete={handleSplashComplete} />
        ) : (
          <AppContent />
        )}
      </Router>
    </ThemeProvider>
  );
}

export default App;