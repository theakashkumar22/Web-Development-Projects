import React from 'react';
import { BookOpen, Brain, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <BookOpen size={64} className="text-indigo-600 dark:text-indigo-400" />
              <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1">
                <Brain size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Welcome to StudyDock
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Your all-in-one study companion that works offline, helping you learn smarter and achieve more.
          </p>
          
          <button
            onClick={onGetStarted}
            className="inline-flex items-center px-6 py-3 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Get Started
            <ArrowRight size={20} className="ml-2" />
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />}
            title="Smart Notes"
            description="Organize your study materials with rich text notes, tags, and AI-powered suggestions."
          />
          <FeatureCard
            icon={<Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />}
            title="Flashcards & Quizzes"
            description="Create and study with AI-generated flashcards and quizzes to test your knowledge."
          />
          <FeatureCard
            icon={<Calendar className="h-8 w-8 text-teal-600 dark:text-teal-400" />}
            title="Study Planner"
            description="Track your progress and maintain consistency with our integrated study planner."
          />
        </div>

        {/* Key Benefits */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
            Why Choose StudyDock?
          </h2>
          
          <div className="space-y-4">
            <Benefit text="Works offline - study anywhere, anytime" />
            <Benefit text="AI-powered study tools and suggestions" />
            <Benefit text="Integrated Pomodoro timer for focused study sessions" />
            <Benefit text="Free and open-source" />
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-16 rounded-lg overflow-hidden shadow-2xl">
          <img
            src="https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg"
            alt="Student studying with laptop"
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
};

const Benefit: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <CheckCircle2 className="h-5 w-5 text-green-500" />
      <span className="text-gray-700 dark:text-gray-300">{text}</span>
    </div>
  );
};

export default LandingPage;