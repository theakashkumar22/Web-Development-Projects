import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Flashcard } from '../db/database';
import { 
  Plus, Brain, Check, X, Edit, Trash2, RotateCcw, Sparkles, AlertCircle,
  Filter, Search, ChevronDown, CheckSquare, Square, Trash
} from 'lucide-react';
import { addDays, format, isAfter, startOfDay } from 'date-fns';

const Flashcards: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [currentFlashcard, setCurrentFlashcard] = useState<Flashcard | null>(null);
  const [formData, setFormData] = useState({ front: '', back: '', tags: '' });
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [noteGenerationHistory, setNoteGenerationHistory] = useState<Record<number, Date>>({});
  
  // New state variables for filtering and batch selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // API key for Gemini Flash 2.0
  const GEMINI_API_KEY = 'AIzaSyB8sB1FhxLfbztTVeUg47-gn5MyvRmmjsw';

  // Fetch flashcards for the current subject
  const flashcards = useLiveQuery(
    () => {
      if (!subjectId) return [];
      return db.flashcards
        .where('subjectId')
        .equals(parseInt(subjectId))
        .toArray();
    },
    [subjectId]
  ) || [];

  // Extract all unique tags from flashcards
  useEffect(() => {
    const tags = new Set<string>();
    flashcards.forEach(card => {
      if (card.tags && card.tags.length > 0) {
        card.tags.forEach(tag => tags.add(tag));
      }
    });
    setAvailableTags(Array.from(tags).sort());
  }, [flashcards]);

  // Filter flashcards based on search query and selected tag
  const filteredFlashcards = flashcards.filter(card => {
    const matchesSearch = searchQuery === '' || 
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) || 
      card.back.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = selectedTag === null || 
      (card.tags && card.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });

  // Load generation history from localStorage
  useEffect(() => {
    const loadGenerationHistory = () => {
      const storedHistory = localStorage.getItem('noteGenerationHistory');
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        // Convert string dates back to Date objects
        const reconstructed: Record<number, Date> = {};
        Object.entries(parsed).forEach(([noteId, dateString]) => {
          reconstructed[Number(noteId)] = new Date(dateString as string);
        });
        setNoteGenerationHistory(reconstructed);
      }
    };
    loadGenerationHistory();
  }, []);

  // Save generation history to localStorage
  const saveGenerationHistory = (history: Record<number, Date>) => {
    localStorage.setItem('noteGenerationHistory', JSON.stringify(history));
  };

  // Fetch notes for the current subject
  const fetchNotes = async () => {
    if (!subjectId) return;
    try {
      const subjectNotes = await db.notes.where('subjectId').equals(parseInt(subjectId)).toArray();
      setNotes(subjectNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  // Load notes when AI modal is opened
  useEffect(() => {
    if (isAiModalOpen) {
      fetchNotes();
    }
  }, [isAiModalOpen, subjectId]);

  // Open modal to add a new flashcard
  const openAddModal = () => {
    setCurrentFlashcard(null);
    setFormData({ front: '', back: '', tags: '' });
    setIsModalOpen(true);
  };

  // Open modal to edit an existing flashcard
  const openEditModal = (flashcard: Flashcard) => {
    setCurrentFlashcard(flashcard);
    setFormData({
      front: flashcard.front,
      back: flashcard.back,
      tags: flashcard.tags ? flashcard.tags.join(', ') : '',
    });
    setIsModalOpen(true);
  };

  // Handle form submission for adding/editing a flashcard
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = formData.tags
      ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];

    const now = new Date();

    if (currentFlashcard) {
      // Update existing flashcard
      if (currentFlashcard.id) {
        await db.flashcards.update(currentFlashcard.id, {
          front: formData.front,
          back: formData.back,
          tags: tagsArray,
          updatedAt: now
        });
      }
    } else {
      // Add new flashcard
      await db.flashcards.add({
        subjectId: parseInt(subjectId || '0'),
        front: formData.front,
        back: formData.back,
        tags: tagsArray,
        createdAt: now,
        updatedAt: now
      });
    }

    setIsModalOpen(false);
  };

  // Delete a flashcard
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      await db.flashcards.delete(id);
    }
  };

  // Delete multiple flashcards
  const handleBatchDelete = async () => {
    if (selectedCards.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedCards.length} selected flashcards?`)) {
      await Promise.all(selectedCards.map(id => db.flashcards.delete(id)));
      setSelectedCards([]);
      setIsSelectMode(false);
    }
  };

  // Toggle card selection
  const toggleCardSelection = (id: number) => {
    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter(cardId => cardId !== id));
    } else {
      setSelectedCards([...selectedCards, id]);
    }
  };

  // Select all filtered cards
  const selectAllFilteredCards = () => {
    const filteredCardIds = filteredFlashcards
      .filter(card => card.id !== undefined)
      .map(card => card.id as number);
    setSelectedCards(filteredCardIds);
  };
  
  // Deselect all cards
  const deselectAllCards = () => {
    setSelectedCards([]);
  };

  // Start study mode
  const startStudyMode = () => {
    // If we have filtered cards and there are some, study only those
    const cardsToStudy = filteredFlashcards.length > 0 ? filteredFlashcards : flashcards;
    setStudyCards([...cardsToStudy]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsStudyMode(true);
  };

  // Handle "Got it" in study mode
  const handleGotIt = async () => {
    const card = studyCards[currentIndex];
    if (card.id) {
      const now = new Date();
      // Use a simple spaced repetition: If user knows it, show again in 3 days
      await db.flashcards.update(card.id, {
        lastReviewed: now,
        nextReviewDate: addDays(now, 3),
        difficulty: Math.max((card.difficulty || 3) - 1, 1), // Decrease difficulty (min 1)
        updatedAt: now
      });
    }

    moveToNextCard();
  };

  // Handle "Review Again" in study mode
  const handleReviewAgain = async () => {
    const card = studyCards[currentIndex];
    if (card.id) {
      const now = new Date();
      // If user doesn't know it, show again tomorrow
      await db.flashcards.update(card.id, {
        lastReviewed: now,
        nextReviewDate: addDays(now, 1),
        difficulty: Math.min((card.difficulty || 3) + 1, 5), // Increase difficulty (max 5)
        updatedAt: now
      });
    }

    moveToNextCard();
  };

  // Move to the next card in study mode
  const moveToNextCard = () => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // End of cards
      setIsStudyMode(false);
    }
  };

  // Check if a note can be generated today
  const canGenerateForNote = (noteId: number): boolean => {
    // If no generation history for this note, it can be generated
    if (!noteGenerationHistory[noteId]) return true;
    
    // Compare with start of current day
    const today = startOfDay(new Date());
    const lastGenerated = startOfDay(new Date(noteGenerationHistory[noteId]));
    
    // Can generate if last generation was before today
    return lastGenerated < today;
  };

  // Toggle note selection for AI generation
  const toggleNoteSelection = (noteId: number) => {
    if (selectedNotes.includes(noteId)) {
      setSelectedNotes(selectedNotes.filter(id => id !== noteId));
    } else {
      // Only allow selection if the note hasn't been generated today
      if (canGenerateForNote(noteId)) {
        setSelectedNotes([...selectedNotes, noteId]);
      } else {
        alert('You can only generate flashcards once per day for each note.');
      }
    }
  };

  // Generate flashcards using AI
  const generateFlashcards = async () => {
    if (selectedNotes.length === 0) {
      alert('Please select at least one note to generate flashcards from');
      return;
    }

    setIsGenerating(true);
    try {
      // Get the content of selected notes
      const selectedNoteContents = notes
        .filter(note => selectedNotes.includes(note.id as number))
        .map(note => note.content);

      // Call the Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate flashcards from the following notes. For each important concept, create a question-and-answer pair. Format as JSON array with "front" (question) and "back" (answer) properties for each card. Limit to exactly 15 flashcards per note. Notes: ${selectedNoteContents.join('\n\n')}`
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();

      // Parse the generated content
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        // Extract the JSON part from the response
        const textContent = data.candidates[0].content.parts[0].text;
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          const jsonContent = jsonMatch[0];
          let parsedCards = JSON.parse(jsonContent);
          
          // Enforce the limit of exactly 15 cards
          if (parsedCards.length > 15) {
            parsedCards = parsedCards.slice(0, 15);
          }
          
          setGeneratedCards(parsedCards);
          
          // Update generation history for each selected note
          const now = new Date();
          const updatedHistory = { ...noteGenerationHistory };
          selectedNotes.forEach(noteId => {
            updatedHistory[noteId] = now;
          });
          setNoteGenerationHistory(updatedHistory);
          saveGenerationHistory(updatedHistory);
        } else {
          throw new Error('Could not extract JSON from response');
        }
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert('Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated flashcards to database
  const saveGeneratedFlashcards = async () => {
    if (generatedCards.length === 0) return;

    const now = new Date();
    const cardsToAdd = generatedCards.map(card => ({
      subjectId: parseInt(subjectId || '0'),
      front: card.front,
      back: card.back,
      tags: ['AI-generated'],
      createdAt: now,
      updatedAt: now
    }));

    try {
      await db.flashcards.bulkAdd(cardsToAdd);
      setGeneratedCards([]);
      setSelectedNotes([]);
      setIsAiModalOpen(false);
      alert(`${cardsToAdd.length} flashcards added successfully!`);
    } catch (error) {
      console.error('Error saving flashcards:', error);
      alert('Failed to save flashcards. Please try again.');
    }
  };

  return (
    <div>
      {isStudyMode ? (
        // Study Mode
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Study Mode</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Card {currentIndex + 1} of {studyCards.length}
            </div>
          </div>

          {/* Flashcard */}
          <div
            className="relative h-80 w-full cursor-pointer perspective-1000 group transition-transform duration-500"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front */}
            <div
              className={`absolute inset-0 flex items-center justify-center p-6
                bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900
                rounded-xl shadow-md transition-all duration-500
                ${isFlipped ? 'hidden' : 'block'}`}
            >
              <div className="text-center">
                <div className="text-xl font-semibold">{studyCards[currentIndex]?.front}</div>
                <div className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
                  Click to reveal answer
                </div>
              </div>
            </div>

            {/* Back */}
            <div
              className={`absolute inset-0 flex items-center justify-center p-6
                bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-800
                rounded-xl shadow-md transition-all duration-500
                ${isFlipped ? 'block' : 'hidden'}`}
            >
              <div className="text-center">
                <div className="text-xl">{studyCards[currentIndex]?.back}</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4 mt-6">
            {isFlipped ? (
              <>
                <button
                  onClick={handleReviewAgain}
                  className="flex items-center px-4 py-2 bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 rounded-md"
                >
                  <RotateCcw size={18} className="mr-2" />
                  Review Again
                </button>
                <button
                  onClick={handleGotIt}
                  className="flex items-center px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-md"
                >
                  <Check size={18} className="mr-2" />
                  Got It
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsFlipped(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              >
                Reveal Answer
              </button>
            )}
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={() => setIsStudyMode(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Exit Study Mode
            </button>
          </div>
        </div>
      ) : (
        // Flashcard Management View
        <div>
          {/* Top action bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Left side - Create actions */}
            <div className="flex flex-wrap gap-2 flex-1">
              <button
                onClick={openAddModal}
                className="flex items-center justify-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
              >
                <Plus size={16} className="mr-1" />
                <span>Add Flashcard</span>
              </button>
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center justify-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm"
              >
                <Sparkles size={16} className="mr-1" />
                <span>Generate With AI</span>
              </button>
            </div>

            {/* Right side - Filter, search, study */}
            <div className="flex flex-wrap gap-2 items-center justify-between lg:justify-end">
              {/* Select mode toggle */}
              {flashcards.length > 0 && (
                <button
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    if (isSelectMode) setSelectedCards([]);
                  }}
                  className={`flex items-center justify-center px-3 py-2 rounded-md text-sm
                    ${isSelectMode 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}
                >
                  <CheckSquare size={16} className="mr-1" />
                  <span>{isSelectMode ? 'Cancel Selection' : 'Select Cards'}</span>
                </button>
              )}
              
              {/* Search input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
                />
              </div>
              
              {/* Filter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm"
                >
                  <Filter size={16} className="mr-1" />
                  <span>{selectedTag || 'Filter by tag'}</span>
                  <ChevronDown size={16} className="ml-1" />
                </button>
                
                {isFilterDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 w-42 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 py-1 border border-gray-200 dark:border-gray-700">
                    <div 
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setSelectedTag(null);
                        setIsFilterDropdownOpen(false);
                      }}
                    >
                      All Tags
                    </div>
                    {availableTags.map((tag) => (
                      <div 
                        key={tag}
                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => {
                          setSelectedTag(tag);
                          setIsFilterDropdownOpen(false);
                        }}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Study button */}
              {flashcards.length > 0 && (
                <button
                  onClick={startStudyMode}
                  className="flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                  disabled={filteredFlashcards.length === 0}
                >
                  <Brain size={16} className="mr-1" />
                  <span>Start Studying</span>
                </button>
              )}
            </div>
          </div>

          {/* Selection tools - only visible in select mode */}
          {isSelectMode && filteredFlashcards.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 mr-2">
                  {selectedCards.length} cards selected
                </span>
                <button
                  onClick={selectAllFilteredCards}
                  className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 px-2 py-1 rounded mr-2"
                >
                  Select all {filteredFlashcards.length}
                </button>
                {selectedCards.length > 0 && (
                  <button
                    onClick={deselectAllCards}
                    className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
                  >
                    Deselect all
                  </button>
                )}
              </div>
              
              {selectedCards.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  <Trash size={16} className="mr-1" />
                  Delete Selected ({selectedCards.length})
                </button>
              )}
            </div>
          )}

          {filteredFlashcards.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Brain className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">
                {flashcards.length === 0 
                  ? 'No flashcards yet' 
                  : 'No matching flashcards found'}
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                {flashcards.length === 0 
                  ? 'Create your first flashcard or generate cards with AI'
                  : 'Try adjusting your search or filter'}
              </p>
              {flashcards.length === 0 && (
                <div className="mt-4 flex justify-center space-x-3">
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                  >
                    <Plus size={18} className="mr-1" />
                    Add Flashcard
                  </button>
                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                  >
                    <Sparkles size={18} className="mr-1" />
                    Generate with AI
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFlashcards.map((card) => (
                <div
                  key={card.id}
                  className={`
                    relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden 
                    border ${isSelectMode && selectedCards.includes(card.id as number) 
                      ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-300 dark:ring-blue-700' 
                      : 'border-gray-200 dark:border-gray-700'} 
                    hover:shadow-md transition-shadow
                  `}
                  onClick={() => isSelectMode && card.id && toggleCardSelection(card.id)}
                >
                  {/* Selection checkbox - only visible in select mode */}
                  {isSelectMode && (
                    <div className="absolute top-2 left-2 z-10">
                      {selectedCards.includes(card.id as number) ? (
                        <CheckSquare size={20} className="text-blue-500" />
                      ) : (
                        <Square size={20} className="text-gray-400" />
                      )}
                    </div>
                  )}
                  
                  {/* AI Badge */}
                  {card.tags && card.tags.includes('AI-generated') && (
                    <div className="absolute top-2 right-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs rounded px-1.5 py-0.5 flex items-center">
                      <Sparkles size={12} className="mr-1" />
                      AI
                    </div>
                  )}

                  {/* Front */}
                  <div className={`p-4 min-h-[120px] flex items-center justify-center ${isSelectMode ? 'pt-8' : ''}`}>
                    <p className="text-center font-medium">{card.front}</p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700 flex">
                    <div className="flex-1 text-center py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
                      Front
                    </div>
                    <div className="flex-1 text-center py-2 text-sm text-gray-500 dark:text-gray-400 bg-indigo-50 dark:bg-indigo-900/30">
                      Back
                    </div>
                  </div>

                  {/* Back */}
                  <div className="p-4 min-h-[120px] bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                    <p className="text-center">{card.back}</p>
                  </div>

                  {/* Tags and actions */}
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                    <div className="flex-1 truncate">
                      {card.tags && card.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 text-xs">
                          {card.tags.filter(tag => tag !== 'AI-generated').slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {card.tags.filter(tag => tag !== 'AI-generated').length > 2 && (
                            <span className="px-1">+{card.tags.filter(tag => tag !== 'AI-generated').length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No tags</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditModal(card)}
                        className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => card.id && handleDelete(card.id)}
                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Flashcard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-medium">
                {currentFlashcard ? 'Edit Flashcard' : 'Add New Flashcard'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Front (Question)
                </label>
                <textarea
                  value={formData.front}
                  onChange={(e) => setFormData({ ...formData, front: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 min-h-[100px]"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Back (Answer)
                </label>
                <textarea
                  value={formData.back}
                  onChange={(e) => setFormData({ ...formData, back: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 min-h-[100px]"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  placeholder="e.g. important, term, definition"
                />
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
                  {currentFlashcard ? 'Save Changes' : 'Add Flashcard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate with AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-hidden flex flex-col">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center">
                <Sparkles size={20} className="mr-2 text-purple-500" />
                Generate Flashcards with AI
              </h3>
              <button
                onClick={() => {
                  setIsAiModalOpen(false);
                  setSelectedNotes([]);
                  setGeneratedCards([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {generatedCards.length > 0 ? (
                <div className="p-4">
                  <h4 className="font-medium mb-3">Generated Flashcards (Limited to 15)</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {generatedCards.map((card, index) => (
                      <div key={index} className="border dark:border-gray-700 rounded-md p-3 bg-white dark:bg-gray-700">
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Front:</span>
                          <p className="mt-1">{card.front}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Back:</span>
                          <p className="mt-1">{card.back}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={saveGeneratedFlashcards}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                    >
                      Save All Flashcards
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <p className="mb-4">
                    Select notes to generate flashcards from. The AI will create up to 15 cards per note. You can only generate flashcards once per day for each note.
                  </p>

                  {notes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No notes available for this subject. Create some notes first.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {notes.map(note => {
                        const canGenerate = canGenerateForNote(note.id as number);
                        return (
                          <div
                            key={note.id}
                            className={`
                              p-3 border rounded-md ${canGenerate ? 'cursor-pointer' : 'opacity-70'}
                              ${selectedNotes.includes(note.id as number)
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
                            `}
                            onClick={() => canGenerate && toggleNoteSelection(note.id as number)}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-0.5">
                                {!canGenerate ? (
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    <AlertCircle size={16} className="text-amber-500" />
                                  </div>
                                ) : (
                                  <div
                                    className={`
                                      w-4 h-4 border rounded
                                      ${selectedNotes.includes(note.id as number)
                                        ? 'bg-purple-500 border-purple-500'
                                        : 'border-gray-300 dark:border-gray-600'}
                                    `}
                                  >
                                    {selectedNotes.includes(note.id as number) && (
                                      <Check size={16} className="text-white" />
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="ml-3 flex-1 truncate">
                                <div className="font-medium flex items-center">
                                  {note.title || 'Untitled Note'}
                                  {!canGenerate && (
                                    <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                                      Daily limit reached
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {note.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t dark:border-gray-700 flex justify-between">
              {generatedCards.length === 0 && (
                <button
                  onClick={generateFlashcards}
                  disabled={selectedNotes.length === 0 || isGenerating}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    selectedNotes.length === 0
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="mr-1" />
                      Generate Flashcards
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setIsAiModalOpen(false);
                  setSelectedNotes([]);
                  setGeneratedCards([]);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards;