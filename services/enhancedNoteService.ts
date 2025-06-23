import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Note } from '@/types/note';
import { storageLocationService } from './storageLocationService';

const NOTES_KEY = 'notes';
const NOTES_FILE_NAME = 'notes.json';

class EnhancedNoteService {
  private async getStoragePath(): Promise<string> {
    const currentLocation = await storageLocationService.getCurrentStorageLocation();
    return `${currentLocation}/${NOTES_FILE_NAME}`;
  }

  private async getNotesFromStorage(): Promise<Note[]> {
    try {
      // Try to read from file system first (if custom location is set)
      const currentLocation = await storageLocationService.getCurrentStorageLocation();
      const defaultLocation = FileSystem.documentDirectory || '';
      
      if (currentLocation !== defaultLocation) {
        // Custom location - use file system
        return await this.getNotesFromFile();
      } else {
        // Default location - use AsyncStorage for compatibility
        return await this.getNotesFromAsyncStorage();
      }
    } catch (error) {
      console.error('Failed to get notes from storage:', error);
      // Fallback to AsyncStorage
      return await this.getNotesFromAsyncStorage();
    }
  }

  private async saveNotesToStorage(notes: Note[]): Promise<void> {
    try {
      const currentLocation = await storageLocationService.getCurrentStorageLocation();
      const defaultLocation = FileSystem.documentDirectory || '';
      
      if (currentLocation !== defaultLocation) {
        // Custom location - use file system
        await this.saveNotesToFile(notes);
      } else {
        // Default location - use AsyncStorage for compatibility
        await this.saveNotesToAsyncStorage(notes);
      }
    } catch (error) {
      console.error('Failed to save notes to storage:', error);
      // Fallback to AsyncStorage
      await this.saveNotesToAsyncStorage(notes);
    }
  }

  private async getNotesFromAsyncStorage(): Promise<Note[]> {
    try {
      const notesJson = await AsyncStorage.getItem(NOTES_KEY);
      return notesJson ? JSON.parse(notesJson) : [];
    } catch (error) {
      console.error('Failed to load notes from AsyncStorage:', error);
      return [];
    }
  }

  private async saveNotesToAsyncStorage(notes: Note[]): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Failed to save notes to AsyncStorage:', error);
      throw error;
    }
  }

  private async getNotesFromFile(): Promise<Note[]> {
    try {
      const filePath = await this.getStoragePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        return [];
      }
      
      const content = await FileSystem.readAsStringAsync(filePath);
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load notes from file:', error);
      return [];
    }
  }

  private async saveNotesToFile(notes: Note[]): Promise<void> {
    try {
      const filePath = await this.getStoragePath();
      
      // Ensure directory exists
      const directory = filePath.substring(0, filePath.lastIndexOf('/'));
      await storageLocationService.ensureDirectoryExists(directory);
      
      // Save notes to file
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(notes, null, 2));
    } catch (error) {
      console.error('Failed to save notes to file:', error);
      throw error;
    }
  }

  async getAllNotes(): Promise<Note[]> {
    return await this.getNotesFromStorage();
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
      await this.saveNotesToStorage(notes);
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
      await this.saveNotesToStorage(notes);
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
      await this.saveNotesToStorage(filteredNotes);
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
      await this.saveNotesToStorage(notes);
      
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
      await this.saveNotesToStorage([]);
    } catch (error) {
      console.error('Failed to clear notes:', error);
      throw error;
    }
  }

  async migrateToNewLocation(newLocation: string): Promise<void> {
    try {
      // Get current notes
      const notes = await this.getAllNotes();
      
      // Update storage location
      await storageLocationService.setStorageLocation(newLocation);
      
      // Save notes to new location
      await this.saveNotesToStorage(notes);
      
      console.log('Notes migrated to new location successfully');
    } catch (error) {
      console.error('Failed to migrate notes:', error);
      throw new Error('Failed to migrate notes to new location');
    }
  }

  async getStorageStats(): Promise<{
    noteCount: number;
    totalSize: number;
    averageSize: number;
    lastModified: string;
  }> {
    try {
      const notes = await this.getAllNotes();
      const notesString = JSON.stringify(notes);
      const totalSize = new Blob([notesString]).size;
      
      return {
        noteCount: notes.length,
        totalSize,
        averageSize: notes.length > 0 ? totalSize / notes.length : 0,
        lastModified: notes.length > 0 ? 
          Math.max(...notes.map(note => new Date(note.updatedAt).getTime())).toString() : 
          new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        noteCount: 0,
        totalSize: 0,
        averageSize: 0,
        lastModified: new Date().toISOString(),
      };
    }
  }
}

export const enhancedNoteService = new EnhancedNoteService();