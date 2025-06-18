import { createClient } from '@supabase/supabase-js';
import { noteService } from './noteService';
import { authService } from './authService';
import { Note } from '@/types/note';

// Note: These would be your actual Supabase credentials
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class SyncService {
  async syncNow(): Promise<void> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get local notes
      const localNotes = await noteService.getAllNotes();
      
      // Get remote notes
      const { data: remoteNotes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Merge and sync logic would go here
      // This is a simplified version
      await this.uploadNotes(localNotes, user.id);
      
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  private async uploadNotes(notes: Note[], userId: string): Promise<void> {
    try {
      const notesToUpload = notes.map(note => ({
        ...note,
        user_id: userId,
      }));

      const { error } = await supabase
        .from('notes')
        .upsert(notesToUpload);

      if (error) throw error;
    } catch (error) {
      console.error('Upload notes failed:', error);
      throw error;
    }
  }

  async enableAutoSync(): Promise<void> {
    // Set up background sync
    // This would use Expo TaskManager for background tasks
  }

  async disableAutoSync(): Promise<void> {
    // Disable background sync
  }

  async getLastSyncTime(): Promise<Date | null> {
    try {
      // Get from AsyncStorage or Supabase
      return null; // Placeholder
    } catch (error) {
      console.error('Get last sync time failed:', error);
      return null;
    }
  }
}

export const syncService = new SyncService();