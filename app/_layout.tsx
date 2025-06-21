import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { authService } from '@/services/authService';

export default function RootLayout() {
  useFrameworkReady();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    const configured = authService.isConfigured();
    setIsSupabaseConfigured(configured);

    if (!configured) {
      // If Supabase is not configured, set as not authenticated
      setIsAuthenticated(false);
      return;
    }

    // Check initial auth state
    const checkAuthState = async () => {
      try {
        const user = await authService.getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.warn('Error checking auth state:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthState();

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading while checking auth state
  if (isAuthenticated === null) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 18, color: '#333' }}>Loading SuperNote...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  // Show configuration message if Supabase is not set up
  if (!isSupabaseConfigured) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>
            Supabase Configuration Required
          </Text>
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 }}>
            Please update your .env file with your Supabase project URL and anonymous key to continue.
          </Text>
          <Text style={{ fontSize: 14, color: '#999', textAlign: 'center', marginTop: 10 }}>
            You can find these values in your Supabase project settings under 'API'.
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="payment/success" options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}