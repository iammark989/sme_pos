import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';

import {
  getAuthenticatedUser,
  login,
  logout,
  type AuthUser,
} from './src/services/authService';

export default function App() {
  // 1. Authentication state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 2. Session state
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthUser | null>(null);

  // 3. Restore the saved session when the app starts
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const user = await getAuthenticatedUser();

        if (isMounted) {
          setAuthenticatedUser(user);
        }
      } catch (error) {
        console.error('Session restoration failed:', error);

        if (isMounted) {
          setErrorMessage(
            'Unable to verify your session. Please check your connection.',
          );
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // 4. Handle login
  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setErrorMessage('Please enter your username and password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const response = await login(username.trim(), password);

      setAuthenticatedUser(response.user);
      setPassword('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setAuthenticatedUser(null);
      setPassword('');
      setErrorMessage('');
    }
  };

  // 6. Render the app
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        {isCheckingSession ? (
          // Session loading screen
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>
              Checking your session...
            </Text>
          </View>
        ) : authenticatedUser ? (
          // Authenticated dashboard
          <DashboardScreen
            user={authenticatedUser}
            onLogout={handleLogout}
          />
        ) : (
          // Login screen
          <LoginScreen
            username={username}
            password={password}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onLogin={handleLogin}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// 7. App-level styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F7FC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#374151',
    marginTop: 14,
  },
});