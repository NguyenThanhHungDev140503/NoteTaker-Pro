import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';
import { storageLocationService } from './storageLocationService';
import { noteService } from './noteService';

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
  currentStoragePath?: string;
}

interface NotesDirectoryInfo {
  path: string;
  displayPath: string;
  noteCount: number;
  totalSize: string;
  accessibleViaFiles: boolean;
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
   * Get detailed information about current notes directory
   */
  async getCurrentNotesDirectoryInfo(): Promise<NotesDirectoryInfo> {
    try {
      const currentLocation = await storageLocationService.getCurrentStorageLocation();
      const notes = await noteService.getAllNotes();
      const notesString = JSON.stringify(notes);
      const sizeInBytes = new Blob([notesString]).size;
      
      // Create user-friendly display path
      const displayPath = this.createUserFriendlyPath(currentLocation);
      
      // Check if path is accessible via Files app
      const accessibleViaFiles = await this.isAccessibleViaFilesApp(currentLocation);

      return {
        path: currentLocation,
        displayPath,
        noteCount: notes.length,
        totalSize: this.formatBytes(sizeInBytes),
        accessibleViaFiles
      };
    } catch (error) {
      console.error('Error getting notes directory info:', error);
      return {
        path: FileSystem.documentDirectory || '',
        displayPath: 'Documents',
        noteCount: 0,
        totalSize: '0 B',
        accessibleViaFiles: true
      };
    }
  }

  /**
   * Create user-friendly path display
   */
  private createUserFriendlyPath(fullPath: string): string {
    if (!fullPath) return 'Documents';

    // Extract meaningful parts of the path
    if (fullPath.includes('Documents')) {
      const parts = fullPath.split('Documents');
      if (parts.length > 1) {
        const relativePath = parts[1].replace(/^\/+|\/+$/g, '');
        return relativePath ? `Documents/${relativePath}` : 'Documents';
      }
    }

    // Fallback to last few path components
    const pathComponents = fullPath.split('/').filter(Boolean);
    if (pathComponents.length > 2) {
      return `.../${pathComponents.slice(-2).join('/')}`;
    }

    return pathComponents.join('/') || 'Documents';
  }

