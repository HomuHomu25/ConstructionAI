/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { FIREBASE_APP, FIREBASE_AUTH } from './src/config/FirebaseConfig';

// Add debug logs for Firebase initialization
console.log('Firebase App initialization status:', FIREBASE_APP);
console.log('Firebase Auth initialization status:', FIREBASE_AUTH);
console.log('Firebase Auth methods:', Object.keys(FIREBASE_AUTH || {}));

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
