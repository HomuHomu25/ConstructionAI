import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const CameraScreen = () => {
  const { theme } = useTheme();
  const [hasPermission, setHasPermission] = useState(null);

  // TODO: Implement camera functionality
  const takePicture = async () => {
    Alert.alert('Coming Soon', 'Camera functionality will be implemented in the next update');
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          No access to camera
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.cameraPlaceholder}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Camera Preview
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.captureButton, { backgroundColor: theme.colors.primary }]}
        onPress={takePicture}
      >
        <Text style={styles.captureButtonText}>Take Photo</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
  captureButton: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraScreen; 