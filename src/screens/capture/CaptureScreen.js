import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  PermissionsAndroid,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const TARGET_IMAGE_SIZE = 512; // Size for normalized images

// Separate Form Component with the working input solution
const EnvironmentalForm = React.memo(({ environmentalData, onUpdateData }) => {
  const { theme } = useTheme();
  const weatherOptions = ['Sunny', 'Cloudy', 'Rainy', 'Stormy'];
  const lightConditions = ['Daylight', 'Dawn/Dusk', 'Night', 'Artificial'];

  const renderInput = ({ label, value, key, keyboardType = 'default', suffix, multiline = false }) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            { 
              color: theme.colors.text,
              backgroundColor: theme.isDark ? '#1a1a1a' : '#f5f5f5',
              borderColor: theme.isDark ? '#333' : '#e0e0e0',
            },
          ]}
          value={value}
          onChangeText={(text) => onUpdateData(key, text)}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          autoCapitalize="sentences"
          autoCorrect={false}
          enablesReturnKeyAutomatically={true}
          returnKeyType={multiline ? 'default' : 'done'}
          placeholderTextColor={theme.isDark ? '#666' : '#999'}
        />
        {suffix && (
          <Text style={[styles.suffix, { color: theme.colors.text }]}>{suffix}</Text>
        )}
      </View>
    </View>
  );

  const renderSelectField = ({ label, value, options, key }) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{label}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              {
                backgroundColor: value === option ? theme.colors.primary : 'transparent',
                borderColor: value === option ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => onUpdateData(key, option)}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: value === option ? '#fff' : theme.colors.text,
                },
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.formSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Environmental Data
      </Text>
      {renderInput({
        label: 'Temperature',
        value: environmentalData.temperature,
        key: 'temperature',
        keyboardType: 'numeric',
        suffix: '°C'
      })}
      {renderInput({
        label: 'Humidity',
        value: environmentalData.humidity,
        key: 'humidity',
        keyboardType: 'numeric',
        suffix: '%'
      })}
      {renderSelectField({
        label: 'Weather Condition',
        value: environmentalData.weather,
        options: weatherOptions,
        key: 'weather'
      })}
      {renderSelectField({
        label: 'Light Condition',
        value: environmentalData.lightCondition,
        options: lightConditions,
        key: 'lightCondition'
      })}
      {renderInput({
        label: 'Additional Notes',
        value: environmentalData.notes,
        key: 'notes',
        multiline: true
      })}
    </View>
  );
});

