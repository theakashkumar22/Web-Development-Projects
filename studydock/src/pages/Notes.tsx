import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Note } from '../db/database';
import { Plus, Search, X, Edit, Trash2, Link as LinkIcon, BookOpen, ArrowLeft, Download, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import NoteEditor from './NoteEditor';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink, Table, TableRow, TableCell, BorderStyle } from 'docx';

const Notes: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showMobileContent, setShowMobileContent] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = React.useRef<HTMLDivElement>(null);

  // Reset mobile view when route changes
  useEffect(() => {
    setShowMobileContent(false);
    // Also reset selected note when changing subjects
    setSelectedNote(null);
  }, [subjectId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notes for the current subject
  const notes = useLiveQuery(
    () => {
      if (!subjectId) return [];
      
      let query = db.notes
        .where('subjectId')
        .equals(parseInt(subjectId));
      
      if (searchText) {
        query = query.filter(note => 
          note.title.toLowerCase().includes(searchText.toLowerCase()) || 
          note.content.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      
      return query.reverse().sortBy('updatedAt');
    },
    [subjectId, searchText]
  ) || [];

  // Modified useEffect to prevent auto-selection of notes on initial load
  useEffect(() => {
    if (notes.length > 0) {
      // Check if we're returning from editing a note
      const lastEditedNoteId = localStorage.getItem('lastEditedNoteId');
      const selectMostRecent = localStorage.getItem('selectMostRecent');
      
      if (lastEditedNoteId) {
        // Find the note that was just edited
        const editedNote = notes.find(note => note.id === parseInt(lastEditedNoteId));
        if (editedNote) {
          setSelectedNote(editedNote);
          setShowMobileContent(true);
        }
        // Clear the storage item after use
        localStorage.removeItem('lastEditedNoteId');
      } 
      else if (selectMostRecent) {
        // Select most recent note only if explicitly requested (after creating a new note)
        setSelectedNote(notes[0]);
        setShowMobileContent(true);
        localStorage.removeItem('selectMostRecent');
      }
      // Removed the "|| !selectedNote" condition that was causing auto-selection
    } else if (notes.length === 0) {
      setSelectedNote(null);
      // Clear any localStorage flags
      localStorage.removeItem('lastEditedNoteId');
      localStorage.removeItem('selectMostRecent');
    }
  }, [notes]);

  // Start new note
  const handleNewNote = () => {
    setSelectedNote(null);
    setIsEditing(true);
  };

  // Edit existing note
  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
  };

  // View note (especially for mobile)
  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setShowMobileContent(true);
  };

  // Delete note
  const handleDeleteNote = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await db.notes.delete(id);
      if (selectedNote && selectedNote.id === id) {
        setSelectedNote(null);
        setShowMobileContent(false);
      }
    }
  };

  // Handle back button for mobile
  const handleBack = () => {
    setShowMobileContent(false);
    setSelectedNote(null);
  };

  // Handle close editor - selection of edited note will happen in useEffect
  const handleCloseEditor = () => {
    // Store the ID of the note that was being edited (if any)
    const editedNoteId = selectedNote?.id;
    setIsEditing(false);
    
    // Set a flag to indicate we want to select the edited note
    // We'll use this ID to find and select the freshly saved note
    if (editedNoteId) {
      localStorage.setItem('lastEditedNoteId', editedNoteId.toString());
    } else {
      // For a new note, we'll just select the most recent one
      localStorage.setItem('selectMostRecent', 'true');
    }
  };

  // Toggle export dropdown
  const toggleExportDropdown = () => {
    setShowExportDropdown(!showExportDropdown);
  };

  // Export as PDF
  const exportAsPDF = () => {
    if (!selectedNote) return;
    setShowExportDropdown(false);
    
    try {
      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set fonts and styles
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(selectedNote.title, 20, 20);
      
      // Add content
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      
      // Split content into lines and add them to the PDF
      const textLines = pdf.splitTextToSize(selectedNote.content, 170); // 170mm width for margins
      let yPosition = 30;
      
      // Add content with pagination
      const linesPerPage = 50;
      for (let i = 0; i < textLines.length; i++) {
        if (i > 0 && i % linesPerPage === 0) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(textLines[i], 20, yPosition);
        yPosition += 5;
      }
      
      // Move position for additional info
      yPosition += 5;
      
      // Add video link if available
      if (selectedNote.videoUrl) {
        pdf.setTextColor(0, 0, 255);
        pdf.setFontSize(10);
        const linkText = `Linked Video${selectedNote.videoTimestamp ? 
          ` (at ${Math.floor(selectedNote.videoTimestamp / 60)}:${(selectedNote.videoTimestamp % 60).toString().padStart(2, '0')})` : 
          ''}`;
        pdf.textWithLink(linkText, 20, yPosition, { url: selectedNote.videoUrl + (selectedNote.videoTimestamp ? `&t=${selectedNote.videoTimestamp}s` : '') });
        yPosition += 5;
        pdf.setTextColor(0, 0, 0);
      }
      
      // Add tags if available
      if (selectedNote.tags && selectedNote.tags.length > 0) {
        pdf.setFontSize(10);
        const tagsText = `Tags: ${selectedNote.tags.map(tag => `#${tag}`).join(', ')}`;
        pdf.text(tagsText, 20, yPosition);
        yPosition += 5;
      }
      
      // Add metadata
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Created: ${format(selectedNote.createdAt, 'MMM d, yyyy')}`, 20, yPosition);
      yPosition += 4;
      pdf.text(`Last updated: ${format(selectedNote.updatedAt, 'MMM d, yyyy h:mm a')}`, 20, yPosition);
      
      // Save the PDF
      pdf.save(`${selectedNote.title}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export as PDF. Please try again.');
    }
  };

  // Export as DOCX
  const exportAsDOCX = async () => {
    if (!selectedNote) return;
    setShowExportDropdown(false);
    
    try {
      // Create document with proper sections
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                text: selectedNote.title,
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 200 }
              }),
              
              // Content - split into paragraphs
              ...selectedNote.content.split('\n\n').map(para => 
                new Paragraph({
                  children: [new TextRun({ text: para.trim(), break: para.trim() === '' ? 1 : 0 })],
                  spacing: { after: 200 }
                })
              ),
              
              // Video link if available
              ...(selectedNote.videoUrl ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Linked Video: ", bold: true }),
                    new ExternalHyperlink({
                      children: [
                        new TextRun({
                          text: `${selectedNote.videoTimestamp ? 
                            `Video (at ${Math.floor(selectedNote.videoTimestamp / 60)}:${(selectedNote.videoTimestamp % 60).toString().padStart(2, '0')})` : 
                            'Video Link'}`,
                          style: "Hyperlink",
                        }),
                      ],
                      link: selectedNote.videoUrl + (selectedNote.videoTimestamp ? `&t=${selectedNote.videoTimestamp}s` : '')
                    }),
                  ],
                  spacing: { before: 400, after: 400 }
                })
              ] : []),
              
              // Tags if available
              ...(selectedNote.tags && selectedNote.tags.length > 0 ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Tags: ", bold: true }),
                    new TextRun({ text: selectedNote.tags.map(tag => `#${tag}`).join(', ') }),
                  ],
                  spacing: { before: 200, after: 200 }
                })
              ] : []),
              
              // Metadata in a table
              new Table({
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: {
                          top: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.NONE },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                        },
                        children: [new Paragraph("Created")],
                        width: { size: 30, type: "percentage" },
                      }),
                      new TableCell({
                        borders: {
                          top: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.NONE },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                        },
                        children: [new Paragraph(format(selectedNote.createdAt, 'MMM d, yyyy'))],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: {
                          top: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.NONE },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                        },
                        children: [new Paragraph("Last updated")],
                      }),
                      new TableCell({
                        borders: {
                          top: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.NONE },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                        },
                        children: [new Paragraph(format(selectedNote.updatedAt, 'MMM d, yyyy h:mm a'))],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      });

      // Generate and save document
      const blob = await Packer.toBlob(doc);
        saveAs(blob, `${selectedNote.title}.docx`);
      } catch (error) {
        console.error('Error exporting DOCX:', error);
        alert('Failed to export as DOCX. Please try again.');
      }
  };

  if (isEditing) {
    return <NoteEditor 
      note={selectedNote}
      subjectId={parseInt(subjectId || '0')}
      onClose={handleCloseEditor}
    />;
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)] overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Notes List Sidebar */}
      <div className={`w-full md:w-64 lg:w-80 border-r dark:border-gray-700 flex flex-col h-full ${
        showMobileContent ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-3 py-2 pl-9 border rounded-md dark:border-gray-600 dark:bg-gray-700"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            {searchText && (
              <button 
                onClick={() => setSearchText('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {notes.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-gray-500 dark:text-gray-400">
                {searchText ? 'No notes match your search' : 'No notes yet'}
              </p>
              {!searchText && (
                <button
                  onClick={handleNewNote}
                  className="mt-2 inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                >
                  <Plus size={16} className="mr-1" />
                  New Note
                </button>
              )}
            </div>
          ) : (
            <ul>
              {notes.map((note) => (
                <li 
                  key={note.id}
                  className={`border-b dark:border-gray-700 cursor-pointer transition-colors
                    ${selectedNote?.id === note.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  onClick={() => handleViewNote(note)}
                >
                  <div className="p-4">
                    <div className="flex justify-between">
                      <h3 className="font-medium truncate mb-1">{note.title}</h3>
                      {note.videoUrl && (
                        <LinkIcon size={14} className="text-indigo-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{format(note.updatedAt, 'MMM d, yyyy')}</span>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex space-x-1 overflow-hidden">
                          {note.tags.slice(0, 2).map((tag, i) => (
                            <span 
                              key={i}
                              className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="px-1">+{note.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="p-3 border-t dark:border-gray-700">
          <button
            onClick={handleNewNote}
            className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          >
            <Plus size={18} className="mr-1" />
            New Note
          </button>
        </div>
      </div>
      
      {/* Note Content Area */}
      <div className={`flex-1 flex flex-col h-full ${
        showMobileContent ? 'flex' : 'hidden md:flex'
      }`}>
        {!selectedNote ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-lg font-medium mb-2">No note selected</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Select a note from the list or create a new one
              </p>
              <button
                onClick={handleNewNote}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              >
                <Plus size={18} className="mr-1" />
                New Note
              </button>
            </div>
          </div>
        ) : (
          // Note Viewer
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              {showMobileContent && (
                <button
                  onClick={handleBack}
                  className="md:hidden mr-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h3 className="text-lg font-medium overflow-x-auto max-w-lg pr-2">
                {selectedNote.title}
              </h3>

              <div className="flex space-x-2">
                {/* Export Dropdown */}
                <div className="relative" ref={exportDropdownRef}>
                  <button
                    onClick={toggleExportDropdown}
                    className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 flex items-center"
                    aria-label="Export note"
                    title="Export note"
                  >
                    <Download size={18} />
                    
                  </button>
                  
                  {showExportDropdown && (
                    <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg z-10 w-36">
                      <button
                        onClick={exportAsPDF}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Export as PDF
                      </button>
                      <button
                        onClick={exportAsDOCX}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 border-t dark:border-gray-700"
                      >
                        Export as DOCX
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleEditNote(selectedNote)}
                  className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                  aria-label="Edit note"
                  title="Edit note"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => selectedNote.id && handleDeleteNote(selectedNote.id)}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  aria-label="Delete note"
                  title="Delete note"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
  {/* Note content - with proper scrolling */}
  <div className="prose dark:prose-invert max-w-none overflow-visible pb-6">
    <div className="whitespace-pre-wrap">
      {selectedNote.content}
    </div>
  </div>
  
  {/* Video link - moved outside scrollable area */}
  {selectedNote.videoUrl && (
    <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
      <div className="flex items-center">
        <LinkIcon size={18} className="text-indigo-500 mr-2" />
        <a 
          href={selectedNote.videoUrl + (selectedNote.videoTimestamp ? `&t=${selectedNote.videoTimestamp}s` : '')}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Linked Video
          {selectedNote.videoTimestamp ? 
            ` (at ${Math.floor(selectedNote.videoTimestamp / 60)}:${(selectedNote.videoTimestamp % 60).toString().padStart(2, '0')})` 
            : ''}
        </a>
      </div>
    </div>
  )}
  
  {/* Tags */}
  {selectedNote.tags && selectedNote.tags.length > 0 && (
    <div className="mt-6 flex flex-wrap gap-2">
      {selectedNote.tags.map((tag, i) => (
        <span 
          key={i}
          className="bg-gray-100 dark:bg-gray-700 px-2 py-1 text-sm rounded"
        >
          #{tag}
        </span>
      ))}
    </div>
  )}
  
  {/* Metadata */}
  <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
    <p>Created: {format(selectedNote.createdAt, 'MMM d, yyyy')}</p>
    <p>Last updated: {format(selectedNote.updatedAt, 'MMM d, yyyy h:mm a')}</p>
  </div>
</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;