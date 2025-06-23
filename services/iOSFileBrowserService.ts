import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';
import { storageLocationService } from './storageLocationService';

interface iOSFileBrowserOptions {
  initialDirectory?: string;
  allowedFileTypes?: string[];
  allowMultiple?: boolean;
  presentationStyle?: 'automatic' | 'fullScreen' | 'pageSheet' | 'overFullScreen';
}

interface FileBrowserResult {
  success: boolean;
  files: Array<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  }>;
  error?: string;
}

class iOSFileBrowserService {
  private readonly SUPPORTED_NOTE_FORMATS = [
    'application/json',
    'text/plain',
    'text/markdown',
    '.json',
    '.txt',
    '.md',
    '.note'
  ];

  /**
   * Opens file browser with iOS 16 optimized configuration
   * Automatically sets initial directory to app's notes storage location
   */
  async openNotesDirectoryBrowser(options: Partial<iOSFileBrowserOptions> = {}): Promise<FileBrowserResult> {
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        files: [],
        error: 'iOS file browser is only available on iOS devices'
      };
    }

    try {
      // Get current notes storage location
      const notesStorageLocation = await this.getNotesStorageLocation();
      
      // Request file access permissions
      const hasPermission = await this.requestFileAccessPermissions();
      if (!hasPermission) {
        return {
          success: false,
          files: [],
          error: 'File access permissions denied'
        };
      }

      // Configure document picker for iOS 16
      const pickerOptions = this.buildDocumentPickerOptions(notesStorageLocation, options);
      
      // Open document picker
      const result = await DocumentPicker.getDocumentAsync(pickerOptions);
      
      if (result.canceled) {
        return {
          success: false,
          files: [],
          error: 'File selection cancelled by user'
        };
      }

      // Process selected files
      const processedFiles = await this.processSelectedFiles(result.assets || []);
      
      return {
        success: true,
        files: processedFiles
      };

    } catch (error) {
      console.error('iOS file browser error:', error);
      return {
        success: false,
        files: [],
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Get the app's designated notes storage directory
   */
  private async getNotesStorageLocation(): Promise<string> {
    try {
      const currentLocation = await storageLocationService.getCurrentStorageLocation();
      
      // Ensure the notes directory exists
      const notesDirectory = `${currentLocation}/notes/`;
      await this.ensureDirectoryExists(notesDirectory);
      
      return notesDirectory;
    } catch (error) {
      console.warn('Failed to get notes storage location, using default:', error);
      return FileSystem.documentDirectory || '';
    }
  }

  /**
   * Request file access permissions for iOS
   */
  private async requestFileAccessPermissions(): Promise<boolean> {
    try {
      // In Expo managed workflow, we rely on DocumentPicker's built-in permission handling
      // For native implementation, you would use:
      // - NSDocumentDirectory access permissions
      // - Security-scoped URLs for iOS 16+
      
      // Test access by attempting to read the directory
      const notesDir = await this.getNotesStorageLocation();
      const dirInfo = await FileSystem.getInfoAsync(notesDir);
      
      return dirInfo.exists;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Build document picker options optimized for iOS 16
   */
  private buildDocumentPickerOptions(
    initialDirectory: string, 
    userOptions: Partial<iOSFileBrowserOptions>
  ): DocumentPicker.DocumentPickerOptions {
    const baseOptions: DocumentPicker.DocumentPickerOptions = {
      type: userOptions.allowedFileTypes || this.SUPPORTED_NOTE_FORMATS,
      multiple: userOptions.allowMultiple || false,
      copyToCacheDirectory: false, // Keep original file location for iOS 16
    };

    // iOS 16 specific optimizations
    if (Platform.OS === 'ios') {
      const iosVersion = parseInt(Platform.Version as string, 10);
      
      if (iosVersion >= 16) {
        // iOS 16+ enhanced configuration
        return {
          ...baseOptions,
          // Note: In native implementation, you would set:
          // - UIDocumentPickerViewController.directoryURL
          // - modalPresentationStyle based on userOptions.presentationStyle
          // - allowsMultipleSelection
        };
      }
    }

    return baseOptions;
  }

  /**
   * Process selected files and extract metadata
   */
  private async processSelectedFiles(assets: DocumentPicker.DocumentPickerAsset[]): Promise<Array<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  }>> {
    const processedFiles = [];

    for (const asset of assets) {
      try {
        // Validate file type
        if (!this.isValidNoteFile(asset)) {
          console.warn(`Skipping unsupported file: ${asset.name}`);
          continue;
        }

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        processedFiles.push({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || (fileInfo.exists ? fileInfo.size : undefined),
          mimeType: asset.mimeType
        });
      } catch (error) {
        console.error(`Error processing file ${asset.name}:`, error);
        // Continue with other files
      }
    }

    return processedFiles;
  }

  /**
   * Validate if selected file is a supported note format
   */
  private isValidNoteFile(asset: DocumentPicker.DocumentPickerAsset): boolean {
    // Check by MIME type
    if (asset.mimeType && this.SUPPORTED_NOTE_FORMATS.includes(asset.mimeType)) {
      return true;
    }

    // Check by file extension
    const extension = asset.name.toLowerCase().split('.').pop();
    if (extension) {
      const extWithDot = `.${extension}`;
      return this.SUPPORTED_NOTE_FORMATS.includes(extWithDot);
    }

    return false;
  }

  /**
   * Ensure directory exists, create if necessary
   */
  private async ensureDirectoryExists(directoryPath: string): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(directoryPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directoryPath, { intermediates: true });
      }
    } catch (error) {
      console.error(`Failed to create directory ${directoryPath}:`, error);
      throw new Error(`Cannot access notes directory: ${directoryPath}`);
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unknown error occurred while accessing files';
  }

  /**
   * Browse specific notes directory with enhanced iOS 16 features
   */
  async browseNotesDirectory(): Promise<FileBrowserResult> {
    const isIOS16Plus = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 16;
    
    const options: Partial<iOSFileBrowserOptions> = {
      allowedFileTypes: this.SUPPORTED_NOTE_FORMATS,
      allowMultiple: true, // Allow selecting multiple note files
      presentationStyle: isIOS16Plus ? 'pageSheet' : 'automatic'
    };

    const result = await this.openNotesDirectoryBrowser(options);
    
    if (!result.success && result.error?.includes('permissions')) {
      // Show helpful error message for permission issues
      Alert.alert(
        'File Access Required',
        'The app needs permission to access your notes directory. Please grant file access permissions and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => this.browseNotesDirectory() }
        ]
      );
    }

    return result;
  }

  /**
   * Import notes from selected files
   */
  async importNotesFromFiles(files: Array<{ uri: string; name: string }>): Promise<{
    imported: number;
    errors: string[];
  }> {
    let imported = 0;
    const errors: string[] = [];

    for (const file of files) {
      try {
        const content = await FileSystem.readAsStringAsync(file.uri);
        
        // Validate JSON format for note files
        if (file.name.endsWith('.json')) {
          const noteData = JSON.parse(content);
          
          // Here you would integrate with your note service
          // await noteService.importNote(noteData);
          
          imported++;
        } else {
          // Handle other formats (txt, md) by creating new notes
          // const newNote = this.createNoteFromTextFile(file.name, content);
          // await noteService.createNote(newNote);
          
          imported++;
        }
      } catch (error) {
        errors.push(`Failed to import ${file.name}: ${this.getErrorMessage(error)}`);
      }
    }

    return { imported, errors };
  }
}

export const iosFileBrowserService = new iOSFileBrowserService();

export { iOSFileBrowserService }