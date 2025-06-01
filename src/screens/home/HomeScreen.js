import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const HomeScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get user's display name or email
  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';

  // TODO: Replace with actual API call
  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      // Simulated API call
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch('your-api-endpoint/weather');
      // const data = await response.json();
      
      // Simulated data
      const mockData = {
        temperature: 28,
        humidity: 65,
        condition: 'Sunny',
        icon: '☀️'
      };
      
      setWeather(mockData);
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchWeatherData().finally(() => setRefreshing(false));
  }, []);

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.profileContainer}
        onPress={() => navigation.navigate('Profile')}
      >
        <Image
          source={require('../../assets/images/WorkerProfile.jpg')}
          style={styles.profileImage}
        />
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
            Welcome Back!
          </Text>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {userName}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.notificationButton}
        onPress={() => {/* TODO: Handle notifications */}}
      >
        <Text style={styles.notificationIcon}>🔔</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Header />

      <View style={[styles.weatherCard, { backgroundColor: theme.colors.primary }]}>
        {weather && (
          <>
            <View style={styles.weatherHeader}>
              <Text style={styles.weatherIcon}>{weather.icon}</Text>
              <Text style={styles.temperature}>{weather.temperature}°C</Text>
            </View>
            
            <View style={styles.weatherDetails}>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherLabel}>Humidity</Text>
                <Text style={styles.weatherValue}>{weather.humidity}%</Text>
              </View>
              
              <View style={styles.weatherItem}>
                <Text style={styles.weatherLabel}>Condition</Text>
                <Text style={styles.weatherValue}>{weather.condition}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* TODO: Add more content sections here */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  welcomeContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    opacity: 0.7,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 24,
  },
  weatherCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  weatherItem: {
    alignItems: 'center',
    marginVertical: 4,
    flex: 1,
  },
  weatherLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 4,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default HomeScreen; 