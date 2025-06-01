import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';

const ThemeContext = createContext();

const THEME_PREFERENCE_KEY = '@theme_preference';
const THEME_MODE_KEY = '@theme_mode';

export const ThemeMode = {
  AUTOMATIC: 'automatic',
  LIGHT: 'light',
  DARK: 'dark',
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(ThemeMode.AUTOMATIC);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preferences
  useEffect(() => {
    loadThemePreferences();
  }, []);

  // Update theme when system theme or mode changes
  useEffect(() => {
    updateTheme();
  }, [systemColorScheme, themeMode]);

  const loadThemePreferences = async () => {
    try {
      const [savedMode, savedTheme] = await Promise.all([
        AsyncStorage.getItem(THEME_MODE_KEY),
        AsyncStorage.getItem(THEME_PREFERENCE_KEY),
      ]);

      if (savedMode) {
        setThemeMode(savedMode);
      }
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = () => {
    if (themeMode === ThemeMode.AUTOMATIC) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  };

  const setThemePreference = async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
      setThemeMode(mode);

      if (mode === ThemeMode.LIGHT) {
        setIsDarkMode(false);
        await AsyncStorage.setItem(THEME_PREFERENCE_KEY, 'light');
      } else if (mode === ThemeMode.DARK) {
        setIsDarkMode(true);
        await AsyncStorage.setItem(THEME_PREFERENCE_KEY, 'dark');
      } else {
        // Automatic mode - use system preference
        setIsDarkMode(systemColorScheme === 'dark');
        await AsyncStorage.setItem(THEME_PREFERENCE_KEY, systemColorScheme);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = {
    isDark: isDarkMode,
    colors: {
      background: isDarkMode ? colors.background.dark : colors.background.light,
      text: isDarkMode ? colors.text.dark : colors.text.light,
      primary: isDarkMode ? colors.primaryDark : colors.primary,
      secondary: isDarkMode ? colors.secondaryDark : colors.secondary,
      border: isDarkMode ? colors.border.dark : colors.border.light,
      error: isDarkMode ? colors.error.dark : colors.error.light,
      success: isDarkMode ? colors.success.dark : colors.success.light,
      warning: isDarkMode ? colors.warning.dark : colors.warning.light,
      card: isDarkMode ? '#1C1C1E' : colors.white,
      input: {
        background: isDarkMode ? colors.input.background.dark : colors.input.background.light,
        border: isDarkMode ? colors.input.border.dark : colors.input.border.light,
        placeholder: isDarkMode ? colors.input.placeholder.dark : colors.input.placeholder.light,
      },
      tabBar: {
        active: colors.tabBar.active,
        inactive: isDarkMode ? '#8E8E93' : '#8E8E93',
        background: isDarkMode ? colors.tabBar.background.dark : colors.tabBar.background.light,
      },
    },
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, themeMode, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 