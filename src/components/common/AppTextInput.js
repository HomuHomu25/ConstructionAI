import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const AppTextInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  error,
  touched,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  ...props
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          error && touched && styles.errorInput,
          { 
            color: theme.colors.text,
            backgroundColor: theme.isDark ? '#1a1a1a' : '#fff',
            borderColor: error && touched ? '#ff3b30' : theme.isDark ? '#333' : '#ddd'
          }
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={theme.isDark ? '#666' : '#999'}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        enablesReturnKeyAutomatically={true}
        returnKeyType="done"
        {...props}
      />
      {error && touched && (
        <Text style={[styles.errorText, { color: '#ff3b30' }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  errorInput: {
    borderColor: '#ff3b30',
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
});

export default AppTextInput; 