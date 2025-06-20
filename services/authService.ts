import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import EncryptedStorage from 'react-native-encrypted-storage';
import 'react-native-url-polyfill/auto';

// Note: These would be your actual Supabase credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rvolhrslnmnwbrexlviq.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2b2xocnNsbm1ud2JyZXhsdmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMjc2MjEsImV4cCI6MjA2NTgwMzYyMX0.NocZMKN4AD09W7h6opSR0pF1G_CeCm3bpSScmZqDmOY';

// More reliable storage adapter that supports different naming conventions
const SecureStorageAdapter = {
  // Standard methods
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from SecureStore:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error setting item in SecureStore:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item from SecureStore:', error);
    }
  },

  // Fallback for Supabase's different naming patterns
  getValueWithKeyAsync: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error in getValueWithKeyAsync:', error);
      return null;
    }
  },
  setValueWithKeyAsync: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error in setValueWithKeyAsync:', error);
    }
  },
  deleteValueWithKeyAsync: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error in deleteValueWithKeyAsync:', error);
    }
  }
};

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
  },
});

class AuthService {
  async signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      // If using placeholder credentials, return null (not authenticated)
      if (supabaseUrl === 'https://placeholder.supabase.co') {
        return null;
      }
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();