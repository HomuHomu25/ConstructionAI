import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import HomeScreen from '../screens/home/HomeScreen';
import CaptureScreen from '../screens/capture/CaptureScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { theme } = useTheme();

  const TabIcon = ({ emoji, focused }) => (
    <Text style={{ 
      fontSize: 24,
      opacity: focused ? 1 : 0.5,
    }}>
      {emoji}
    </Text>
  );

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Capture"
        component={CaptureScreen}
        options={{
          title: "Capture",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📸" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 