import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const STORAGE_LOCATION_KEY = 'storage_location';
const DEFAULT_STORAGE_PATH = FileSystem.documentDirectory || '';

export interface StorageLocationInfo {
  path: string;
  type: 'internal' | 'external' | 'custom';
  lastUpdated: string;
  isDefault: boolean;
}

class StorageLocationService {
  private currentLocation: string = DEFAULT_STORAGE_PATH;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const savedLocation = await AsyncStorage.getItem(STORAGE_LOCATION_KEY);
      if (savedLocation) {
        const locationInfo: StorageLocationInfo = JSON.parse(savedLocation);
        
        // Validate that the saved location still exists and is accessible
        const isValid = await this.validateStorageLocation(locationInfo.path);
        if (isValid) {
          this.currentLocation = locationInfo.path;
        } else {
          // Reset to default if saved location is no longer valid
          await this.resetToDefault();
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage location service:', error);
      this.currentLocation = DEFAULT_STORAGE_PATH;
      this.initialized = true;
    }
  }

  async getCurrentStorageLocation(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.currentLocation;
  }

  async setStorageLocation(path: string): Promise<void> {
    try {
      // Validate the new location
      const isValid = await this.validateStorageLocation(path);
      if (!isValid) {
        throw new Error('Invalid storage location');
      }

      // Ensure the directory exists
      await this.ensureDirectoryExists(path);

      // Save the new location
      const locationInfo: StorageLocationInfo = {
        path,
        type: this.getStorageType(path),
        lastUpdated: new Date().toISOString(),
        isDefault: path === DEFAULT_STORAGE_PATH,
      };

      await AsyncStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(locationInfo));
      this.currentLocation = path;

      console.log('Storage location updated to:', path);
    } catch (error) {
      console.error('Failed to set storage location:', error);
      throw new Error('Failed to set storage location. Please ensure the location is accessible and you have write permissions.');
    }
  }

  async resetToDefault(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_LOCATION_KEY);
      this.currentLocation = DEFAULT_STORAGE_PATH;
      
      // Ensure default directory exists
      await this.ensureDirectoryExists(DEFAULT_STORAGE_PATH);
      
      console.log('Storage location reset to default:', DEFAULT_STORAGE_PATH);
    } catch (error) {
      console.error('Failed to reset storage location:', error);
      throw new Error('Failed to reset storage location');
    }
  }

  async getStorageLocationInfo(): Promise<StorageLocationInfo> {
    const currentPath = await this.getCurrentStorageLocation();
    
    return {
      path: currentPath,
      type: this.getStorageType(currentPath),
      lastUpdated: new Date().toISOString(),
      isDefault: currentPath === DEFAULT_STORAGE_PATH,
    };
  }

  async validateStorageLocation(path: string): Promise<boolean> {
    try {
      if (!path) return false;

      // Check if path exists
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) {
        return false;
      }

      // Try to create a test file to check write permissions
      const testFileName = `${path}/.storage-test-${Date.now()}.tmp`;
      await FileSystem.writeAsStringAsync(testFileName, 'test', { encoding: 'utf8' });
      
      // Clean up test file
      await FileSystem.deleteAsync(testFileName, { idempotent: true });
      
      return true;
    } catch (error) {
      console.warn('Storage validation failed for path:', path, error);
      return false;
    }
  }

  async ensureDirectoryExists(path: string): Promise<void> {
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(path, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to create directory:', path, error);
      throw new Error('Failed to create storage directory');
    }
  }

  private getStorageType(path: string): 'internal' | 'external' | 'custom' {
    if (path === DEFAULT_STORAGE_PATH) {
      return 'internal';
    }
    
    if (Platform.OS === 'android' && path.includes('external')) {
      return 'external';
    }
    
    return 'custom';
  }

  async getAvailableSpace(path?: string): Promise<{ free: number; total: number } | null> {
    try {
      const targetPath = path || this.currentLocation;
      
      // Note: FileSystem.getFreeDiskStorageAsync() provides limited info
      // This is a simplified implementation for cross-platform compatibility
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      
      return {
        free: freeSpace,
        total: 0, // Total space not easily available in Expo managed workflow
      };
    } catch (error) {
      console.warn('Failed to get storage space info:', error);
      return null;
    }
  }

  async moveNotesToNewLocation(oldPath: string, newPath: string): Promise<void> {
    try {
      // This is a placeholder for moving notes to a new location
      // In a real implementation, you would:
      // 1. Copy all note files from oldPath to newPath
      // 2. Verify the copy was successful
      // 3. Delete files from oldPath
      // 4. Update note references in the database
      
      console.warn('Note migration not implemented in this version');
      throw new Error('Note migration feature not available. Please manually backup your notes before changing storage location.');
    } catch (error) {
      console.error('Failed to move notes:', error);
      throw error;
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

export const storageLocationService = new StorageLocationService();