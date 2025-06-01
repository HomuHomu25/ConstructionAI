import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const TARGET_IMAGE_SIZE = 512; // Size for normalized images

// Helper function to upload image to Firebase Storage
const uploadImageToFirebase = async (uri, path) => {
  try {
    // Generate a unique filename using timestamp
    const timestamp = new Date().getTime();
    const filename = `${timestamp}_${uri.split('/').pop()}`;
    const storageRef = storage().ref(`${path}/${filename}`);

    // Upload the file
    await storageRef.putFile(uri);

    // Get the public download URL
    const downloadUrl = await storageRef.getDownloadURL();
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

const ReportForm = React.memo(({ reportData, onUpdateData, sites, currentUser }) => {
  const { theme } = useTheme();
  const [showSiteModal, setShowSiteModal] = useState(false);

  const renderInput = ({ label, value, key, keyboardType = 'default', multiline = false }) => (
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
      </View>
    </View>
  );

  const renderSiteDropdown = () => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Site</Text>
      <TouchableOpacity
        style={[styles.dropdownButton, { 
          backgroundColor: theme.isDark ? '#1a1a1a' : '#f5f5f5',
          borderColor: theme.isDark ? '#333' : '#e0e0e0',
        }]}
        onPress={() => setShowSiteModal(true)}
      >
        <Text style={[styles.dropdownButtonText, { color: theme.colors.text }]}>
          {sites.find(site => site.id === reportData.site)?.name || 'Select a site...'}
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showSiteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSiteModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSiteModal(false)}
        >
          <View style={[styles.modalContent, {
            backgroundColor: theme.isDark ? '#1a1a1a' : '#fff',
          }]}>
            <ScrollView>
              {sites.map((site) => (
                <TouchableOpacity
                  key={site.id}
                  style={[styles.siteOption, {
                    backgroundColor: reportData.site === site.id 
                      ? theme.colors.primary 
                      : 'transparent'
                  }]}
                  onPress={() => {
                    onUpdateData('site', site.id);
                    setShowSiteModal(false);
                  }}
                >
                  <Text style={[styles.siteOptionText, {
                    color: reportData.site === site.id 
                      ? '#fff' 
                      : theme.colors.text
                  }]}>
                    {site.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const renderWorkerInfo = () => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Worker</Text>
      <View style={[styles.workerInfo, { 
        backgroundColor: theme.isDark ? '#1a1a1a' : '#f5f5f5',
        borderColor: theme.isDark ? '#333' : '#e0e0e0',
      }]}>
        <Text style={[styles.workerName, { color: theme.colors.text }]}>
          {currentUser?.displayName || currentUser?.email || 'Unknown Worker'}
        </Text>
      </View>
    </View>
  );

  const weatherOptions = ['Sunny', 'Cloudy', 'Rainy', 'Stormy'];

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
        Report Details
      </Text>
      {renderInput({
        label: 'Title',
        value: reportData.title,
        key: 'title'
      })}
      {renderWorkerInfo()}
      {renderSiteDropdown()}
      {renderSelectField({
        label: 'Weather',
        value: reportData.weather,
        options: weatherOptions,
        key: 'weather'
      })}
      {renderInput({
        label: 'Description',
        value: reportData.description,
        key: 'description',
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [sites, setSites] = useState([]);
  const [reportData, setReportData] = useState({
    title: '',
    site: '',
    timestamp: new Date().toISOString(),
    worker: user?.displayName || user?.email || '',
    weather: 'Sunny',
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const sitesSnapshot = await firestore().collection('sites').get();
      const sitesData = sitesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSites(sitesData);
    } catch (error) {
      console.error('Error fetching sites:', error);
      Alert.alert('Error', 'Failed to load sites. Please try again.');
    }
  };

  const handleUpdateData = (key, value) => {
    setReportData(prev => ({
      ...prev,
      [key]: value
    }));
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

      if (!reportData.title || !reportData.site) {
        Alert.alert('Error', 'Please fill in all required fields.');
        return;
      }

      setLoading(true);

      // Upload image to Firebase Storage
      const imageUrl = await uploadImageToFirebase(imageData.uri, 'reports');

      // Find the selected site details
      const selectedSite = sites.find(site => site.id === reportData.site);
      if (!selectedSite) {
        throw new Error('Selected site not found');
      }

      // Create the report data object for Firestore
      const reportDataObject = {
        title: reportData.title,
        site: selectedSite.name, // Use site name instead of ID
        siteLocation: selectedSite.location, // Add site location
        timestamp: new Date().toISOString(),
        worker: user?.displayName || user?.email || '',
        weather: reportData.weather,
        description: reportData.description || '',
        imageUrl: imageUrl
      };

      // Save to Firestore
      await firestore()
        .collection('reports')
        .doc() // Let Firestore auto-generate the ID
        .set(reportDataObject);

      Alert.alert(
        'Success',
        'Report submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear the form
              setImageData(null);
              setReportData({
                title: '',
                site: '',
                timestamp: new Date().toISOString(),
                worker: user?.displayName || user?.email || '',
                weather: 'Sunny',
                description: '',
                imageUrl: ''
              });
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
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
                  setReportData({
                    title: '',
                    site: '',
                    timestamp: new Date().toISOString(),
                    worker: user?.displayName || user?.email || '',
                    weather: 'Sunny',
                    description: '',
                    imageUrl: ''
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

        <ReportForm
          reportData={reportData}
          onUpdateData={handleUpdateData}
          sites={sites}
          currentUser={user}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: theme.colors.primary },
            loading && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.emoji}>📤</Text>
              <Text style={styles.buttonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

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
    marginTop: 24,
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
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: '100%',
  },
  workerInfo: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  workerName: {
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
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
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  dropdownIcon: {
    fontSize: 12,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    maxHeight: 300,
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
  siteOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  siteOptionText: {
    fontSize: 16,
  },
});

export default CaptureScreen; 