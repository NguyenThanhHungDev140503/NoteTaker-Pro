import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';
import { Note } from '@/types/note';
import { noteService } from './noteService';

interface ExportData {
  notes: Note[];
  exportDate: string;
  version: string;
}

class StorageService {
  async exportData(): Promise<void> {
    try {
      const notes = await noteService.getAllNotes();
      const exportData: ExportData = {
        notes,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        // Web-specific export using blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Mobile platforms using file system
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          console.log('Export saved to:', fileUri);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data. Please try again.');
    }
  }

  async importData(): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      // Check if we're on web platform
      if (Platform.OS === 'web') {
        return await this.importDataWeb();
      }

      // Use DocumentPicker for mobile platforms
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { success: false, imported: 0, errors: ['Import cancelled by user'] };
      }

      if (!result.assets || result.assets.length === 0) {
        return { success: false, imported: 0, errors: ['No file selected'] };
      }

      const fileUri = result.assets[0].uri;
      return await this.processImportFile(fileUri);

    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import data. Please check the file format and try again.');
    }
  }

  private async importDataWeb(): Promise<{ success: boolean; imported: number; errors: string[] }> {
    return new Promise((resolve, reject) => {
      try {
        // Create a file input element for web
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        
        input.onchange = async (event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          
          if (!file) {
            resolve({ success: false, imported: 0, errors: ['No file selected'] });
            return;
          }

          try {
            const text = await file.text();
            const result = await this.processImportData(text);
            resolve(result);
          } catch (error) {
            resolve({ success: false, imported: 0, errors: ['Failed to read file'] });
          }
        };

        input.oncancel = () => {
          resolve({ success: false, imported: 0, errors: ['Import cancelled by user'] });
        };

        // Trigger file picker
        input.click();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async processImportFile(fileUri: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      return await this.processImportData(fileContent);
    } catch (error) {
      console.error('Failed to read import file:', error);
      return { success: false, imported: 0, errors: ['Failed to read the selected file'] };
    }
  }

  private async processImportData(jsonContent: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const importData = JSON.parse(jsonContent);
      const errors: string[] = [];
      let imported = 0;

      // Validate import data structure
      if (!this.validateImportData(importData)) {
        return { 
          success: false, 
          imported: 0, 
          errors: ['Invalid file format. Please select a valid notes backup file.'] 
        };
      }

      const { notes } = importData as ExportData;
      const currentNotes = await noteService.getAllNotes();
      const existingIds = new Set(currentNotes.map(note => note.id));

      // Process each note
      for (const note of notes) {
        try {
          // Validate note structure
          if (!this.validateNoteStructure(note)) {
            errors.push(`Skipped invalid note: ${note.title || 'Untitled'}`);
            continue;
          }

          // Handle duplicate IDs
          if (existingIds.has(note.id)) {
            // Generate new ID for duplicate
            const newNote = {
              ...note,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              title: `${note.title} (Imported)`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            await noteService.createNote(newNote);
            imported++;
          } else {
            // Import note with original ID
            await noteService.createNote(note);
            imported++;
          }
        } catch (noteError) {
          errors.push(`Failed to import note: ${note.title || 'Untitled'}`);
          console.error('Note import error:', noteError);
        }
      }

      return {
        success: imported > 0,
        imported,
        errors
      };

    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return { 
        success: false, 
        imported: 0, 
        errors: ['Invalid JSON format. Please select a valid backup file.'] 
      };
    }
  }

  private validateImportData(data: any): data is ExportData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.notes) &&
      typeof data.exportDate === 'string' &&
      typeof data.version === 'string'
    );
  }

  private validateNoteStructure(note: any): note is Note {
    return (
      note &&
      typeof note === 'object' &&
      typeof note.id === 'string' &&
      typeof note.title === 'string' &&
      typeof note.content === 'string' &&
      typeof note.createdAt === 'string' &&
      typeof note.updatedAt === 'string' &&
      Array.isArray(note.images) &&
      Array.isArray(note.audioRecordings) &&
      Array.isArray(note.tags) &&
      typeof note.isFavorite === 'boolean'
    );
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Clear data failed:', error);
      throw new Error('Failed to clear data. Please try again.');
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

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const storageService = new StorageService();