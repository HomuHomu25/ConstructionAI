import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [userData, setUserData] = useState({
    name: user?.displayName || user?.email?.split('@')[0] || 'User',
    role: 'Construction Worker',
    projectName: 'UOWCHK Sport Center Development Project',
    email: user?.email || '',
    phone: '+1234567890',
    profileImage: user?.photoURL || null,
  });

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', {
      userData,
      onSave: (updatedData) => {
        setUserData(prev => ({
          ...prev,
          ...updatedData
        }));
      },
    });
  };

  const ProfileSection = ({ title, children }) => (
    <View
      style={[
        styles.section,
        {
          backgroundColor: theme.colors.card,
          shadowColor: theme.isDark ? '#000' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.isDark ? 0.25 : 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            source={
              userData.profileImage
                ? { uri: userData.profileImage }
                : require('../../assets/images/WorkerProfile.jpg')
            }
            style={styles.profileImage}
          />
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {userData.name}
        </Text>
        <Text style={[styles.role, { color: theme.colors.text }]}>
          {userData.role}
        </Text>
      </View>

      <ProfileSection title="Project Information">
        <View style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <Text style={styles.emoji}>🏢</Text>
            <Text style={[styles.projectName, { color: theme.colors.text }]}>
              {userData.projectName}
            </Text>
          </View>
          <View style={styles.projectDetails}>
            <View style={styles.projectDetail}>
              <Text style={styles.emoji}>👷</Text>
              <Text style={[styles.detailText, { color: theme.colors.text }]}>
                {userData.role}
              </Text>
            </View>
          </View>
        </View>
      </ProfileSection>

      <ProfileSection title="Contact Information">
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Text style={styles.emoji}>📧</Text>
            <Text style={[styles.contactText, { color: theme.colors.text }]}>
              {userData.email}
            </Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.emoji}>📱</Text>
            <Text style={[styles.contactText, { color: theme.colors.text }]}>
              {userData.phone}
            </Text>
          </View>
        </View>
      </ProfileSection>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleEditProfile}
        >
          <Text style={styles.emoji}>✏️</Text>
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    marginBottom: 16,
    borderRadius: 75,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  projectCard: {
    padding: 8,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  projectDetails: {
    marginLeft: 36,
  },
  projectDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  detailText: {
    fontSize: 15,
    opacity: 0.7,
  },
  contactInfo: {
    padding: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 