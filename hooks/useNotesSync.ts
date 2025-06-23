import { useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNotes } from '@/contexts/NotesContext';

/**
 * Custom hook to handle notes synchronization
 * Automatically syncs when app becomes active
 */
export function useNotesSync() {
  const { refreshNotes } = useNotes();

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // Refresh notes when app becomes active
      refreshNotes();
    }
  }, [refreshNotes]);

  useEffect(() => {
    // Add listener for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, [handleAppStateChange]);

  return { refreshNotes };
}

/**
 * Custom hook for optimistic updates with error recovery
 */
export function useOptimisticUpdate<T>(
  updateFn: (data: T) => Promise<void>,
  onError?: (error: Error) => void
) {
  const update = useCallback(async (data: T, optimisticUpdate?: () => void, rollback?: () => void) => {
    try {
      // Apply optimistic update immediately
      optimisticUpdate?.();
      
      // Perform actual update
      await updateFn(data);
    } catch (error) {
      // Rollback optimistic update
      rollback?.();
      
      // Handle error
      onError?.(error as Error);
      throw error;
    }
  }, [updateFn, onError]);

  return { update };
}