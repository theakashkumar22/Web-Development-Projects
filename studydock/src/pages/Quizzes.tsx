import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Quiz, QuizQuestion } from '../db/database';
import { Plus, HelpCircle, Check, X, PlayCircle, Award, ArrowLeft, Loader, AlertCircle, ChevronLeft, ChevronRight, Settings, Trash } from 'lucide-react';
import { format, isToday, startOfDay } from 'date-fns';

const Quizzes: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string | string[]>>({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationsToday, setGenerationsToday] = useState(0);
  const [generationLimitReached, setGenerationLimitReached] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [showSettings, setShowSettings] = useState(false);
  const [showNoteSelector, setShowNoteSelector] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const [quizName, setQuizName] = useState('');
  const [showQuizCreationModal, setShowQuizCreationModal] = useState(false);
  
  // Maximum generations allowed per day
  const MAX_GENERATIONS_PER_DAY = 3;
  // Question count limits
  const MIN_QUESTIONS = 5;
  const MAX_QUESTIONS = 15;

  // Fetch quizzes for the current subject
  const quizzes = useLiveQuery(
    () => {
      if (!subjectId) return [];
      return db.quizzes
        .where('subjectId')
        .equals(parseInt(subjectId))
        .reverse()
        .sortBy('updatedAt');
    },
    [subjectId]
  ) || [];
  
  // Fetch notes for the current subject
  const notes = useLiveQuery(
    () => {
      if (!subjectId) return [];
      return db.notes
        .where('subjectId')
        .equals(parseInt(subjectId))
        .toArray();
    },
    [subjectId]
  ) || [];
  
  // Check and update generation count on component mount - now using localStorage to persist count
  useEffect(() => {
    const checkGenerationLimit = async () => {
      if (!subjectId) return;
      
      try {
        // Get today's date at midnight for comparison
        const todayStart = startOfDay(new Date()).getTime();
        
        // Check local storage for today's generation count
        const storedDate = localStorage.getItem(`quiz_gen_date_${subjectId}`);
        const storedCount = localStorage.getItem(`quiz_gen_count_${subjectId}`);
        
        // If date matches and count exists, use it; otherwise reset
        if (storedDate && parseInt(storedDate) === todayStart && storedCount) {
          const count = parseInt(storedCount);
          setGenerationsToday(count);
          setGenerationLimitReached(count >= MAX_GENERATIONS_PER_DAY);
        } else {
          // Reset for new day
          localStorage.setItem(`quiz_gen_date_${subjectId}`, todayStart.toString());
          localStorage.setItem(`quiz_gen_count_${subjectId}`, '0');
          setGenerationsToday(0);
          setGenerationLimitReached(false);
        }
      } catch (error) {
        console.error("Error checking generation limit:", error);
      }
    };
    
    checkGenerationLimit();
  }, [subjectId, MAX_GENERATIONS_PER_DAY]);

  // Toggle note selection
  const toggleNoteSelection = (noteId: number) => {
    setSelectedNotes(prev => 
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  // Select all notes
  const selectAllNotes = () => {
    const allNoteIds = notes.map(note => note.id as number);
    setSelectedNotes(allNoteIds);
  };

  // Clear note selection
  const clearNoteSelection = () => {
    setSelectedNotes([]);
  };

  // Open the quiz creation modal with note selection requirement
  const openQuizCreationModal = () => {
    // Check if generation limit is reached
    if (generationLimitReached) {
      setGenerationError(`Daily limit reached (${MAX_GENERATIONS_PER_DAY}/day). Try again tomorrow.`);
      return;
    }
    
    setShowQuizCreationModal(true);
    // Default to empty note selection
    setSelectedNotes([]);
    // Generate default quiz name
    const now = new Date();
    setQuizName(`MCQ Quiz (${questionCount} Q) ${format(now, 'MMM d, yyyy')}`);
  };

  // Gemini API key
  const GEMINI_API_KEY = 'AIzaSyB8sB1FhxLfbztTVeUg47-gn5MyvRmmjsw';
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

  // Generate a quiz using Gemini API - Now with custom quiz name and required note selection
  const generateQuiz = async () => {
    // Check if generation limit is reached
    if (generationLimitReached) {
      setGenerationError(`Daily limit reached (${MAX_GENERATIONS_PER_DAY}/day). Try again tomorrow.`);
      return;
    }
    
    // Check if notes are selected
    if (selectedNotes.length === 0) {
      setGenerationError('Please select at least one note to generate a quiz from.');
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Fetch the selected notes
      const notesToUse = await db.notes
        .where('id')
        .anyOf(selectedNotes)
        .toArray();
      
      if (notesToUse.length === 0) {
        throw new Error('No notes available to generate a quiz from.');
      }
      
      // Create content from notes for context
      const noteContents = notesToUse.map(note => 
        `Note Title: ${note.title}\nContent: ${note.content}`
      ).join('\n\n');
      
      // Prepare the prompt for Gemini
      const prompt = `Based on the following study notes, create a comprehensive quiz with exactly ${questionCount} multiple-choice questions.
      
      For each question:
      - Create challenging, thought-provoking questions that test deep understanding
      - Provide exactly 4 answer options (A, B, C, D)
      - Include one clear correct answer and three plausible distractors
      - Ensure all options are approximately the same length
      - Avoid patterns in correct answer positions
      
      Format the response as a JSON array of questions following this structure:
      [
        {
          "question": "The question text",
          "type": "mcq",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "The correct answer text exactly matching one of the options"
        }
      ]
      
      Make sure the questions test understanding of important concepts from the notes and cover a broad range of topics.
      
      Here are the study notes:
      
      ${noteContents}`;

      // Call Gemini API
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Extract and parse the JSON response
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Find JSON in the response (in case the model adds explanatory text)
      const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
      let questionsJson;
      
      if (jsonMatch) {
        questionsJson = jsonMatch[0];
      } else {
        // If no obvious JSON bracket syntax, try the whole response
        questionsJson = responseText;
      }
      
      // Parse the JSON to get the questions
      const questions = JSON.parse(questionsJson);
      
      // Validate the questions
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format received from the API');
      }
      
      // Validate each question and ensure they're all MCQs
      const validatedQuestions = questions.map(q => {
        // Make sure all required fields are present
        if (!q.question || !q.correctAnswer) {
          throw new Error('One or more questions are missing required fields');
        }
        
        // Force type to be MCQ
        q.type = 'mcq';
        
        // Make sure MCQ questions have options
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error('MCQ questions must have exactly 4 options');
        }
        
        // Verify correct answer is one of the options
        if (!q.options.includes(q.correctAnswer)) {
          throw new Error('Correct answer must be one of the options provided');
        }
        
        return q;
      });
      
      // Limit to exactly the requested question count or pad if needed
      let finalQuestions = validatedQuestions;
      if (validatedQuestions.length > questionCount) {
        finalQuestions = validatedQuestions.slice(0, questionCount);
      } else if (validatedQuestions.length < questionCount) {
        console.warn(`Only ${validatedQuestions.length} questions were generated instead of ${questionCount}`);
        finalQuestions = validatedQuestions;
      }
      
      // Save the quiz to the database with custom name
      const now = new Date();
      const quizData: Omit<Quiz, 'id'> = {
        subjectId: parseInt(subjectId || '0'),
        title: quizName, // Use the custom name provided by the user
        questions: finalQuestions,
        createdAt: now,
        updatedAt: now
      };
      
      await db.quizzes.add(quizData);
      
      // Update generation count after successful quiz creation
      const newCount = generationsToday + 1;
      setGenerationsToday(newCount);
      setGenerationLimitReached(newCount >= MAX_GENERATIONS_PER_DAY);
      
      // Update stored count
      localStorage.setItem(`quiz_gen_count_${subjectId}`, newCount.toString());
      
      // Close modal after successful generation
      setShowQuizCreationModal(false);
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Start a quiz
  const startQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizComplete(false);
    setIsQuizMode(true);
  };

  // Submit answer for current question
  const submitAnswer = (answer: string | string[]) => {
    if (!currentQuiz) return;
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  // Move to next question
  const nextQuestion = () => {
    if (!currentQuiz) return;
    
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeQuiz();
    }
  };

  // Move to previous question
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Complete the quiz and calculate score
  const completeQuiz = async () => {
    if (!currentQuiz || !currentQuiz.id) return;
    
    // Calculate score
    let correctCount = 0;
    
    currentQuiz.questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      if (!userAnswer) return;
      
      // For MCQs, exact match
      if (userAnswer === question.correctAnswer) {
        correctCount++;
      }
    });
    
    const score = Math.round((correctCount / currentQuiz.questions.length) * 100);
    
    // Update quiz with new score
    await db.quizzes.update(currentQuiz.id, {
      lastScore: score,
      updatedAt: new Date()
    });
    
    // Reload quiz data with updated score
    if (currentQuiz.id) {
      const updatedQuiz = await db.quizzes.get(currentQuiz.id);
      setCurrentQuiz(updatedQuiz || null);
    }
    
    setQuizComplete(true);
  };

  // Delete a quiz
  const deleteQuiz = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      await db.quizzes.delete(id);
      
      if (currentQuiz && currentQuiz.id === id) {
        setCurrentQuiz(null);
        setIsQuizMode(false);
      }
    }
  };

  // Check if the answer is correct (for showing feedback)
  const isAnswerCorrect = (questionIndex: number, answer: string | string[]): boolean => {
    if (!currentQuiz) return false;
    const question = currentQuiz.questions[questionIndex];
    const userAnswer = userAnswers[questionIndex];
    
    if (!userAnswer || !question) return false;
    
    // For MCQs, exact match
    return userAnswer === question.correctAnswer;
  };

  // Render the quiz settings panel (now only for question count)
  const renderQuizSettings = () => {
    return (
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center">
            <Settings size={18} className="mr-2" />
            Quiz Settings
          </h3>
          <button 
            onClick={() => setShowSettings(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Number of Questions ({MIN_QUESTIONS}-{MAX_QUESTIONS})
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={MIN_QUESTIONS}
              max={MAX_QUESTIONS}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-8 text-center font-medium">{questionCount}</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          More questions provide comprehensive coverage but take longer to generate and complete.
        </div>
      </div>
    );
  };

  // Render the quiz creation modal with note selection and quiz name
  const renderQuizCreationModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium">Create New Quiz</h3>
              <button 
                onClick={() => setShowQuizCreationModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Quiz Name Input */}
            <div className="mb-6">
              <label htmlFor="quizName" className="block text-sm font-medium mb-1">
                Quiz Name
              </label>
              <input
                type="text"
                id="quizName"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                placeholder="Enter quiz name"
              />
            </div>
            
            {/* Number of Questions */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Number of Questions ({MIN_QUESTIONS}-{MAX_QUESTIONS})
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={MIN_QUESTIONS}
                  max={MAX_QUESTIONS}
                  value={questionCount}
                  onChange={(e) => {
                    const newCount = parseInt(e.target.value);
                    setQuestionCount(newCount);
                    // Update the quiz name when question count changes
                    setQuizName(prev => {
                      // Replace the number in parentheses with the new count
                      return prev.replace(/\(\d+\sQ\)/, `(${newCount} Q)`);
                    });
                  }}
                  className="flex-1"
                />
                <span className="w-8 text-center font-medium">{questionCount}</span>
              </div>
            </div>
            
            {/* Note Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Select Notes for Quiz Generation</h4>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllNotes}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearNoteSelection}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              {notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No notes available for this subject. Create some notes first.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                  {notes.map(note => (
                    <div
                      key={note.id}
                      className={`
                        p-3 border rounded-md cursor-pointer
                        ${selectedNotes.includes(note.id as number)
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
                      `}
                      onClick={() => {
                        toggleNoteSelection(note.id as number);
                        
                        // Update quiz name when a note is selected
                        if (!selectedNotes.includes(note.id as number) && selectedNotes.length === 0) {
                          // When first note is selected, include its title in the quiz name
                          const now = new Date();
                          setQuizName(`${note.title || 'Untitled'} - MCQ Quiz (${questionCount} Q) ${format(now, 'MMM d, yyyy')}`);
                        }
                      }}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className={`
                              w-4 h-4 border rounded
                              ${selectedNotes.includes(note.id as number)
                                ? 'bg-indigo-500 border-indigo-500'
                                : 'border-gray-300 dark:border-gray-600'}
                            `}
                          >
                            {selectedNotes.includes(note.id as number) && (
                              <Check size={16} className="text-white" />
                            )}
                          </div>
                        </div>
                        <div className="ml-3 flex-1 truncate">
                          <div className="font-medium">
                            {note.title || 'Untitled Note'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {note.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedNotes.length > 0 && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {selectedNotes.length} note{selectedNotes.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
            
            {generationError && (
              <div className="mb-4 p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md">
                <p>{generationError}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowQuizCreationModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={generateQuiz}
                disabled={isGenerating || selectedNotes.length === 0}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader size={18} className="mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus size={18} className="mr-1" />
                    Generate Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the current question (MCQ only now)
  const renderQuestion = () => {
    if (!currentQuiz) return null;
    
    const question = currentQuiz.questions[currentQuestionIndex];
    if (!question) return null;
    
    const userAnswer = userAnswers[currentQuestionIndex];
    
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">{question.question}</h3>
        <div className="space-y-2">
          {question.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => submitAnswer(option)}
              className={`w-full text-left p-3 border rounded-md transition-colors ${
                userAnswer === option 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Quiz result view
  const renderQuizResult = () => {
    if (!currentQuiz) return null;
    
    return (
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
          <Award size={36} />
        </div>
        
        <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
        
        <div className="mb-4">
          <span className="text-lg">Your score: </span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {currentQuiz.lastScore}%
          </span>
        </div>

        {/* Question review section */}
        <div className="mt-6 max-w-md mx-auto">
          <h4 className="font-medium text-lg mb-4 text-left">Review Questions:</h4>
          
          {currentQuiz.questions.map((question, index) => (
            <div key={index} className="mb-4 text-left p-4 border border-gray-200 dark:border-gray-700 rounded-md">
              <div className="flex items-start">
                <div className="mr-2 mt-1">
                  {isAnswerCorrect(index, userAnswers[index] || '') ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{question.question}</p>
                  <p className="text-sm mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Your answer: </span>
                    {userAnswers[index] || 'Not answered'}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Correct answer: </span>
                    {question.correctAnswer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setIsQuizMode(false)}
          className="mt-6 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
        >
          <ArrowLeft size={18} className="mr-1" />
          Back to Quizzes
        </button>
      </div>
    );
  };

  if (isQuizMode) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        {quizComplete ? (
          // Quiz results
          renderQuizResult()
        ) : (
          // Quiz in progress
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">{currentQuiz?.title}</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {currentQuiz?.questions.length}
              </div>
            </div>
            
            <div className="mb-8">
              {renderQuestion()}
            </div>
            
            {/* Navigation controls */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="inline-flex items-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </button>
              
              <button
                onClick={nextQuestion}
                className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
              >
                {currentQuestionIndex < (currentQuiz?.questions.length || 0) - 1 ? (
                  <>
                    Next <ChevronRight size={16} className="ml-1" />
                  </>
                ) : (
                  'Complete Quiz'
                )}
              </button>
            </div>
            
            <div className="mt-8 border-t pt-4 dark:border-gray-700">
              <button
                onClick={() => setIsQuizMode(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Exit Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={openQuizCreationModal}
            disabled={isGenerating || generationLimitReached}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader size={18} className="mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus size={18} className="mr-1" />
                New Quiz
              </>
            )}
          </button>
        </div>
        
        {/* Generation count indicator */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Generations today: <span className="font-medium">{generationsToday}/{MAX_GENERATIONS_PER_DAY}</span>
          {generationLimitReached && (
            <span className="ml-2 text-amber-600 dark:text-amber-400 flex items-center">
              <AlertCircle size={14} className="mr-1" /> Limit reached
            </span>
          )}
        </div>
      </div>
      
      
      
      {/* Error message display */}
      {generationError && !showQuizCreationModal && (
        <div className="mb-6 p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md">
          <p>{generationError}</p>
        </div>
      )}
      
      {/* Quiz list */}
      <div className="space-y-4">
        {quizzes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <HelpCircle size={36} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No quizzes yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Create your first quiz to test your knowledge on this subject.
            </p>
            <button
              onClick={openQuizCreationModal}
              disabled={isGenerating || generationLimitReached}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} className="mr-1" />
              Generate Quiz
            </button>
          </div>
        ) : (
          quizzes.map(quiz => (
            <div 
              key={quiz.id} 
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{quiz.title}</h3>
                <div className="flex items-center">
                  {quiz.lastScore !== undefined && (
                    <span className="mr-4 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-sm">
                      Score: {quiz.lastScore}%
                    </span>
                  )}
                  <button
                    onClick={() => startQuiz(quiz)}
                    className="flex items-center mr-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                  >
                    <PlayCircle size={16} className="mr-1" />
                    Start
                  </button>
                  <button
                    onClick={() => quiz.id && deleteQuiz(quiz.id)}
                    className="px-2 py-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {quiz.questions.length} questions · 
                {quiz.updatedAt && isToday(new Date(quiz.updatedAt))
                  ? ` Updated today at ${format(new Date(quiz.updatedAt), 'h:mm a')}`
                  : quiz.updatedAt
                    ? ` Updated on ${format(new Date(quiz.updatedAt), 'MMM d, yyyy')}`
                    : ' Recently created'
                }
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Quiz creation modal */}
      {showQuizCreationModal && renderQuizCreationModal()}
    </div>
  );
};

export default Quizzes;