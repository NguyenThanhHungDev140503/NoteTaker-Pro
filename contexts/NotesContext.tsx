import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Note } from '@/types/note';
import { noteService } from '@/services/noteService';

// Define action types
type NotesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: { id: string; updates: Partial<Note> } }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_OPERATION_LOADING'; payload: { operation: string; loading: boolean } };

// Define state interface
interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  operationLoading: Record<string, boolean>;
}

// Define context interface
interface NotesContextType extends NotesState {
  createNote: (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<Note>;
  getNoteById: (id: string) => Note | undefined;
  refreshNotes: () => Promise<void>;
  getFavoriteNotes: () => Note[];
  getRecentNotes: (limit?: number) => Note[];
  searchNotes: (query: string) => Note[];
}

// Initial state
const initialState: NotesState = {
  notes: [],
  loading: false,
  error: null,
  operationLoading: {},
};

// Reducer function
function notesReducer(state: NotesState, action: NotesAction): NotesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_NOTES':
      return { ...state, notes: action.payload, loading: false, error: null };
    
    case 'ADD_NOTE':
      return { 
        ...state, 
        notes: [action.payload, ...state.notes],
        error: null 
      };
    
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload.id
            ? { ...note, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : note
        ),
        error: null
      };
    
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload),
        error: null
      };
    
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload
            ? { ...note, isFavorite: !note.isFavorite, updatedAt: new Date().toISOString() }
            : note
        ),
        error: null
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_OPERATION_LOADING':
      return {
        ...state,
        operationLoading: {
          ...state.operationLoading,
          [action.payload.operation]: action.payload.loading
        }
      };
    
    default:
      return state;
  }
}

// Create context
const NotesContext = createContext<NotesContextType | undefined>(undefined);

// Provider component
interface NotesProviderProps {
  children: ReactNode;
}

export function NotesProvider({ children }: NotesProviderProps) {
  const [state, dispatch] = useReducer(notesReducer, initialState);

  // Load initial notes
  useEffect(() => {
    refreshNotes();
  }, []);

  // Helper function to set operation loading state
  const setOperationLoading = (operation: string, loading: boolean) => {
    dispatch({ type: 'SET_OPERATION_LOADING', payload: { operation, loading } });
  };

  // Refresh notes from storage
  const refreshNotes = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const notes = await noteService.getAllNotes();
      dispatch({ type: 'SET_NOTES', payload: notes });
    } catch (error) {
      console.error('Failed to refresh notes:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load notes' });
    }
  };

  // Create new note
  const createNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    try {
      setOperationLoading('create', true);
      
      // Optimistic update
      const tempNote: Note = {
        ...noteData,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_NOTE', payload: tempNote });

      // Persist to storage
      const newNote = await noteService.createNote(noteData);
      
      // Replace temp note with real note
      dispatch({ type: 'DELETE_NOTE', payload: tempNote.id });
      dispatch({ type: 'ADD_NOTE', payload: newNote });
      
      return newNote;
    } catch (error) {
      console.error('Failed to create note:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create note' });
      throw error;
    } finally {
      setOperationLoading('create', false);
    }
  };

  // Update note
  const updateNote = async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note> => {
    try {
      setOperationLoading(`update-${id}`, true);
      
      // Get current note for rollback
      const currentNote = state.notes.find(note => note.id === id);
      if (!currentNote) {
        throw new Error('Note not found');
      }

      // Optimistic update
      dispatch({ type: 'UPDATE_NOTE', payload: { id, updates } });

      // Persist to storage
      const updatedNote = await noteService.updateNote(id, updates);
      
      // Update with server data
      dispatch({ type: 'UPDATE_NOTE', payload: { id, updates: updatedNote } });
      
      return updatedNote;
    } catch (error) {
      console.error('Failed to update note:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update note' });
      
      // Rollback on error
      await refreshNotes();
      throw error;
    } finally {
      setOperationLoading(`update-${id}`, false);
    }
  };

  // Delete note
  const deleteNote = async (id: string): Promise<void> => {
    try {
      setOperationLoading(`delete-${id}`, true);
      
      // Get note for rollback
      const noteToDelete = state.notes.find(note => note.id === id);
      if (!noteToDelete) {
        throw new Error('Note not found');
      }

      // Optimistic update
      dispatch({ type: 'DELETE_NOTE', payload: id });

      // Persist to storage
      await noteService.deleteNote(id);
      
    } catch (error) {
      console.error('Failed to delete note:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete note' });
      
      // Rollback on error
      await refreshNotes();
      throw error;
    } finally {
      setOperationLoading(`delete-${id}`, false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (id: string): Promise<Note> => {
    try {
      setOperationLoading(`favorite-${id}`, true);
      
      // Get current note for rollback
      const currentNote = state.notes.find(note => note.id === id);
      if (!currentNote) {
        throw new Error('Note not found');
      }

      // Optimistic update
      dispatch({ type: 'TOGGLE_FAVORITE', payload: id });

      // Persist to storage
      const updatedNote = await noteService.toggleFavorite(id);
      
      return updatedNote;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update favorite status' });
      
      // Rollback on error
      dispatch({ type: 'TOGGLE_FAVORITE', payload: id });
      throw error;
    } finally {
      setOperationLoading(`favorite-${id}`, false);
    }
  };

  // Get note by ID
  const getNoteById = (id: string): Note | undefined => {
    return state.notes.find(note => note.id === id);
  };

  // Get favorite notes
  const getFavoriteNotes = (): Note[] => {
    return state.notes.filter(note => note.isFavorite);
  };

  // Get recent notes
  const getRecentNotes = (limit: number = 5): Note[] => {
    return [...state.notes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  };

  // Search notes
  const searchNotes = (query: string): Note[] => {
    const lowercaseQuery = query.toLowerCase();
    return state.notes.filter(note =>
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.toLowerCase().includes(lowercaseQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  const contextValue: NotesContextType = {
    ...state,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    getNoteById,
    refreshNotes,
    getFavoriteNotes,
    getRecentNotes,
    searchNotes,
  };

  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  );
}

// Custom hook to use notes context
export function useNotes(): NotesContextType {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}

// Custom hook for specific note operations
export function useNote(id: string) {
  const { getNoteById, updateNote, deleteNote, toggleFavorite, operationLoading } = useNotes();
  
  const note = getNoteById(id);
  const isUpdating = operationLoading[`update-${id}`] || false;
  const isDeleting = operationLoading[`delete-${id}`] || false;
  const isFavoriteLoading = operationLoading[`favorite-${id}`] || false;

  return {
    note,
    updateNote: (updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => updateNote(id, updates),
    deleteNote: () => deleteNote(id),
    toggleFavorite: () => toggleFavorite(id),
    isUpdating,
    isDeleting,
    isFavoriteLoading,
  };
}