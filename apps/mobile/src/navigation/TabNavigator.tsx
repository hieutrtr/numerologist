import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSizes } from '../utils/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { DailyProvider } from '../providers/DailyProvider';
import { useConversationStore } from '../store/conversationStore';

export type TabParamList = {
  Home: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Wrap HomeScreen with DailyProvider for Story 1.2c voice streaming
// Pass roomUrl and token from conversation store to join Daily.co room
const HomeScreenWithDaily: React.FC = () => {
  const { dailyRoomUrl, dailyToken } = useConversationStore();

  return (
    <DailyProvider roomUrl={dailyRoomUrl || ''} token={dailyToken || ''}>
      <HomeScreen />
    </DailyProvider>
  );
};

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryPurple,
        tabBarInactiveTintColor: Colors.grey,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: Colors.lightGrey,
        },
        tabBarLabelStyle: {
          fontSize: FontSizes.xs,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreenWithDaily}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
