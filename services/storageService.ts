import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Note } from '@/types/note';
import { noteService } from './noteService';

class StorageService {
  async exportData(): Promise<void> {
    try {
      const notes = await noteService.getAllNotes();
      const exportData = {
        notes,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  async importData(): Promise<void> {
    try {
      // This would typically use DocumentPicker to select a file
      // For now, this is a placeholder implementation
      throw new Error('Import functionality not yet implemented');
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Clear data failed:', error);
      throw error;
    }
  }

  async getStorageInfo(): Promise<{
    totalNotes: number;
    totalSize: string;
    lastBackup: string | null;
  }> {
    try {
      const notes = await noteService.getAllNotes();
      const notesString = JSON.stringify(notes);
      const sizeInBytes = new Blob([notesString]).size;
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

      return {
        totalNotes: notes.length,
        totalSize: `${sizeInMB} MB`,
        lastBackup: null, // Would come from sync service
      };
    } catch (error) {
      console.error('Get storage info failed:', error);
      return {
        totalNotes: 0,
        totalSize: '0 MB',
        lastBackup: null,
      };
    }
  }
}

export const storageService = new StorageService();