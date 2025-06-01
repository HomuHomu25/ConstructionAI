import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeMode } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const SettingsScreen = () => {
  const { theme, themeMode, setThemePreference } = useTheme();
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  // Get display name or email
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const ThemeOption = ({ title, emoji, selected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.card,
          shadowColor: theme.isDark ? '#000' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.isDark ? 0.25 : 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.themeOptionContent}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text
          style={[
            styles.themeOptionText,
            { color: selected ? '#fff' : theme.colors.text },
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const SettingItem = ({ title, onPress, value, icon, emoji }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        {
          backgroundColor: theme.colors.card,
          shadowColor: theme.isDark ? '#000' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.isDark ? 0.25 : 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        {emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : (
          icon && (
            <MaterialIcons
              name={icon}
              size={24}
              color={theme.colors.text}
              style={styles.settingIcon}
            />
          )
        )}
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
      </View>
      {value && (
        <Text style={[styles.settingValue, { color: theme.colors.text }]}>
          {value}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Profile
        </Text>
        <TouchableOpacity
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.colors.card,
              shadowColor: theme.isDark ? '#000' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: theme.isDark ? 0.25 : 0.1,
              shadowRadius: 4,
              elevation: 3,
            },
          ]}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.profileInfo}>
            <Text style={styles.emoji}>👤</Text>
            <View style={styles.profileTextContainer}>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>
                {displayName}
              </Text>
              <Text style={[styles.profileRole, { color: theme.colors.text }]}>
                Construction Worker
              </Text>
            </View>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Appearance
        </Text>
        <View
          style={[
            styles.themeCard,
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
          <View style={styles.themeHeader}>
            <Text style={styles.emoji}>🎨</Text>
            <Text style={[styles.themeTitle, { color: theme.colors.text }]}>
              Theme
            </Text>
          </View>
          <View style={styles.themeOptions}>
            <ThemeOption
              title="Automatic"
              emoji="⚡"
              selected={themeMode === ThemeMode.AUTOMATIC}
              onPress={() => setThemePreference(ThemeMode.AUTOMATIC)}
            />
            <ThemeOption
              title="Light Mode"
              emoji="☀️"
              selected={themeMode === ThemeMode.LIGHT}
              onPress={() => setThemePreference(ThemeMode.LIGHT)}
            />
            <ThemeOption
              title="Dark Mode"
              emoji="🌙"
              selected={themeMode === ThemeMode.DARK}
              onPress={() => setThemePreference(ThemeMode.DARK)}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          About
        </Text>
        <SettingItem
          title="Version"
          emoji="ℹ️"
          value="1.0.0"
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: theme.isDark ? '#ff4444' : '#ff6b6b',
            },
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.emoji}>🚪</Text>
          <Text style={styles.logoutButtonText}>Logout</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileTextContainer: {
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileRole: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  themeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 20,
    marginRight: 12,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeOptions: {
    gap: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
    opacity: 0.7,
    flexShrink: 1,
    textAlign: 'right',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
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
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SettingsScreen; 