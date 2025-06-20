import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key' &&
  supabaseUrl !== 'https://placeholder.supabase.co';

// Platform-specific storage adapter
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Use AsyncStorage for web platform
    return {
      getItem: async (key: string): Promise<string | null> => {
        try {
          return await AsyncStorage.getItem(key);
        } catch (error) {
          console.error('Error getting item from AsyncStorage:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string): Promise<void> => {
        try {
          await AsyncStorage.setItem(key, value);
        } catch (error) {
          console.error('Error setting item in AsyncStorage:', error);
        }
      },
      removeItem: async (key: string): Promise<void> => {
        try {
          await AsyncStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing item from AsyncStorage:', error);
        }
      },
    };
  } else {
    // Use SecureStore for native platforms
    return {
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
    };
  }
};

// Create Supabase client only if we have valid credentials
const supabase = hasValidCredentials ? createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
  },
}) : null;

class AuthService {
  async signUp(email: string, password: string) {
    if (!hasValidCredentials || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

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
    if (!hasValidCredentials || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

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
    if (!hasValidCredentials || !supabase) {
      // If no valid credentials, just return as user is not authenticated anyway
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    // If no valid credentials, return null (not authenticated)
    if (!hasValidCredentials || !supabase) {
      return null;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        // Log the error but don't throw it, just return null for unauthenticated state
        console.warn('Unable to get current user:', error.message);
        return null;
      }
      return user;
    } catch (error) {
      console.warn('Get user error:', error);
      return null;
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!hasValidCredentials || !supabase) {
      // Return a dummy subscription that can be safely unsubscribed
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }

    return supabase.auth.onAuthStateChange(callback);
  }

  // Helper method to check if Supabase is properly configured
  isConfigured(): boolean {
    return hasValidCredentials;
  }
}

export const authService = new AuthService();