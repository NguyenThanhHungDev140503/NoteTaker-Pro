import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '@/types/note';

const NOTES_KEY = 'notes';

class NoteService {
  async getAllNotes(): Promise<Note[]> {
    try {
      const notesJson = await AsyncStorage.getItem(NOTES_KEY);
      return notesJson ? JSON.parse(notesJson) : [];
    } catch (error) {
      console.error('Failed to load notes:', error);
      return [];
    }
  }

  async getNoteById(id: string): Promise<Note | null> {
    try {
      const notes = await this.getAllNotes();
      return notes.find(note => note.id === id) || null;
    } catch (error) {
      console.error('Failed to get note:', error);
      return null;
    }
  }

  async createNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    try {
      const notes = await this.getAllNotes();
      const newNote: Note = {
        ...noteData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      notes.unshift(newNote);
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      return newNote;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  }

  async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note> {
    try {
      const notes = await this.getAllNotes();
      const noteIndex = notes.findIndex(note => note.id === id);
      
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }

      const updatedNote: Note = {
        ...notes[noteIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      notes[noteIndex] = updatedNote;
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      return updatedNote;
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      const notes = await this.getAllNotes();
      const filteredNotes = notes.filter(note => note.id !== id);
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filteredNotes));
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  async toggleFavorite(id: string): Promise<Note> {
    try {
      const notes = await this.getAllNotes();
      const noteIndex = notes.findIndex(note => note.id === id);
      
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }

      const updatedNote: Note = {
        ...notes[noteIndex],
        isFavorite: !notes[noteIndex].isFavorite,
        updatedAt: new Date().toISOString(),
      };

      notes[noteIndex] = updatedNote;
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      
      return updatedNote;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw new Error('Unable to update favorite status. Please check your storage.');
    }
  }

  async searchNotes(query: string): Promise<Note[]> {
    try {
      const notes = await this.getAllNotes();
      const lowercaseQuery = query.toLowerCase();
      
      return notes.filter(note =>
        note.title.toLowerCase().includes(lowercaseQuery) ||
        note.content.toLowerCase().includes(lowercaseQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('Failed to search notes:', error);
      return [];
    }
  }

  async clearAllNotes(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NOTES_KEY);
    } catch (error) {
      console.error('Failed to clear notes:', error);
      throw error;
    }
  }
}

export const noteService = new NoteService();