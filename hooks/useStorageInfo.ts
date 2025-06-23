import { useState, useCallback, useEffect } from 'react';
import { storageLocationService } from '@/services/storageLocationService';
import { noteService } from '@/services/noteService';

interface StorageInfo {
  totalNotes: number;
  totalSize: string;
  freeSpace: string;
  currentLocation: string;
  locationType: 'internal' | 'external' | 'custom';
  lastUpdated: string;
}

export function useStorageInfo() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStorageInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get notes information
      const notes = await noteService.getAllNotes();
      const notesString = JSON.stringify(notes);
      const sizeInBytes = new Blob([notesString]).size;

      // Get storage location info
      const locationInfo = await storageLocationService.getStorageLocationInfo();
      
      // Get available space
      const spaceInfo = await storageLocationService.getAvailableSpace();

      const info: StorageInfo = {
        totalNotes: notes.length,
        totalSize: storageLocationService.formatBytes(sizeInBytes),
        freeSpace: spaceInfo ? storageLocationService.formatBytes(spaceInfo.free) : 'Unknown',
        currentLocation: locationInfo.path,
        locationType: locationInfo.type,
        lastUpdated: new Date().toISOString(),
      };

      setStorageInfo(info);
    } catch (err) {
      console.error('Failed to get storage info:', err);
      setError('Failed to load storage information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStorageInfo();
  }, [refreshStorageInfo]);

  return {
    storageInfo,
    loading,
    error,
    refreshStorageInfo,
  };
}

export function useStorageLocationValidation() {
  const [validating, setValidating] = useState(false);

  const validateLocation = useCallback(async (path: string): Promise<boolean> => {
    setValidating(true);
    try {
      return await storageLocationService.validateStorageLocation(path);
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    } finally {
      setValidating(false);
    }
  }, []);

  return {
    validating,
    validateLocation,
  };
}