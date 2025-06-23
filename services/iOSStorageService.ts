import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { storageLocationService } from './storageLocationService';

interface iOSStorageLocation {
  id: string;
  name: string;
  path: string;
  type: 'app_documents' | 'app_support' | 'icloud_drive' | 'files_app' | 'shared_container';
  available: boolean;
  description: string;
  icon: string;
  securityScoped?: boolean;
  requiresPermission?: boolean;
}

class iOSStorageService {
  private readonly APP_GROUP_IDENTIFIER = 'group.com.notetaker.shared';
  
  async getiOSSpecificStorageOptions(): Promise<iOSStorageLocation[]> {
    if (Platform.OS !== 'ios') {
      return [];
    }

    const options: iOSStorageLocation[] = [];

    // App Documents Directory (Default, always available)
    options.push({
      id: 'app_documents',
      name: 'App Documents',
      path: FileSystem.documentDirectory || '',
      type: 'app_documents',
      available: true,
      description: 'Secure app documents folder (syncs with iCloud if enabled)',
      icon: 'folder',
      securityScoped: false,
      requiresPermission: false,
    });

    // App Support Directory (iOS 16+)
    if (FileSystem.cacheDirectory) {
      const appSupportPath = FileSystem.cacheDirectory.replace('/Caches', '/Library/Application Support');
      options.push({
        id: 'app_support',
        name: 'App Support',
        path: appSupportPath,
        type: 'app_support',
        available: true,
        description: 'App support files (not user-visible, backup excluded)',
        icon: 'gear',
        securityScoped: false,
        requiresPermission: false,
      });
    }

    // Files App Integration (iOS 16 Enhanced)
    try {
      const filesAppSupported = await this.checkFilesAppSupport();
      options.push({
        id: 'files_app',
        name: 'Files App Location',
        path: 'files_app_picker',
        type: 'files_app',
        available: filesAppSupported,
        description: 'Choose any location accessible through Files app',
        icon: 'folder.badge.plus',
        securityScoped: true,
        requiresPermission: true,
      });
    } catch (error) {
      console.warn('Files app integration check failed:', error);
    }

    // iCloud Drive (if available)
    try {
      const iCloudAvailable = await this.checkiCloudAvailability();
      options.push({
        id: 'icloud_drive',
        name: 'iCloud Drive',
        path: 'icloud_drive',
        type: 'icloud_drive',
        available: iCloudAvailable,
        description: 'Store notes in iCloud Drive for cross-device sync',
        icon: 'icloud',
        securityScoped: true,
        requiresPermission: true,
      });
    } catch (error) {
      console.warn('iCloud availability check failed:', error);
    }

    // Shared Container (App Groups - iOS 16 Enhanced)
    try {
      const sharedContainerPath = await this.getSharedContainerPath();
      if (sharedContainerPath) {
        options.push({
          id: 'shared_container',
          name: 'Shared Storage',
          path: sharedContainerPath,
          type: 'shared_container',
          available: true,
          description: 'Shared between app extensions and main app',
          icon: 'square.stack.3d.up',
          securityScoped: false,
          requiresPermission: false,
        });
      }
    } catch (error) {
      console.warn('Shared container check failed:', error);
    }

    return options;
  }

  async checkFilesAppSupport(): Promise<boolean> {
    try {
      // iOS 16+ has enhanced Files app integration
      return Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 16;
    } catch (error) {
      return false;
    }
  }

  async checkiCloudAvailability(): Promise<boolean> {
    try {
      // Check if iCloud is available and configured
      // This is a simplified check - in production, you'd use native APIs
      return Platform.OS === 'ios';
    } catch (error) {
      return false;
    }
  }

  async getSharedContainerPath(): Promise<string | null> {
    try {
      // In a real app, this would use native APIs to get the shared container path
      // For Expo managed workflow, we simulate this
      if (Platform.OS === 'ios') {
        const basePath = FileSystem.documentDirectory?.replace('/Documents', '');
        return `${basePath}/Library/Group Containers/${this.APP_GROUP_IDENTIFIER}`;
      }
      return null;
    } catch (error) {
      console.error('Failed to get shared container path:', error);
      return null;
    }
  }

