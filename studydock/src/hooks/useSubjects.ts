import { useLiveQuery } from 'dexie-react-hooks';
import { db, Subject } from '../db/database';

export function useSubjects() {
  const subjects = useLiveQuery(
    () => db.subjects.orderBy('name').toArray(),
    []
  ) || [];

  const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    return await db.subjects.add({
      ...subject,
      createdAt: now,
      updatedAt: now
    });
  };

  const updateSubject = async (id: number, updates: Partial<Omit<Subject, 'id' | 'createdAt'>>) => {
    return await db.subjects.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  };

  const deleteSubject = async (id: number) => {
    // Delete associated content
    await db.notes.where('subjectId').equals(id).delete();
    await db.flashcards.where('subjectId').equals(id).delete();
    await db.quizzes.where('subjectId').equals(id).delete();
    await db.studySessions.where('subjectId').equals(id).delete();
    await db.studyTasks.where('subjectId').equals(id).delete();
    
    // Delete the subject
    return await db.subjects.delete(id);
  };

  const getSubject = async (id: number) => {
    return await db.subjects.get(id);
  };

  return {
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    getSubject
  };
}