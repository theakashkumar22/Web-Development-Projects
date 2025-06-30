import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, X, ChevronDown, ChevronUp, Trash2, Copy, Download, RotateCcw, Settings } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Theme {
  name: string;
  primaryColor: string;
  textColor: string;
  bgColor: string;
}

interface UsageLimit {
  count: number;
  date: string;
}

const MAX_GENERATIONS_PER_DAY = 15;

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('indigo');
  const [showSettings, setShowSettings] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<UsageLimit>({ count: 0, date: '' });
  const [showLimitReached, setShowLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const themes: Record<string, Theme> = {
    indigo: { 
      name: 'Indigo',
      primaryColor: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600', 
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    emerald: { 
      name: 'Emerald',
      primaryColor: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600', 
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    rose: { 
      name: 'Rose',
      primaryColor: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600', 
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50'
    },
    amber: { 
      name: 'Amber',
      primaryColor: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600', 
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    sky: { 
      name: 'Sky',
      primaryColor: 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600', 
      textColor: 'text-sky-600',
      bgColor: 'bg-sky-50'
    }
  };

  // Update the initial useEffect that loads the usage data
  useEffect(() => {
    const savedMessages = localStorage.getItem('aiChatMessages');
    const savedTheme = localStorage.getItem('aiChatTheme');
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    
    if (savedTheme && themes[savedTheme]) {
      setSelectedTheme(savedTheme);
    }

    // Always get fresh usage data from localStorage
    const savedUsage = localStorage.getItem('aiChatUsage');
    
    if (savedUsage) {
      const usage: UsageLimit = JSON.parse(savedUsage);
      
      if (usage.date === today) {
        // If the saved date is today, use the saved count
        setDailyUsage(usage);
        setShowLimitReached(usage.count >= MAX_GENERATIONS_PER_DAY);
      } else {
        // If the saved date is not today, reset the counter
        const newUsage = { count: 0, date: today };
        setDailyUsage(newUsage);
        setShowLimitReached(false);
        localStorage.setItem('aiChatUsage', JSON.stringify(newUsage));
      }
    } else {
      // Initialize usage if it doesn't exist
      const newUsage = { count: 0, date: today };
      setDailyUsage(newUsage);
      localStorage.setItem('aiChatUsage', JSON.stringify(newUsage));
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiChatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('aiChatTheme', selectedTheme);
  }, [selectedTheme]);

  // Save daily usage to localStorage whenever it changes
  useEffect(() => {
    if (dailyUsage.date) {
      localStorage.setItem('aiChatUsage', JSON.stringify(dailyUsage));
    }
  }, [dailyUsage]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Focus input when chat is opened or unminimized
  useEffect(() => {
    if (isOpen && !isMinimized && !showSettings) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized, showSettings]);

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  const checkDailyLimit = (): boolean => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get the latest data from localStorage to prevent any sync issues
    const savedUsage = localStorage.getItem('aiChatUsage');
    let currentUsage = { count: 0, date: today };
    
    if (savedUsage) {
      const parsedUsage = JSON.parse(savedUsage);
      // If the date is the same, use the stored count, otherwise reset to 0
      if (parsedUsage.date === today) {
        currentUsage.count = parsedUsage.count;
      }
    }
    
    // Update state with the most recent data
    setDailyUsage(currentUsage);
    
    // Check if limit is reached
    const limitReached = currentUsage.count >= MAX_GENERATIONS_PER_DAY;
    setShowLimitReached(limitReached);
    
    return limitReached;
  };

  const incrementUsageCount = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get the latest data from localStorage to prevent any sync issues
    const savedUsage = localStorage.getItem('aiChatUsage');
    let currentUsage = { count: 0, date: today };
    
    if (savedUsage) {
      const parsedUsage = JSON.parse(savedUsage);
      // If the date is the same, use the stored count, otherwise reset to 0
      if (parsedUsage.date === today) {
        currentUsage.count = parsedUsage.count;
      }
    }
    
    // Increment the count
    let newCount = currentUsage.count + 1;
    const newUsage = { count: newCount, date: today };
    
    // Update state
    setDailyUsage(newUsage);
    
    // Immediately persist to localStorage
    localStorage.setItem('aiChatUsage', JSON.stringify(newUsage));
    
    // Update the limit reached flag
    if (newCount >= MAX_GENERATIONS_PER_DAY) {
      setShowLimitReached(true);
    }
    
    return newCount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    // Check daily usage limit with the most up-to-date data
    if (checkDailyLimit()) {
      return;
    }

    const userMessage: Message = {
      id: generateUniqueId(),
      role: 'user',
      content: message.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyB8sB1FhxLfbztTVeUg47-gn5MyvRmmjsw`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an AI study assistant. Help the student with their question: ${message}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        }
      );

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        // Increment the usage count
        incrementUsageCount();
        
        const aiResponse: Message = {
          id: generateUniqueId(),
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      localStorage.removeItem('aiChatMessages');
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  const downloadChat = () => {
    // Create a text representation of the chat
    const chatText = messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'AI'} (${new Date(msg.timestamp).toLocaleString()}):\n${msg.content}\n\n`
    ).join('');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const regenerateLastResponse = async () => {
    if (isLoading || messages.length < 2) return;
    
    // Check daily usage limit with the most up-to-date data
    if (checkDailyLimit()) {
      return;
    }
    
    // Find the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(msg => msg.role === 'user');
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMessage = [...messages].reverse()[lastUserMessageIndex];
    
    // Remove the last AI response
    setMessages(messages.slice(0, -1));
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyB8sB1FhxLfbztTVeUg47-gn5MyvRmmjsw`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an AI study assistant. Help the student with their question: ${lastUserMessage.content}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        }
      );

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        // Increment the usage count
        incrementUsageCount();
        
        const aiResponse: Message = {
          id: generateUniqueId(),
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Format text to handle markdown-like formatting
  const formatMessageText = (text: string) => {
    // Handle bold text (**text**)
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text (*text*)
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle code blocks (```code```)
    formattedText = formattedText.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-700 p-2 rounded my-2 overflow-x-auto"><code>$1</code></pre>');
    
    // Handle inline code (`code`)
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded font-mono">$1</code>');
    
    // Handle paragraphs (double line breaks)
    formattedText = formattedText.replace(/\n\s*\n/g, '</p><p>');
    
    // Handle single line breaks
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    return `<p>${formattedText}</p>`;
  };

  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-6 space-y-4">
          <div className={`${currentTheme.primaryColor} p-4 rounded-full`}>
            <Sparkles size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-lg">AI Study Assistant</h3>
            <p>Ask me anything about your studies and I'll help you understand!</p>
            <p className="text-sm text-gray-500">
              {dailyUsage.count > 0 ? 
                `${MAX_GENERATIONS_PER_DAY - dailyUsage.count} of ${MAX_GENERATIONS_PER_DAY} questions remaining today` :
                `${MAX_GENERATIONS_PER_DAY} questions available today`
              }
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full max-w-xs mt-4">
            {[
              "Explain quantum physics",
              "Help with calculus",
              "Summarize 'To Kill a Mockingbird'",
              "Define photosynthesis"
            ].map((suggestion, i) => (
              <button
                key={i}
                onClick={() => {
                  setMessage(suggestion);
                  inputRef.current?.focus();
                }}
                className={`text-sm p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left truncate`}
                disabled={showLimitReached}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4">
        {/* Usage count display */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          {dailyUsage.count >= MAX_GENERATIONS_PER_DAY ? 
            "Daily question limit reached. Try again tomorrow!" :
            `${MAX_GENERATIONS_PER_DAY - dailyUsage.count} of ${MAX_GENERATIONS_PER_DAY} questions remaining today`
          }
        </div>
        
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                msg.role === 'user'
                  ? `${currentTheme.primaryColor}`
                  : `bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700`
              } transition-all`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap text-white">
                  {msg.content}
                </p>
              ) : (
                <div 
                  className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200 markdown-content"
                  dangerouslySetInnerHTML={{ __html: formatMessageText(msg.content) }}
                />
              )}
              <div className="flex justify-between items-center mt-2">
                <span className={`text-xs ${msg.role === 'user' ? 'text-white opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => copyMessage(msg.content)}
                    className={`p-1 rounded ${
                      msg.role === 'user' ? 'hover:bg-indigo-500' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    aria-label="Copy message"
                  >
                    <Copy size={14} className={msg.role === 'user' ? 'text-white' : ''} />
                  </button>
                  {msg.role === 'assistant' && index === messages.length - 1 && (
                    <button 
                      onClick={regenerateLastResponse}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      aria-label="Regenerate response"
                      disabled={isLoading || showLimitReached}
                    >
                      <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {/* Daily limit reached message */}
        {showLimitReached && (
          <div className={`p-3 rounded-lg border ${currentTheme.bgColor} text-center`}>
            <p className="font-medium">Daily question limit reached</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You've used all {MAX_GENERATIONS_PER_DAY} questions for today. 
              Your limit will reset at midnight.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <h3 className="font-medium text-lg mb-4">Settings</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Theme</h4>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTheme(key)}
                  className={`w-8 h-8 rounded-full ${theme.primaryColor} ${
                    selectedTheme === key ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-300' : ''
                  }`}
                  aria-label={`${theme.name} theme`}
                />
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Data Management</h4>
            <div className="space-y-2">
              <button
                onClick={clearChat}
                className="flex items-center space-x-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <Trash2 size={18} className="text-gray-600 dark:text-gray-400" />
                <span>Clear chat history</span>
              </button>
              
              <button
                onClick={downloadChat}
                disabled={messages.length === 0}
                className={`flex items-center space-x-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left ${
                  messages.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Download size={18} className="text-gray-600 dark:text-gray-400" />
                <span>Download chat history</span>
              </button>
              
              <button
                onClick={regenerateLastResponse}
                disabled={isLoading || messages.length === 0 || messages[messages.length - 1]?.role !== 'assistant' || showLimitReached}
                className={`flex items-center space-x-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left ${
                  isLoading || messages.length === 0 || messages[messages.length - 1]?.role !== 'assistant' || showLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <RotateCcw size={18} className={`text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate response</span>
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Usage</h4>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Today's questions:</span>
                <span className="font-medium">{dailyUsage.count} / {MAX_GENERATIONS_PER_DAY}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`${currentTheme.primaryColor} h-2.5 rounded-full`} 
                  style={{ width: `${(dailyUsage.count / MAX_GENERATIONS_PER_DAY) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Usage resets at midnight in your local time zone.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentTheme = themes[selectedTheme];

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={`fixed right-4 bottom-4 ${currentTheme.primaryColor} p-4 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center hover:scale-110 animate-fade-in`}
        aria-label="Open AI Chat"
      >
        <Sparkles size={22} />
      </button>
    );
  }

  return (
    <div 
      className={`fixed right-0 sm:right-4 bottom-0 sm:bottom-4 ${
        isMinimized ? 'w-full sm:w-64 h-12' : 'w-full sm:w-96 h-[90vh] sm:h-[36rem]'
      } bg-white dark:bg-gray-900 rounded-none sm:rounded-2xl shadow-2xl border-t sm:border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <div className={`p-3 border-gray-200 dark:border-gray-700 border-b flex justify-between items-center ${currentTheme.bgColor} dark:bg-gray-800`}>
        <div className="flex items-center">
          <Sparkles size={18} className={`${currentTheme.textColor} dark:text-white mr-2`} />
          <span className="font-medium dark:text-white">AI Study Assistant</span>
        </div>
        <div className="flex items-center space-x-1">
          {!isMinimized && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Settings"
            >
              <Settings size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronUp size={16} className="text-gray-700 dark:text-gray-300" />
            ) : (
              <ChevronDown size={16} className="text-gray-700 dark:text-gray-300" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages or Settings */}
          <div className="flex-grow overflow-hidden">
            {showSettings ? (
              renderSettings()
            ) : (
              <div className="h-full overflow-y-auto custom-scrollbar">
                {renderMessages()}
                {isLoading && (
                  <div className="flex justify-center p-4">
                    <div className="flex space-x-2">
                      <div className={`w-2 h-2 rounded-full ${currentTheme.primaryColor} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                      <div className={`w-2 h-2 rounded-full ${currentTheme.primaryColor} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                      <div className={`w-2 h-2 rounded-full ${currentTheme.primaryColor} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input - Only show when not in settings view */}
          {!showSettings && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSubmit} className="relative p-3">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={showLimitReached ? "Daily limit reached. Try again tomorrow." : "Ask anything..."}
                  className="w-full py-3 pr-12 pl-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg resize-none overflow-hidden max-h-24 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  rows={1}
                  disabled={isLoading || showLimitReached}
                />
                <button
                  type="submit"
                  disabled={isLoading || !message.trim() || showLimitReached}
                  className={`absolute right-5 bottom-6 p-2 ${currentTheme.primaryColor} rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* Additional CSS for custom scrollbar, animations, and markdown styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Markdown content styling */
        .markdown-content strong {
          font-weight: 600;
        }
        .markdown-content em {
          font-style: italic;
        }
        .markdown-content p {
          margin-bottom: 0.75rem;
        }
        .markdown-content p:last-child {
          margin-bottom: 0;
        }
        .markdown-content code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .dark .markdown-content code, 
        .dark .markdown-content pre {
          background-color: rgba(55, 65, 81, 1);
          color: rgba(229, 231, 235, 1);
        }
      `}</style>
    </div>
  );
};

export default AIChat;