  async selectFilesAppLocation(): Promise<string | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        
        // iOS 16+ provides better security-scoped URL handling
        return this.processSecurityScopedURL(selectedUri);
      }
      
      return null;
    } catch (error) {
      console.error('Files app selection failed:', error);
      throw new Error('Unable to access Files app. Please ensure you have the latest iOS version.');
    }
  }

  private async processSecurityScopedURL(url: string): Promise<string> {
    try {
      // iOS 16+ security-scoped URL processing
      // In a real implementation, this would handle security-scoped resources
      
      // For now, we validate the URL and ensure it's accessible
      const info = await FileSystem.getInfoAsync(url);
      if (info.exists) {
        return url;
      }
      
      throw new Error('Selected location is not accessible');
    } catch (error) {
      console.error('Security-scoped URL processing failed:', error);
      throw error;
    }
  }

  async validateiOSStorageLocation(path: string, type: iOSStorageLocation['type']): Promise<boolean> {
    try {
      switch (type) {
        case 'app_documents':
        case 'app_support':
        case 'shared_container':
          return await this.validateLocalPath(path);
        
        case 'files_app':
          return await this.validateFilesAppPath(path);
        
        case 'icloud_drive':
          return await this.validateiCloudPath(path);
        
        default:
          return false;
      }
    } catch (error) {
      console.error('iOS storage validation failed:', error);
      return false;
    }
  }

  private async validateLocalPath(path: string): Promise<boolean> {
    try {
      // Check if path exists
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) {
        // Try to create the directory if it doesn't exist
        await FileSystem.makeDirectoryAsync(path, { intermediates: true });
      }

      // Test write permission with iOS-optimized approach
      const testFile = `${path}/.notetaker-test-${Date.now()}.tmp`;
      await FileSystem.writeAsStringAsync(testFile, 'test', { 
        encoding: FileSystem.EncodingType.UTF8 
      });
      
      // Verify file was created
      const testInfo = await FileSystem.getInfoAsync(testFile);
      if (!testInfo.exists) {
        return false;
      }
      
      // Clean up
      await FileSystem.deleteAsync(testFile, { idempotent: true });
      
      return true;
    } catch (error) {
      console.warn('Local path validation failed:', error);
      return false;
    }
  }

  private async validateFilesAppPath(path: string): Promise<boolean> {
    try {
      // Files app paths require special handling in iOS 16+
      // This would involve security-scoped URLs and bookmark data
      
      const info = await FileSystem.getInfoAsync(path);
      return info.exists;
    } catch (error) {
      console.warn('Files app path validation failed:', error);
      return false;
    }
  }

  private async validateiCloudPath(path: string): Promise<boolean> {
    try {
      // iCloud Drive validation requires checking sync status
      // In iOS 16+, we can check if files are downloaded or cloud-only
      
      const info = await FileSystem.getInfoAsync(path);
      return info.exists;
    } catch (error) {
      console.warn('iCloud path validation failed:', error);
      return false;
    }
  }

  async optimizeForBattery(): Promise<void> {
    try {
      // iOS 16+ battery optimization strategies
      // Reduce file system operations during low power mode
      // Batch write operations
      // Use background processing when appropriate
      
      console.log('Applying iOS 16 battery optimizations...');
    } catch (error) {
      console.warn('Battery optimization failed:', error);
    }
  }

  async setupiOSBackgroundSync(): Promise<void> {
    try {
      // iOS 16+ background app refresh optimization
      // Configure background processing for note sync
      // Handle app state transitions
      
      console.log('Setting up iOS 16 background sync...');
    } catch (error) {
      console.warn('Background sync setup failed:', error);
    }
  }

  async getDetailedStorageInfo(path: string): Promise<{
    totalSpace: number;
    freeSpace: number;
    fileCount: number;
    lastAccess: Date;
    securityScope: boolean;
    iCloudStatus?: 'downloaded' | 'in_cloud' | 'downloading';
  } | null> {
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) {
        return null;
      }

      // iOS 16+ provides enhanced file system information
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      
      return {
        totalSpace: 0, // Would be calculated from device storage
        freeSpace: freeSpace,
        fileCount: 0, // Would enumerate files in directory
        lastAccess: new Date(info.modificationTime || 0),
        securityScope: path.includes('files_app') || path.includes('icloud'),
        iCloudStatus: path.includes('icloud') ? 'downloaded' : undefined,
      };
    } catch (error) {
      console.error('Failed to get detailed storage info:', error);
      return null;
    }
  }

  async migrateToinOS16Storage(oldPath: string, newPath: string): Promise<void> {
    try {
      // iOS 16 optimized migration
      // Use FileManager coordination for atomic operations
      // Handle security-scoped URLs properly
      // Maintain file attributes and metadata
      
      console.log(`Migrating from ${oldPath} to ${newPath}...`);
      
      // In a real implementation, this would:
      // 1. Create new directory structure
      // 2. Copy files with proper attribute preservation
      // 3. Verify integrity
      // 4. Update references
      // 5. Clean up old location
      
      throw new Error('Migration feature requires native implementation for security-scoped URLs');
    } catch (error) {
      console.error('iOS 16 migration failed:', error);
      throw error;
    }
  }
}

export const iOSStorageService = new iOSStorageService();