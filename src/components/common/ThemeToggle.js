import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ style }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={toggleTheme}
      accessibilityLabel="Toggle dark mode"
      accessibilityRole="switch"
      accessibilityState={{ selected: isDarkMode }}
    >
      <Icon
        name={isDarkMode ? 'moon' : 'sunny'}
        size={24}
        color={theme.colors.text}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
});

export default ThemeToggle; 