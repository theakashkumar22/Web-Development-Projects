import Dexie, { Table } from 'dexie';

// Define interfaces for database entities
export interface Subject {
  id?: number;
  name: string;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id?: number;
  subjectId: number;
  title: string;
  content: string;
  tags?: string[];
  videoUrl?: string;
  videoTimestamp?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Flashcard {
  id?: number;
  subjectId: number;
  front: string;
  back: string;
  tags?: string[];
  lastReviewed?: Date;
  nextReviewDate?: Date;
  difficulty?: number; // 1-5 scale for spaced repetition
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id?: number;
  subjectId: number;
  title: string;
  questions: QuizQuestion[];
  lastScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  id?: number;
  quizId?: number;
  question: string;
  type: 'mcq' | 'short-answer' | 'fill-in-blank';
  options?: string[];
  correctAnswer: string | string[];
}

export interface StudySession {
  id?: number;
  subjectId: number;
  date: Date;
  duration: number; // minutes
  notes?: string;
  pomodoroCount?: number;
  pomodoroSettings?: {
    workDuration: number; // minutes
    breakDuration: number; // minutes
    longBreakDuration: number; // minutes
    sessionsUntilLongBreak: number;
  };
}

export interface StudyTask {
  id?: number;
  subjectId: number;
  title: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class StudyStashDatabase extends Dexie {
  subjects!: Table<Subject, number>;
  notes!: Table<Note, number>;
  flashcards!: Table<Flashcard, number>;
  quizzes!: Table<Quiz, number>;
  studySessions!: Table<StudySession, number>;
  studyTasks!: Table<StudyTask, number>;

  constructor() {
    super('StudyStashDB');
    
    this.version(1).stores({
      subjects: '++id, name, createdAt, updatedAt',
      notes: '++id, subjectId, title, tags, createdAt, updatedAt',
      flashcards: '++id, subjectId, tags, lastReviewed, nextReviewDate, createdAt, updatedAt',
      quizzes: '++id, subjectId, title, createdAt, updatedAt',
      studySessions: '++id, subjectId, date',
      studyTasks: '++id, subjectId, dueDate, completed, createdAt, updatedAt'
    });
  }
}

// Create and export a database instance
export const db = new StudyStashDatabase();

// Add an initial subject if none exists
export const initializeDatabase = async () => {
  const subjectCount = await db.subjects.count();
  
  if (subjectCount === 0) {
    const now = new Date();
    await db.subjects.add({
      name: 'General',
      color: '#4F46E5', // Indigo color
      createdAt: now,
      updatedAt: now
    });
  }
};