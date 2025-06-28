import * as FileSystem from 'expo-file-system';

export class VideoService {
  private static videoDirectory = `${FileSystem.documentDirectory}videos/`;

  static async createVideoDirectory(): Promise<string> {
    const dirInfo = await FileSystem.getInfoAsync(this.videoDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.videoDirectory, { intermediates: true });
    }
    return this.videoDirectory;
  }

  static async moveVideoToPersistentStorage(tempUri: string): Promise<string> {
    try {
      const videoDir = await this.createVideoDirectory();
      const fileExtension = tempUri.split('.').pop() || 'mp4';
      const fileName = `video_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const persistentUri = `${videoDir}${fileName}`;
      
      await FileSystem.copyAsync({
        from: tempUri,
        to: persistentUri
      });
      
      return persistentUri;
    } catch (error) {
      console.error('Failed to move video to persistent storage:', error);
      throw error;
    }
  }

  static async deleteVideo(videoUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(videoUri);
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
      throw error;
    }
  }

  static async getVideoInfo(videoUri: string) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      return fileInfo;
    } catch (error) {
      console.error('Failed to get video info:', error);
      return null;
    }
  }

  static async getAllVideos(): Promise<string[]> {
    try {
      const videoDir = await this.createVideoDirectory();
      const files = await FileSystem.readDirectoryAsync(videoDir);
      return files
        .filter(file => file.toLowerCase().endsWith('.mp4') || file.toLowerCase().endsWith('.mov'))
        .map(file => `${videoDir}${file}`);
    } catch (error) {
      console.error('Failed to get all videos:', error);
      return [];
    }
  }

  static formatFileSize(sizeInBytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (sizeInBytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    return Math.round(sizeInBytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  static generateThumbnailPath(videoUri: string): string {
    const videoDir = this.videoDirectory;
    const fileName = videoUri.split('/').pop()?.replace(/\.[^/.]+$/, '_thumb.jpg') || 'thumb.jpg';
    return `${videoDir}${fileName}`;
  }
} 