const CaptureScreen = ({ navigation }) => {
  console.log("Render CaptureScreen");
  
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`CaptureScreen render count: ${renderCountRef.current}`);
    
    return () => {
      console.log("CaptureScreen unmounting");
    };
  });

  const { theme } = useTheme();
  const [imageData, setImageData] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState({
    temperature: '',
    humidity: '',
    weather: 'sunny',
    lightCondition: 'daylight',
    notes: '',
  });

  const handleUpdateData = (key, value) => {
    console.log(`Updating ${key}:`, value);
    setEnvironmentalData(prev => ({ ...prev, [key]: value }));
  };

  const handleCapture = async () => {
    // Dismiss keyboard before camera operations
    Keyboard.dismiss();
    const hasPermission = await requestCameraPermission();
    
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Please grant camera permission to take photos.');
      return;
    }

    try {
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: TARGET_IMAGE_SIZE,
        maxHeight: TARGET_IMAGE_SIZE,
        saveToPhotos: true,
        includeBase64: false,
        includeExtra: true,
      };

      const result = await launchCamera(options);
      
      if (result.didCancel) {
        console.log('User cancelled camera');
      } else if (result.errorCode) {
        console.error('Camera Error:', result.errorMessage);
        Alert.alert('Error', result.errorMessage || 'Failed to capture image');
      } else if (result.assets && result.assets[0]) {
        const capturedImage = result.assets[0];
        console.log('Captured image:', capturedImage);
        await processImage(capturedImage);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const handleChooseFromLibrary = async () => {
    // Dismiss keyboard before library operations
    Keyboard.dismiss();
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: TARGET_IMAGE_SIZE,
        maxHeight: TARGET_IMAGE_SIZE,
        includeBase64: false,
        includeExtra: true,
        selectionLimit: 1,
      };

      const result = await launchImageLibrary(options);
      
      if (result.didCancel) {
        console.log('User cancelled image selection');
      } else if (result.errorCode) {
        console.error('ImagePicker Error:', result.errorMessage);
        Alert.alert('Error', result.errorMessage || 'Failed to select image');
      } else if (result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('Selected image:', selectedImage);
        await processImage(selectedImage);
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const processImage = async (originalImage) => {
    try {
      // Calculate target dimensions while maintaining aspect ratio
      const { width, height } = originalImage;
      let targetWidth = TARGET_IMAGE_SIZE;
      let targetHeight = TARGET_IMAGE_SIZE;

      if (width > height) {
        targetHeight = Math.round((height / width) * TARGET_IMAGE_SIZE);
      } else {
        targetWidth = Math.round((width / height) * TARGET_IMAGE_SIZE);
      }

      setImageData({
        uri: originalImage.uri,
        width: targetWidth,
        height: targetHeight,
        type: 'image/jpeg',
        fileName: originalImage.fileName || 'normalized_image.jpg',
      });
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!imageData) {
        Alert.alert('Error', 'Please capture or select an image first.');
        return;
      }

      if (!environmentalData.temperature || !environmentalData.humidity) {
        Alert.alert('Error', 'Please fill in temperature and humidity data.');
        return;
      }

      // Validate temperature and humidity values
      const temp = parseFloat(environmentalData.temperature);
      const hum = parseFloat(environmentalData.humidity);

      if (isNaN(temp) || temp < -50 || temp > 60) {
        Alert.alert('Error', 'Please enter a valid temperature between -50°C and 60°C.');
        return;
      }

      if (isNaN(hum) || hum < 0 || hum > 100) {
        Alert.alert('Error', 'Please enter a valid humidity between 0% and 100%.');
        return;
      }

      // Create the environmental data object for submission
      const environmentalDataObject = {
        temperature: temp,
        humidity: hum,
        weather: environmentalData.weather,
        lightCondition: environmentalData.lightCondition,
        notes: environmentalData.notes,
        timestamp: new Date().toISOString(),
      };

      Alert.alert(
        'Success',
        'Image captured and processed successfully! Backend integration pending.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear the form
              setImageData(null);
              setEnvironmentalData({
                temperature: '',
                humidity: '',
                weather: 'sunny',
                lightCondition: 'daylight',
                notes: '',
              });
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting data:', error);
      Alert.alert('Error', 'Failed to submit data. Please try again.');
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take pictures.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions through Info.plist
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        <View style={styles.imageSection}>
          {imageData ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageData.uri }}
                style={[styles.previewImage, { width: imageData.width, height: imageData.height }]}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setImageData(null);
                  setEnvironmentalData({
                    temperature: '',
                    humidity: '',
                    weather: 'sunny',
                    lightCondition: 'daylight',
                    notes: '',
                  });
                }}
              >
                <Text style={styles.removeImageText}>❌</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.placeholderImage,
                { backgroundColor: theme.isDark ? '#1a1a1a' : '#f5f5f5' },
              ]}
            >
              <Text style={[styles.placeholderText, { color: theme.colors.text }]}>
                No image selected
              </Text>
            </View>
          )}
          
          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={handleCapture}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{imageData ? '🔄' : '📸'}</Text>
              <Text style={styles.buttonText}>{imageData ? 'Retake Photo' : 'Take Photo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={handleChooseFromLibrary}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{imageData ? '🔄' : '🖼️'}</Text>
              <Text style={styles.buttonText}>{imageData ? 'Choose Different' : 'Choose Photo'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <EnvironmentalForm
          environmentalData={environmentalData}
          onUpdateData={handleUpdateData}
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmit}
        >
          <Text style={styles.emoji}>📤</Text>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Simplified styles
const basicStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 16,
  },
  form: {
    gap: 16,
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    backgroundColor: 'white',
  },
  suffix: {
    marginLeft: 8,
    fontSize: 16,
  },
});

// Keep the original styles object for other components
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    borderRadius: 12,
    marginBottom: 16,
  },
  placeholderImage: {
    width: TARGET_IMAGE_SIZE,
    height: TARGET_IMAGE_SIZE,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    opacity: 0.7,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    paddingVertical: 8,
  },
  multilineInput: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  suffix: {
    marginLeft: 8,
    fontSize: 16,
    opacity: 0.7,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  removeImageText: {
    fontSize: 20,
  },
});

export default CaptureScreen; 