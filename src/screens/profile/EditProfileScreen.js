import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';

// Separate Form Component for better organization
const ProfileForm = React.memo(({ formData, setFormData, password, setPassword }) => {
  const { theme } = useTheme();

  const renderInput = ({ label, value, onChangeText, secureTextEntry, keyboardType, emoji }) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{label}</Text>
      </View>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.text,
            backgroundColor: theme.isDark ? '#1a1a1a' : '#f5f5f5',
            borderColor: theme.isDark ? '#333' : '#e0e0e0',
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor={theme.isDark ? '#666' : '#999'}
        autoCorrect={false}
        autoCapitalize={label.toLowerCase().includes('email') ? 'none' : 'sentences'}
        enablesReturnKeyAutomatically={true}
        returnKeyType="done"
        blurOnSubmit={false}
      />
    </View>
  );

  return (
    <>
      <View style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          <Text style={styles.emoji}>👤</Text>
          Personal Information
        </Text>
        {renderInput({
          label: "Name",
          value: formData.name,
          onChangeText: (text) => setFormData(prev => ({ ...prev, name: text })),
          emoji: "👤"
        })}
        {renderInput({
          label: "Role",
          value: formData.role,
          onChangeText: (text) => setFormData(prev => ({ ...prev, role: text })),
          emoji: "👷"
        })}
        {renderInput({
          label: "Project Name",
          value: formData.projectName,
          onChangeText: (text) => setFormData(prev => ({ ...prev, projectName: text })),
          emoji: "🏢"
        })}
      </View>

      <View style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          <Text style={styles.emoji}>📱</Text>
          Contact Information
        </Text>
        {renderInput({
          label: "Email",
          value: formData.email,
          onChangeText: (text) => setFormData(prev => ({ ...prev, email: text })),
          keyboardType: "email-address",
          emoji: "📧"
        })}
        {renderInput({
          label: "Phone",
          value: formData.phone,
          onChangeText: (text) => setFormData(prev => ({ ...prev, phone: text })),
          keyboardType: "phone-pad",
          emoji: "📱"
        })}
      </View>

      <View style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          <Text style={styles.emoji}>🔒</Text>
          Change Password
        </Text>
        {renderInput({
          label: "Current Password",
          value: password.current,
          onChangeText: (text) => setPassword(prev => ({ ...prev, current: text })),
          secureTextEntry: true,
          emoji: "🔑"
        })}
        {renderInput({
          label: "New Password",
          value: password.new,
          onChangeText: (text) => setPassword(prev => ({ ...prev, new: text })),
          secureTextEntry: true,
          emoji: "🔑"
        })}
        {renderInput({
          label: "Confirm New Password",
          value: password.confirm,
          onChangeText: (text) => setPassword(prev => ({ ...prev, confirm: text })),
          secureTextEntry: true,
          emoji: "🔑"
        })}
      </View>
    </>
  );
});

const EditProfileScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { userData: initialUserData, onSave } = route.params;
  
  const [formData, setFormData] = useState({
    name: initialUserData.name,
    role: initialUserData.role,
    projectName: initialUserData.projectName,
    email: initialUserData.email,
    phone: initialUserData.phone,
    profileImage: initialUserData.profileImage,
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleImageEdit = () => {
    Keyboard.dismiss();
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handleChooseFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleTakePhoto = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 1,
        saveToPhotos: true,
      };

      const result = await launchCamera(options);

      if (!result.didCancel && result.assets?.[0]?.uri) {
        setFormData(prev => ({
          ...prev,
          profileImage: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 1,
      };

      const result = await launchImageLibrary(options);

      if (!result.didCancel && result.assets?.[0]?.uri) {
        setFormData(prev => ({
          ...prev,
          profileImage: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Validate form data
      if (!formData.name.trim()) {
        Alert.alert('Error', 'Name is required');
        return;
      }

      if (!formData.email.trim()) {
        Alert.alert('Error', 'Email is required');
        return;
      }

      // Validate password if being changed
      if (password.new || password.current || password.confirm) {
        if (!password.current) {
          Alert.alert('Error', 'Current password is required to change password');
          return;
        }
        if (password.new !== password.confirm) {
          Alert.alert('Error', 'New passwords do not match');
          return;
        }
        if (password.new.length < 6) {
          Alert.alert('Error', 'New password must be at least 6 characters');
          return;
        }
      }

      // Update display name
      if (formData.name !== initialUserData.name) {
        await user.updateProfile({
          displayName: formData.name,
        });
      }

      // Update email
      if (formData.email !== initialUserData.email) {
        await user.updateEmail(formData.email);
      }

      // Update password if provided
      if (password.new && password.current) {
        // Reauthenticate first
        const credential = auth.EmailAuthProvider.credential(
          user.email,
          password.current
        );
        await user.reauthenticateWithCredential(credential);
        
        // Then update password
        await user.updatePassword(password.new);
      }

      // Save other profile data
      onSave(formData);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          <View style={styles.imageSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={
                  formData.profileImage
                    ? { uri: formData.profileImage }
                    : require('../../assets/images/WorkerProfile.jpg')
                }
                style={styles.profileImage}
              />
            </View>
            <TouchableOpacity
              style={[styles.changePhotoButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleImageEdit}
            >
              <Text style={styles.emoji}>📸</Text>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <ProfileForm
            formData={formData}
            setFormData={setFormData}
            password={password}
            setPassword={setPassword}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.emoji}>💾</Text>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  profileImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
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
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    paddingVertical: 8,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EditProfileScreen; 