  /**
   * Check if path is accessible via iOS Files app
   */
  private async isAccessibleViaFilesApp(path: string): Promise<boolean> {
    try {
      // Documents directory is always accessible via Files app
      if (path.includes('Documents')) return true;
      
      // Check if directory exists and is readable
      const info = await FileSystem.getInfoAsync(path);
      return info.exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Show detailed storage location information to user
   */
  async showCurrentStorageInfo(): Promise<void> {
    const info = await this.getCurrentNotesDirectoryInfo();
    
    const message = `Current Notes Storage Location:
📁 Path: ${info.displayPath}
📝 Notes: ${info.noteCount} files
💾 Size: ${info.totalSize}
📱 Files App: ${info.accessibleViaFiles ? 'Accessible' : 'Limited access'}

${info.accessibleViaFiles 
  ? 'To browse this location:\n1. Open Files app\n2. Navigate to "On My iPhone/iPad"\n3. Find your app in the list\n4. Go to Documents folder'
  : 'This location may not be directly accessible via Files app. Consider changing storage location to Documents for better Files app integration.'
}`;

    Alert.alert('Notes Storage Location', message, [
      { text: 'OK' },
      { 
        text: 'Browse Files', 
        onPress: () => this.openNotesDirectoryBrowser()
      }
    ]);
  }

  /**
   * Opens file browser attempting to navigate to notes directory
   * Enhanced with storage location context
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
      // Get current notes directory info
      const directoryInfo = await this.getCurrentNotesDirectoryInfo();
      
      // Show navigation hint to user before opening picker
      await this.showNavigationHint(directoryInfo);

      // Request file access permissions
      const hasPermission = await this.requestFileAccessPermissions();
      if (!hasPermission) {
        return {
          success: false,
          files: [],
          error: 'File access permissions denied',
          currentStoragePath: directoryInfo.displayPath
        };
      }

      // Configure document picker
      const pickerOptions = this.buildDocumentPickerOptions(options);
      
      // Open document picker
      const result = await DocumentPicker.getDocumentAsync(pickerOptions);
      
      if (result.canceled) {
        return {
          success: false,
          files: [],
          error: 'File selection cancelled by user',
          currentStoragePath: directoryInfo.displayPath
        };
      }

      // Process selected files
      const processedFiles = await this.processSelectedFiles(result.assets || []);
      
      return {
        success: true,
        files: processedFiles,
        currentStoragePath: directoryInfo.displayPath
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
   * Show navigation hint to help user find the correct directory
   */
  private async showNavigationHint(directoryInfo: NotesDirectoryInfo): Promise<void> {
    const isIOS16Plus = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 16;
    
    const navigationSteps = directoryInfo.accessibleViaFiles 
      ? [
          '1. In the file picker, tap "Browse"',
          '2. Look for "On My iPhone/iPad"',
          '3. Find your app in the list',
          '4. Navigate to Documents folder',
          `5. Your notes are in: ${directoryInfo.displayPath}`
        ]
      : [
          '1. Use the file picker to select note files',
          '2. Look for .json files for full note data',
          '3. Text files (.txt, .md) can also be imported',
          '⚠️ Current storage location may not be directly accessible'
        ];

    const message = `📁 Current storage: ${directoryInfo.displayPath}
📝 ${directoryInfo.noteCount} notes (${directoryInfo.totalSize})

Navigation steps:
${navigationSteps.join('\n')}

${isIOS16Plus ? '\n✨ iOS 16+ Enhanced Features Available' : ''}`;

    return new Promise((resolve) => {
      Alert.alert(
        'Navigate to Your Notes',
        message,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
          { text: 'Open File Picker', onPress: () => resolve() }
        ]
      );
    });
  }

  /**
   * Request file access permissions for iOS
   */
  private async requestFileAccessPermissions(): Promise<boolean> {
    try {
      // Test access by attempting to read the current storage directory
      const currentLocation = await storageLocationService.getCurrentStorageLocation();
      const dirInfo = await FileSystem.getInfoAsync(currentLocation);
      
      if (!dirInfo.exists) {
        // Try to create the directory if it doesn't exist
        await FileSystem.makeDirectoryAsync(currentLocation, { intermediates: true });
      }
      
      return true;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Build document picker options optimized for notes
   */
  private buildDocumentPickerOptions(
    userOptions: Partial<iOSFileBrowserOptions>
  ): DocumentPicker.DocumentPickerOptions {
    return {
      type: userOptions.allowedFileTypes || this.SUPPORTED_NOTE_FORMATS,
      multiple: userOptions.allowMultiple !== false, // Default to multiple selection
      copyToCacheDirectory: false, // Keep original file location
    };
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
   * List files in current notes directory
   */
  async listNotesInCurrentDirectory(): Promise<Array<{
    name: string;
    path: string;
    size: number;
    isNote: boolean;
  }>> {
    try {
      const currentLocation = await storageLocationService.getCurrentStorageLocation();
      const files = await FileSystem.readDirectoryAsync(currentLocation);
      
      const fileList = [];
      
      for (const fileName of files) {
        try {
          const filePath = `${currentLocation}/${fileName}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (!fileInfo.isDirectory) {
            fileList.push({
              name: fileName,
              path: filePath,
              size: fileInfo.size || 0,
              isNote: this.isNoteFile(fileName)
            });
          }
        } catch (error) {
          console.warn(`Error getting info for file ${fileName}:`, error);
        }
      }
      
      return fileList;
    } catch (error) {
      console.error('Error listing files in notes directory:', error);
      return [];
    }
  }

  /**
   * Check if filename indicates a note file
   */
  private isNoteFile(fileName: string): boolean {
    const extension = fileName.toLowerCase().split('.').pop();
    if (!extension) return false;
    
    const noteExtensions = ['json', 'txt', 'md', 'note'];
    return noteExtensions.includes(extension);
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
   * Format bytes into human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
   * Enhanced browse notes directory with better UX
   */
  async browseNotesDirectoryEnhanced(): Promise<FileBrowserResult> {
    const isIOS16Plus = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 16;
    
    // Show current storage info first
    const directoryInfo = await this.getCurrentNotesDirectoryInfo();
    
    const options: Partial<iOSFileBrowserOptions> = {
      allowedFileTypes: this.SUPPORTED_NOTE_FORMATS,
      allowMultiple: true,
      presentationStyle: isIOS16Plus ? 'pageSheet' : 'automatic'
    };

    const result = await this.openNotesDirectoryBrowser(options);
    
    if (!result.success && result.error?.includes('permissions')) {
      // Show helpful error message for permission issues
      Alert.alert(
        'File Access Required',
        `To browse your notes directory (${directoryInfo.displayPath}), please:\n\n1. Grant file access when prompted\n2. Navigate to the correct folder in Files app\n3. Select your note files\n\nYour notes are currently stored in: ${directoryInfo.displayPath}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Show Location Info', onPress: () => this.showCurrentStorageInfo() },
          { text: 'Retry', onPress: () => this.browseNotesDirectoryEnhanced() }
        ]
      );
    }

    return result;
  }

  /**
   * Create directory listing for current notes storage
   */
  async createCurrentDirectoryListing(): Promise<string> {
    try {
      const directoryInfo = await this.getCurrentNotesDirectoryInfo();
      const fileList = await this.listNotesInCurrentDirectory();
      
      let listing = `📁 Notes Directory: ${directoryInfo.displayPath}\n`;
      listing += `📊 Total: ${directoryInfo.noteCount} notes (${directoryInfo.totalSize})\n\n`;
      
      if (fileList.length === 0) {
        listing += '📝 No files found in this directory\n';
      } else {
        listing += '📄 Files in directory:\n';
        fileList.forEach((file, index) => {
          const icon = file.isNote ? '📝' : '📄';
          const sizeStr = this.formatBytes(file.size);
          listing += `${index + 1}. ${icon} ${file.name} (${sizeStr})\n`;
        });
      }
      
      listing += `\n💡 To access via Files app:\n`;
      listing += `• Open Files app → Browse → On My iPhone/iPad\n`;
      listing += `• Find your app → Documents\n`;
      listing += `• Navigate to: ${directoryInfo.displayPath}`;
      
      return listing;
    } catch (error) {
      return `Error creating directory listing: ${this.getErrorMessage(error)}`;
    }
  }

  /**
   * Import notes from selected files with progress tracking
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
        
        if (file.name.endsWith('.json')) {
          // Try to parse as note data
          try {
            const noteData = JSON.parse(content);
            
            // Validate note structure
            if (this.isValidNoteData(noteData)) {
              // Import single note
              await noteService.createNote(noteData);
              imported++;
            } else if (Array.isArray(noteData)) {
              // Import multiple notes
              for (const note of noteData) {
                if (this.isValidNoteData(note)) {
                  await noteService.createNote(note);
                  imported++;
                }
              }
            } else {
              errors.push(`${file.name}: Invalid note format`);
            }
          } catch (parseError) {
            errors.push(`${file.name}: Failed to parse JSON`);
          }
        } else {
          // Handle text files by creating new notes
          const newNote = {
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            content: content,
            images: [],
            audioRecordings: [],
            isFavorite: false,
            tags: []
          };
          
          await noteService.createNote(newNote);
          imported++;
        }
      } catch (error) {
        errors.push(`${file.name}: ${this.getErrorMessage(error)}`);
      }
    }

    return { imported, errors };
  }

  /**
   * Validate note data structure
   */
  private isValidNoteData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.title === 'string' &&
      typeof data.content === 'string' &&
      Array.isArray(data.images) &&
      Array.isArray(data.audioRecordings) &&
      Array.isArray(data.tags) &&
      typeof data.isFavorite === 'boolean'
    );
  }
}

export const iosFileBrowserService = new iOSFileBrowserService();