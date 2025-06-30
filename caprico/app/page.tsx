"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { FileUpload } from "@/components/file-upload"
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  User,
  Menu,
  X,
  Moon,
  Sun,
  Download,
  Search,
  Copy,
  Check,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Edit3,
  Paperclip,
  ImageIcon,
  FileText,
  File,
  Lightbulb,
  Code,
  BookOpen,
  Zap,
  MessageCircle,
  Sparkles,
} from "lucide-react"
import { useTheme } from "next-themes"

interface UploadedFile {
  id: string
  file: File
  type: "image" | "document" | "other"
  preview?: string
  content?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  files?: UploadedFile[]
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  folderId?: string
}

interface ChatFolder {
  id: string
  name: string
  createdAt: Date
}

const conversationSuggestions = [
  {
    icon: <Lightbulb className="w-5 h-5" />,
    title: "Creative Writing",
    description: "Help me write a story or poem",
    prompt: "Help me write a creative short story about a mysterious library that appears only at midnight.",
  },
  {
    icon: <Code className="w-5 h-5" />,
    title: "Code Review",
    description: "Review and improve my code",
    prompt: "Can you review this code and suggest improvements for better performance and readability?",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Learning Assistant",
    description: "Explain complex topics simply",
    prompt: "Explain quantum computing in simple terms with practical examples.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Problem Solving",
    description: "Help solve complex problems",
    prompt:
      "I need help breaking down a complex problem into manageable steps. Can you guide me through a systematic approach?",
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    title: "Brainstorming",
    description: "Generate ideas and solutions",
    prompt: "Let's brainstorm innovative solutions for reducing plastic waste in daily life.",
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "General Chat",
    description: "Just have a conversation",
    prompt: "Hi! I'd like to have an interesting conversation. What's something fascinating you'd like to discuss?",
  },
]

