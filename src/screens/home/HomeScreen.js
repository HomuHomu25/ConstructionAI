import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';

// Replace with your OpenWeatherMap API key
const WEATHER_API_KEY = '069ce631acc103528ffaeecc551bb175';

const HomeScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  // Get user's display name or email
  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';

  const requestLocationPermission = async () => {
    console.log('Requesting location permission...');
    try {
      if (Platform.OS === 'ios') {
        console.log('iOS: Requesting location authorization');
        const granted = await Geolocation.requestAuthorization('whenInUse');
        console.log('iOS permission result:', granted);
        return granted === 'granted';
      }

      // For Android
      console.log('Android: Checking current permission status');
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (granted) {
        console.log('Permission already granted');
        return true;
      }

      console.log('Requesting Android permission');
      const permissionResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need your location to provide accurate weather information for your area.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      console.log('Android permission result:', permissionResult);
      return permissionResult === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting permission:', err);
      return false;
    }
  };

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      console.log('Getting current position...');
      Geolocation.getCurrentPosition(
        position => {
          try {
            console.log('Position received:', position);
            if (!position || !position.coords) {
              throw new Error('Invalid position data received');
            }
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setLocation(coords);
            resolve(coords);
          } catch (error) {
            console.error('Error processing position:', error);
            reject(error);
          }
        },
        error => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 10000,
          distanceFilter: 100,
        },
      );
    });
  };

  const fetchWeatherData = async (coords) => {
    try {
      const locationToUse = coords || location;
      
      if (!locationToUse || !locationToUse.latitude || !locationToUse.longitude) {
        console.log('Invalid location data:', locationToUse);
        throw new Error('Invalid location data');
      }

      console.log('Fetching weather for:', locationToUse);
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${locationToUse.latitude}&lon=${locationToUse.longitude}&appid=${WEATHER_API_KEY}&units=metric`
        );
        
        if (!response || !response.data) {
          throw new Error('Invalid response from weather API');
        }
        
        console.log('Weather response:', response.data);
        
        const weatherData = {
          temperature: response.data.main ? Math.round(response.data.main.temp) : '--',
          humidity: response.data.main ? response.data.main.humidity : '--',
          condition: response.data.weather?.[0]?.main || 'Unknown',
          description: response.data.weather?.[0]?.description || 'Weather information unavailable',
          icon: response.data.weather?.[0]?.icon ? getWeatherIcon(response.data.weather[0].icon) : '❓',
          timestamp: new Date().toLocaleTimeString(),
        };
        
        setWeather(weatherData);
      } catch (apiError) {
        console.error('API Error:', apiError.response?.data || apiError.message);
        
        // Handle API key not activated case
        if (apiError.response?.data?.message?.includes('Invalid API key')) {
          const tempWeatherData = {
            temperature: '--',
            humidity: '--',
            condition: 'Pending',
            description: 'API key activation pending (2-3 hours)',
            icon: '⏳',
            timestamp: new Date().toLocaleTimeString(),
          };
          setWeather(tempWeatherData);
          console.log('Using temporary weather data while API key activates');
        } else {
          // Handle other API errors
          const errorWeatherData = {
            temperature: '--',
            humidity: '--',
            condition: 'Error',
            description: 'Unable to fetch weather data',
            icon: '⚠️',
            timestamp: new Date().toLocaleTimeString(),
          };
          setWeather(errorWeatherData);
          
          Alert.alert(
            'Weather Update Failed',
            'Unable to fetch weather data. Please try again later.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error in fetchWeatherData:', error);
      // Set error state in weather
      const errorWeatherData = {
        temperature: '--',
        humidity: '--',
        condition: 'Error',
        description: 'Something went wrong',
        icon: '⚠️',
        timestamp: new Date().toLocaleTimeString(),
      };
      setWeather(errorWeatherData);
      
      Alert.alert(
        'Error',
        'Failed to fetch weather data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefreshWeather = async () => {
    try {
      setLoading(true);
      console.log('Starting weather refresh...');
      
      // Check and request permission if needed
      const hasPermission = await requestLocationPermission();
      console.log('Permission check result:', hasPermission);

      if (!hasPermission) {
        console.log('Permission not granted, showing alert');
        Alert.alert(
          'Location Access Required',
          'Please enable location access in your device settings to get weather information for your current location.',
          [
            { text: 'Not Now', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: openAppSettings
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      // Get location and fetch weather
      console.log('Getting current location...');
      try {
        const coords = await getCurrentLocation();
        if (!coords) {
          throw new Error('No coordinates received');
        }
        console.log('Got coordinates:', coords);
        await fetchWeatherData(coords);
      } catch (locationError) {
        console.error('Error getting location:', locationError);
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please make sure location services are enabled in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings',
              onPress: openAppSettings
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error refreshing weather:', error);
      Alert.alert(
        'Error',
        'Unable to update weather information. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      '01d': '☀️',
      '01n': '🌙',
      '02d': '⛅',
      '02n': '☁️',
      '03d': '☁️',
      '03n': '☁️',
      '04d': '☁️',
      '04n': '☁️',
      '09d': '🌧️',
      '09n': '🌧️',
      '10d': '🌦️',
      '10n': '🌧️',
      '11d': '⛈️',
      '11n': '⛈️',
      '13d': '🌨️',
      '13n': '🌨️',
      '50d': '🌫️',
      '50n': '🌫️',
    };
    return iconMap[iconCode] || '☀️';
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Profile Section */}
      <View style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
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

      {/* Weather Card */}
      <View style={[styles.weatherCard, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.weatherHeader}>
          <View style={styles.weatherTitleContainer}>
            <Text style={styles.weatherTitle}>Weather</Text>
            {weather?.timestamp && (
              <Text style={styles.lastUpdated}>Last updated: {weather.timestamp}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefreshWeather}
            disabled={loading}
          >
            <Text style={styles.refreshIcon}>{loading ? '⏳' : '🔄'}</Text>
          </TouchableOpacity>
        </View>

        {weather ? (
          <>
            <View style={styles.weatherContent}>
              <Text style={styles.weatherIcon}>{weather.icon}</Text>
              <View style={styles.temperatureContainer}>
                <Text style={styles.temperature}>
                  {weather.temperature === '--' ? weather.temperature : `${weather.temperature}°C`}
                </Text>
                <Text style={[styles.weatherCondition, { color: '#fff' }]}>
                  {weather.description}
                </Text>
              </View>
            </View>
            
            <View style={styles.weatherDetails}>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherLabel}>Humidity</Text>
                <Text style={styles.weatherValue}>
                  {weather.humidity === '--' ? weather.humidity : `${weather.humidity}%`}
                </Text>
              </View>
              
              <View style={styles.weatherItem}>
                <Text style={styles.weatherLabel}>Condition</Text>
                <Text style={styles.weatherValue}>{weather.condition}</Text>
              </View>
            </View>
          </>
        ) : (
          <TouchableOpacity 
            style={styles.getWeatherButton} 
            onPress={handleRefreshWeather}
            disabled={loading}
          >
            <Text style={styles.getWeatherText}>
              {loading ? 'Getting Weather...' : 'Get Weather Update'}
            </Text>
          </TouchableOpacity>
        )}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  // Profile Card Styles
  profileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontSize: 18,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  notificationIcon: {
    fontSize: 20,
  },
  // Weather Card Styles
  weatherCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherTitleContainer: {
    flex: 1,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 20,
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  temperatureContainer: {
    flex: 1,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  weatherCondition: {
    fontSize: 16,
    opacity: 0.9,
    textTransform: 'capitalize',
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
    textTransform: 'capitalize',
  },
  getWeatherButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  getWeatherText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen; 