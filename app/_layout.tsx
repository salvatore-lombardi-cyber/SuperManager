import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { authManager } from './utils/auth';
import LoginScreen from './auth/login';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      await authManager.initAuth(); // Inizializza l'auth
      const authenticated = await authManager.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione per forzare il refresh dell'auth
  const refreshAuth = async () => {
    const authenticated = await authManager.isAuthenticated();
    setIsAuthenticated(authenticated);
  };

  if (isLoading) {
    return null; // Oppure un loading screen
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={refreshAuth} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}