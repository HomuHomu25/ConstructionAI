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
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';

// Replace with your OpenWeatherMap API key
const WEATHER_API_KEY = '069ce631acc103528ffaeecc551bb175';

const fetchLocationName = async (coords) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${coords.latitude}&lon=${coords.longitude}&limit=1&appid=${WEATHER_API_KEY}`
    );

    if (!response?.data?.[0]) {
      throw new Error('Location data not found');
    }

    const location = response.data[0];
    return {
      city: location.name,
      state: location.state,
      country: location.country
    };
  } catch (error) {
    console.error('Geocoding Error:', error);
    throw new Error('Failed to fetch location name');
  }
};

const HomeScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  // Add gradient colors based on theme
  const gradientColors = isDarkMode 
    ? ['#1a4b99', '#0d3d8f', '#002984'] // Darker blue shades for dark mode
    : ['#4a90e2', '#357abd', '#2171b5']; // Light blue shades for light mode

  // Get user's display name or email
  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        return auth === 'granted';
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need your location to provide accurate weather information.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting location permission:', err);
      return false;
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!Geolocation.getCurrentPosition) {
        reject(new Error('Geolocation is not available'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Location request timed out'));
      }, 15000);

      try {
        Geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            if (!position?.coords) {
              reject(new Error('Invalid position data'));
              return;
            }
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            clearTimeout(timeoutId);
            reject(new Error(error.message || 'Failed to get location'));
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      } catch (error) {
        clearTimeout(timeoutId);
        reject(new Error('Failed to get location'));
      }
    });
  };

  const fetchWeatherData = async (coords) => {
    if (!coords?.latitude || !coords?.longitude) {
      throw new Error('Invalid coordinates');
    }

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${coords.latitude}&lon=${coords.longitude}&appid=${WEATHER_API_KEY}&units=metric&exclude=minutely,alerts`
      );

      if (!response?.data?.current) {
        throw new Error('Invalid weather data received');
      }

      const current = response.data.current;
      const hourly = response.data.hourly;
      const daily = response.data.daily;
      
      // Get min and max temperature from hourly forecast
      const next24Hours = hourly.slice(0, 24);
      const minTemp = Math.round(Math.min(...next24Hours.map(h => h.temp)));
      const maxTemp = Math.round(Math.max(...next24Hours.map(h => h.temp)));

      // Process hourly data
      const hourlyForecast = next24Hours.map(hour => ({
        time: new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp: Math.round(hour.temp),
        humidity: hour.humidity,
        condition: hour.weather[0].main,
        icon: getWeatherIcon(hour.weather[0].icon),
      }));

      // Process daily data - exclude today
      const dailyForecast = daily.slice(1).map(day => ({
        date: new Date(day.dt * 1000),
        minTemp: Math.round(day.temp.min),
        maxTemp: Math.round(day.temp.max),
        humidity: day.humidity,
        condition: day.weather[0].main,
        icon: getWeatherIcon(day.weather[0].icon),
      }));

      return {
        temperature: Math.round(current.temp * 10) / 10,
        feelsLike: Math.round(current.feels_like),
        humidity: current.humidity,
        windSpeed: Math.round(current.wind_speed * 3.6),
        condition: current.weather?.[0]?.main || 'Unknown',
        description: current.weather?.[0]?.description || 'Weather information unavailable',
        icon: current.weather?.[0]?.icon ? getWeatherIcon(current.weather[0].icon) : '❓',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        minTemp,
        maxTemp,
        uvi: Math.round(current.uvi),
        hourlyForecast,
        dailyForecast,
      };
    } catch (error) {
      console.error('Weather API Error:', error.response?.data || error);
      if (error.response?.status === 401) {
        throw new Error('Weather API subscription or key issue. Please check your subscription.');
      }
      throw new Error(
        error.response?.data?.message || 'Failed to fetch weather data'
      );
    }
  };

  const handleRefreshWeather = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const coords = await getCurrentLocation();
      if (!coords) {
        throw new Error('Could not get location');
      }

      // Fetch location name and weather data in parallel
      const [weatherData, locationData] = await Promise.all([
        fetchWeatherData(coords),
        fetchLocationName(coords)
      ]);

      if (!weatherData) {
        throw new Error('Could not get weather data');
      }

      setWeather(weatherData);
      setLocation(locationData);
    } catch (error) {
      console.error('Weather update failed:', error);
      setError(error.message);

      let errorMessage = 'Unable to update weather information.';
      if (error.message.includes('permission')) {
        errorMessage = 'Please enable location access in settings to get weather information.';
      } else if (error.message.includes('location')) {
        errorMessage = 'Could not get your location. Please check your device settings.';
      } else if (error.message.includes('subscription')) {
        errorMessage = 'There seems to be an issue with the weather service subscription. Please try again later.';
      } else if (error.message.includes('weather')) {
        errorMessage = 'Weather service is temporarily unavailable. Please try again later.';
      }

      Alert.alert(
        'Weather Update Failed',
        errorMessage,
        [
          { text: 'OK' },
          error.message.includes('permission') && {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ].filter(Boolean)
      );
    } finally {
      setLoading(false);
    }
  };

  // Load weather on component mount
  useEffect(() => {
    handleRefreshWeather().catch(console.error);
  }, []);

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

  const getUVIDescription = (uvi) => {
    if (uvi <= 2) return 'Low';
    if (uvi <= 5) return 'Moderate';
    if (uvi <= 7) return 'High';
    if (uvi <= 10) return 'Very High';
    return 'Extreme';
  };

  const HourlyForecastItem = ({ item }) => (
    <View style={styles.hourlyItem}>
      <Text style={styles.hourlyTime}>{item.time}</Text>
      <Text style={styles.hourlyIcon}>{item.icon}</Text>
      <Text style={styles.hourlyTemp}>{item.temp}°C</Text>
      <Text style={styles.hourlyHumidity}>{item.humidity}%</Text>
    </View>
  );

  const DailyForecastItem = ({ item }) => {
    const dayName = item.date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayMonth = item.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    return (
      <View style={styles.dailyItem}>
        <View style={styles.dailyDateContainer}>
          <Text style={styles.dailyDay}>{dayName}</Text>
          <Text style={styles.dailyDate}>{dayMonth}</Text>
        </View>
        <Text style={styles.dailyIcon}>{item.icon}</Text>
        <View style={styles.dailyTempContainer}>
          <Text style={styles.dailyTemp}>{item.minTemp} | {item.maxTemp}°C</Text>
          <Text style={styles.dailyHumidity}>{item.humidity}%</Text>
        </View>
      </View>
    );
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
      <LinearGradient
        colors={gradientColors}
        style={styles.weatherCard}
      >
        <View style={styles.weatherHeader}>
          <View style={styles.weatherTitleContainer}>
            <Text style={styles.weatherTitle}>Today's Weather</Text>
            <Text style={styles.updateTime}>
              Update at {weather?.timestamp || '--:--'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefreshWeather}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.refreshIcon}>↻</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={[styles.loadingText, { color: '#fff' }]}>
              Updating weather...
            </Text>
          </View>
        ) : weather ? (
          <>
            <Text style={styles.locationName}>{location?.city || 'New Territories'}</Text>
            
            <View style={styles.tempRangeContainer}>
              <View style={styles.tempRangeItem}>
                <Text style={styles.tempRangeArrow}>↓</Text>
                <Text style={styles.tempRangeText}>{weather.minTemp}°C</Text>
              </View>
              <View style={styles.tempRangeItem}>
                <Text style={styles.tempRangeArrow}>↑</Text>
                <Text style={styles.tempRangeText}>{weather.maxTemp}°C</Text>
              </View>
            </View>

            <View style={styles.mainDataContainer}>
              <View style={styles.dataRow}>
                <Text style={styles.mainTemp}>{weather.temperature}°C</Text>
                <Text style={styles.dataLabel}>Temperature</Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.humidityValue}>{weather.humidity}%</Text>
                <Text style={styles.dataLabel}>Humidity</Text>
              </View>
            </View>

            <View style={styles.hourlyContainer}>
              <Text style={styles.hourlyTitle}>Today's Forecast</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={weather.hourlyForecast}
                renderItem={({ item }) => <HourlyForecastItem item={item} />}
                keyExtractor={(item) => item.time}
                contentContainerStyle={styles.hourlyList}
              />
            </View>

            <View style={styles.bottomContainer}>
              <Text style={styles.locationText}>{location?.city || 'New Territories'}</Text>
              <Text style={styles.uvIndexText}>
                UV Index {weather.uvi} ({getUVIDescription(weather.uvi)})
              </Text>
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
      </LinearGradient>

      {/* Daily Forecast Card */}
      {weather?.dailyForecast && (
        <LinearGradient
          colors={gradientColors}
          style={styles.dailyForecastCard}
        >
          <Text style={styles.dailyForecastTitle}>Local Weather Forecast</Text>
          <FlatList
            data={weather.dailyForecast}
            renderItem={({ item }) => <DailyForecastItem item={item} />}
            keyExtractor={(item) => item.date.toISOString()}
            scrollEnabled={false}
          />
        </LinearGradient>
      )}
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
    padding: 20,
    marginBottom: 24,
    minHeight: 250,
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
    marginBottom: 20,
  },
  weatherTitleContainer: {
    flex: 1,
  },
  weatherTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  updateTime: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  refreshIcon: {
    fontSize: 24,
    color: '#fff',
    opacity: 0.9,
  },
  locationName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  tempRangeContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
  },
  tempRangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tempRangeArrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  tempRangeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
  },
  mainDataContainer: {
    gap: 16,
    marginBottom: 20,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainTemp: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  humidityValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  dataLabel: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    fontWeight: '500',
  },
  bottomContainer: {
    marginTop: 'auto',
    gap: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  uvIndexText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  hourlyContainer: {
    marginVertical: 20,
  },
  hourlyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  hourlyList: {
    paddingHorizontal: 4,
  },
  hourlyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  hourlyTime: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  hourlyIcon: {
    fontSize: 24,
    marginVertical: 4,
  },
  hourlyTemp: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 2,
  },
  hourlyHumidity: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  dailyForecastCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dailyForecastTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dailyDateContainer: {
    width: 80,
  },
  dailyDay: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dailyDate: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  dailyIcon: {
    fontSize: 24,
    marginHorizontal: 16,
  },
  dailyTempContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dailyTemp: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  dailyHumidity: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
});

export default HomeScreen; 