export default function ChatInterface() {
  const [chats, setChats] = useState<Chat[]>([])
  const [folders, setFolders] = useState<ChatFolder[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Changed to false
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<
    { chatId: string; messageId: string; content: string; chatTitle: string }[]
  >([])
  const [showSearch, setShowSearch] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([])
  const [showFileUpload, setShowFileUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load data from localStorage
  useEffect(() => {
    if (!mounted) return

    const savedChats = localStorage.getItem("caprico-chats")
    const savedFolders = localStorage.getItem("caprico-folders")

    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }))
        setChats(parsedChats)
        if (parsedChats.length > 0) {
          setCurrentChatId(parsedChats[0].id)
        }
      } catch (error) {
        console.error("Error loading chats:", error)
      }
    }

    if (savedFolders) {
      try {
        const parsedFolders = JSON.parse(savedFolders).map((folder: any) => ({
          ...folder,
          createdAt: new Date(folder.createdAt),
        }))
        setFolders(parsedFolders)
      } catch (error) {
        console.error("Error loading folders:", error)
      }
    }
  }, [mounted])

  // Save data to localStorage
  useEffect(() => {
    if (!mounted) return
    if (chats.length > 0) {
      localStorage.setItem("caprico-chats", JSON.stringify(chats))
    }
  }, [chats, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem("caprico-folders", JSON.stringify(folders))
  }, [folders, mounted])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chats, currentChatId])

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results: { chatId: string; messageId: string; content: string; chatTitle: string }[] = []
      chats.forEach((chat) => {
        chat.messages.forEach((message) => {
          if (message.content.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({
              chatId: chat.id,
              messageId: message.id,
              content: message.content,
              chatTitle: chat.title,
            })
          }
        })
      })
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, chats])

  const currentChat = chats.find((chat) => chat.id === currentChatId)

  const createNewChat = (folderId?: string) => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      folderId,
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    setShowSearch(false)
  }

  const createFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder: ChatFolder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      createdAt: new Date(),
    }

    setFolders((prev) => [...prev, newFolder])
    setNewFolderName("")
    setShowNewFolderDialog(false)
  }

  const deleteChat = (chatId: string) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      setChats((prev) => prev.filter((chat) => chat.id !== chatId))
      if (currentChatId === chatId) {
        const remainingChats = chats.filter((chat) => chat.id !== chatId)
        setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null)
      }
    }
  }

  const deleteFolder = (folderId: string) => {
    if (confirm("Are you sure you want to delete this folder? Chats will be moved to uncategorized.")) {
      setChats((prev) => prev.map((chat) => (chat.folderId === folderId ? { ...chat, folderId: undefined } : chat)))
      setFolders((prev) => prev.filter((folder) => folder.id !== folderId))
    }
  }

  const moveChatToFolder = (chatId: string, folderId?: string) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, folderId } : chat)))
  }

  const copyMessage = async (message: Message) => {
    try {
      const richText = `${message.role === "user" ? "You" : "Caprico"}: ${message.content}`

      if (navigator.clipboard && window.ClipboardItem) {
        const htmlBlob = new Blob(
          [
            `<div><strong>${message.role === "user" ? "You" : "Caprico"}:</strong><br/>${message.content.replace(/\n/g, "<br/>")}</div>`,
          ],
          {
            type: "text/html",
          },
        )
        const textBlob = new Blob([richText], { type: "text/plain" })

        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          }),
        ])
      } else {
        await navigator.clipboard.writeText(richText)
      }

      setCopiedMessageId(message.id)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const exportChats = () => {
    const dataStr = JSON.stringify({ chats, folders }, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `caprico-chats-${new Date().toISOString().split("T")[0]}.json`
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const updateChatTitle = (chatId: string, firstMessage: string) => {
    // Split into words and take first 3-4 words, then join back
    const words = firstMessage.trim().split(/\s+/)
    const title = words.slice(0, 2).join(" ")
    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, title: title || "New Chat", updatedAt: new Date() } : chat)),
    )
  }

  const addMessage = (chatId: string, message: Message) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, message],
              updatedAt: new Date(),
            }
          : chat,
      ),
    )
  }

  const formatFilesForAPI = (files: UploadedFile[]) => {
    return files.map((file) => ({
      name: file.file.name,
      type: file.file.type,
      size: file.file.size,
      content: file.content,
      fileType: file.type,
    }))
  }

  const handleSubmit = async (e: React.FormEvent, customPrompt?: string) => {
    e.preventDefault()
    const messageContent = customPrompt || input
    if ((!messageContent.trim() && attachedFiles.length === 0) || isLoading) return

    let chatId = currentChatId

    if (!chatId) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: messageContent.trim().split(/\s+/).slice(0, 4).join(" ") || "File Discussion",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setChats((prev) => [newChat, ...prev])
      chatId = newChat.id
      setCurrentChatId(chatId)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent || "Uploaded files for discussion",
      timestamp: new Date(),
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    }

    addMessage(chatId, userMessage)

    const chat = chats.find((c) => c.id === chatId)
    if (chat && chat.messages.length === 0) {
      updateChatTitle(chatId, messageContent || "File Discussion")
    }

    setInput("")
    setAttachedFiles([])
    setShowFileUpload(false)

    // Reset textarea height
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = "40px"
    }

    setIsLoading(true)

    try {
      const requestBody: any = {
        messages: [...(chat?.messages || []), userMessage],
      }

      if (attachedFiles.length > 0) {
        requestBody.files = formatFilesForAPI(attachedFiles)
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      }

      addMessage(chatId, assistantMessage)
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      }
      addMessage(chatId, errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt)
    // Auto-submit the suggestion
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent
    handleSubmit(fakeEvent, prompt)
  }

  const navigateToSearchResult = (chatId: string) => {
    setCurrentChatId(chatId)
    setShowSearch(false)
    setSearchQuery("")
  }

  const getFileIcon = (type: "image" | "document" | "other") => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-3 h-3" />
      case "document":
        return <FileText className="w-3 h-3" />
      default:
        return <File className="w-3 h-3" />
    }
  }

  const groupedChats = {
    uncategorized: chats.filter((chat) => !chat.folderId),
    folders: folders.map((folder) => ({
      ...folder,
      chats: chats.filter((chat) => chat.folderId === folder.id),
    })),
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:relative lg:translate-x-0 z-50 lg:z-auto w-80 lg:w-80 h-full transition-transform duration-300 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden`}
      >
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 space-y-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => createNewChat()}
              className="flex-1 justify-start gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border-0 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowNewFolderDialog(true)
                  }}
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-gray-100">Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="border-gray-300 dark:border-gray-700 bg-white dark:bg-black"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newFolderName.trim()) {
                        e.preventDefault()
                        createFolder()
                      }
                      if (e.key === "Escape") {
                        e.preventDefault()
                        setShowNewFolderDialog(false)
                        setNewFolderName("")
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewFolderDialog(false)
                        setNewFolderName("")
                      }}
                      className="border-gray-300 dark:border-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createFolder}
                      className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                      disabled={!newFolderName.trim()}
                    >
                      Create Folder
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="flex-1 border-gray-300 dark:border-gray-700"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportChats}
              className="flex-1 border-gray-300 dark:border-gray-700 bg-transparent"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {showSearch && (
            <div className="space-y-2">
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm border-gray-300 dark:border-gray-700"
              />
              {searchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {searchResults.slice(0, 10).map((result, index) => (
                    <div
                      key={index}
                      onClick={() => navigateToSearchResult(result.chatId)}
                      className="p-2 text-xs bg-gray-100 dark:bg-gray-900 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{result.chatTitle}</div>
                      <div className="truncate text-gray-600 dark:text-gray-400">{result.content.slice(0, 60)}...</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 p-2">
          {/* Uncategorized Chats */}
          {groupedChats.uncategorized.length > 0 && (
            <div className="mb-4">
              <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Chats
              </div>
              {groupedChats.uncategorized.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={currentChatId === chat.id}
                  onClick={() => {
                    setCurrentChatId(chat.id)
                    // Close sidebar on mobile
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false)
                    }
                  }}
                  onDelete={() => deleteChat(chat.id)}
                  onMoveToFolder={(folderId) => moveChatToFolder(chat.id, folderId)}
                  folders={folders}
                  setSidebarOpen={setSidebarOpen}
                />
              ))}
            </div>
          )}

          {/* Folders */}
          {groupedChats.folders.map((folder) => (
            <div key={folder.id} className="mb-4">
              <div className="flex items-center justify-between px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  {folder.name}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
                    <DropdownMenuItem onClick={() => createNewChat(folder.id)}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => deleteFolder(folder.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {folder.chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={currentChatId === chat.id}
                  onClick={() => {
                    setCurrentChatId(chat.id)
                    // Close sidebar on mobile
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false)
                    }
                  }}
                  onDelete={() => deleteChat(chat.id)}
                  onMoveToFolder={(folderId) => moveChatToFolder(chat.id, folderId)}
                  folders={folders}
                  setSidebarOpen={setSidebarOpen}
                />
              ))}
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 p-3 sm:p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-gray-100 dark:hover:bg-gray-900 flex-shrink-0 lg:hidden"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-black dark:bg-white rounded-sm flex items-center justify-center flex-shrink-0">
                <span className="text-white dark:text-black text-xs font-bold">C</span>
              </div>
              <div className="min-w-0">
                <h1 className="font-medium text-sm truncate">Caprico</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Powered by Google Gemini 2.0</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => createNewChat()}
              className="hover:bg-gray-100 dark:hover:bg-gray-900 hidden sm:flex"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3 sm:p-4 overflow-hidden">
          {currentChat?.messages.length === 0 || !currentChat ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-4xl mx-auto px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black dark:bg-white rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-white dark:text-black text-xl sm:text-2xl font-bold">C</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2 sm:mb-3 text-black dark:text-white">
                Welcome to Caprico
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-md text-sm sm:text-base leading-relaxed">
                Your intelligent AI assistant powered by Google's Gemini 2.0. Start a conversation, upload files, or
                choose from the suggestions below.
              </p>

              {/* Conversation Suggestions */}
              <div className="w-full max-w-4xl">
                <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">
                  What would you like to explore?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {conversationSuggestions.map((suggestion, index) => (
                    <Card
                      key={index}
                      className="p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 group"
                      onClick={() => handleSuggestionClick(suggestion.prompt)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                          {suggestion.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                            {suggestion.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline" className="border-gray-300 dark:border-gray-700">
                  File Upload
                </Badge>
                <Badge variant="outline" className="border-gray-300 dark:border-gray-700">
                  Message Search
                </Badge>
                <Badge variant="outline" className="border-gray-300 dark:border-gray-700">
                  Chat Folders
                </Badge>
                <Badge variant="outline" className="border-gray-300 dark:border-gray-700">
                  Rich Text Copy
                </Badge>
                <Badge variant="outline" className="border-gray-300 dark:border-gray-700">
                  Syntax Highlighting
                </Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {currentChat.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="w-7 h-7 bg-black dark:bg-white flex-shrink-0">
                      <AvatarFallback className="text-white dark:text-black text-xs font-bold bg-transparent">
                        C
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="group relative max-w-[85%]">
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "bg-gray-100 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      {/* Message Files */}
                      {message.files && message.files.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {message.files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center gap-2 p-2 bg-white/10 dark:bg-black/10 rounded border border-white/20 dark:border-black/20"
                            >
                              {file.preview ? (
                                <img
                                  src={file.preview || "/placeholder.svg"}
                                  alt={file.file.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-white/20 dark:bg-black/20 rounded flex items-center justify-center">
                                  {getFileIcon(file.type)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{file.file.name}</p>
                                <p className="text-xs opacity-70">{file.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Content */}
                      {message.role === "assistant" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-800"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="w-7 h-7 bg-gray-200 dark:bg-gray-800 flex-shrink-0">
                      <AvatarFallback className="text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-7 h-7 bg-black dark:bg-white">
                    <AvatarFallback className="text-white dark:text-black text-xs font-bold bg-transparent">
                      C
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-white dark:bg-black flex-shrink-0">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* File Upload Area */}
            {showFileUpload && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <FileUpload onFilesChange={setAttachedFiles} />
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit}>
              <div className="flex gap-2 items-start">
                <div className="flex-1 relative min-w-0">
                  <textarea
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      // Auto-resize textarea
                      const textarea = e.target as HTMLTextAreaElement
                      textarea.style.height = "auto"
                      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                        // Reset textarea height immediately
                        const textarea = e.target as HTMLTextAreaElement
                        setTimeout(() => {
                          textarea.style.height = "auto"
                          textarea.style.height = "40px"
                        }, 0)
                      }
                    }}
                    placeholder="Message Caprico..."
                    disabled={isLoading}
                    rows={1}
                    className="w-full resize-none border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[40px] max-h-[120px] overflow-y-auto leading-5"
                    style={{
                      height: "40px",
                      minHeight: "40px",
                    }}
                  />
                  {input && (
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500 pointer-events-none hidden sm:block">
                      {input.length}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className={`border-gray-300 dark:border-gray-700 h-10 w-10 flex-shrink-0 ${
                    showFileUpload || attachedFiles.length > 0
                      ? "bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600"
                      : ""
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-10 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="hidden sm:block">Press Enter to send, Shift+Enter for new line</span>
                <span className="sm:hidden">Tap to send</span>
                {attachedFiles.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    {attachedFiles.length} file{attachedFiles.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// Update ChatItem function signature
function ChatItem({
  chat,
  isActive,
  onClick,
  onDelete,
  onMoveToFolder,
  folders,
  setSidebarOpen,
}: {
  chat: Chat
  isActive: boolean
  onClick: () => void
  onDelete: () => void
  onMoveToFolder: (folderId?: string) => void
  folders: ChatFolder[]
  setSidebarOpen: (open: boolean) => void
}) {
  return (
    <Card
      className={`p-2 sm:p-3 mb-1 cursor-pointer transition-all group border ${
        isActive
          ? "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          : "hover:bg-gray-50 dark:hover:bg-gray-950 border-transparent hover:border-gray-200 dark:hover:border-gray-800"
      }`}
      onClick={() => {
        onClick()
        // Close sidebar on mobile when selecting a chat
        if (window.innerWidth < 1024) {
          setSidebarOpen(false)
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0 overflow-hidden">
          <MessageSquare className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 overflow-hidden">
            <span className="text-sm block truncate leading-tight">{chat.title}</span>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {chat.updatedAt.toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge
            variant="secondary"
            className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5"
          >
            {chat.messages.length}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 flex-shrink-0"
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              {chat.folderId && (
                <DropdownMenuItem onClick={() => onMoveToFolder(undefined)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Remove from Folder
                </DropdownMenuItem>
              )}
              {folders.map((folder) => (
                <DropdownMenuItem key={folder.id} onClick={() => onMoveToFolder(folder.id)}>
                  <Folder className="w-4 h-4 mr-2" />
                  Move to {folder.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  )
}
