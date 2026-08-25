/**
 * OrdinaryMatter — Navigation
 *
 * Bottom tab navigator with 5 tabs + stack navigator for session detail.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DashboardScreen } from '../screens/DashboardScreen';
import { SessionsListScreen, SessionDetailScreen } from '../screens/SessionsScreen';
import { RemoteScreen } from '../screens/RemoteScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useStore } from '../store';
import { colors, typography, spacing } from '../theme';

const Tab = createBottomTabNavigator();
const SessionsStack = createNativeStackNavigator();

// ─── Tab Icons ──────────────────────────────────────────────────

const tabIcons: Record<string, { active: string; inactive: string }> = {
  Dashboard: { active: '🏠', inactive: '🏠' },
  Sessions: { active: '📋', inactive: '📋' },
  Remote: { active: '💬', inactive: '💬' },
  Notifications: { active: '🔔', inactive: '🔔' },
  Settings: { active: '⚙️', inactive: '⚙️' },
};

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const icons = tabIcons[routeName] || { active: '●', inactive: '○' };
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {focused ? icons.active : icons.inactive}
    </Text>
  );
}

// ─── Sessions Stack ──────────────────────────────────────────────

function SessionsStackNavigator() {
  return (
    <SessionsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { ...typography.h3 },
        headerShadowVisible: false,
      }}
    >
      <SessionsStack.Screen
        name="SessionsList"
        component={SessionsListScreen}
        options={{ title: 'Sessions' }}
      />
      <SessionsStack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{ title: 'Session Detail' }}
      />
    </SessionsStack.Navigator>
  );
}

// ─── Tab Badge ───────────────────────────────────────────────────

function NotificationBadge() {
  const { state } = useStore();

  if (state.unreadCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {state.unreadCount > 9 ? '9+' : state.unreadCount}
      </Text>
    </View>
  );
}

// ─── Main Navigator ──────────────────────────────────────────────

export function AppNavigator() {
  const { state } = useStore();

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.accentPrimary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.error,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' as const },
          medium: { fontFamily: 'System', fontWeight: '500' as const },
          bold: { fontFamily: 'System', fontWeight: '700' as const },
          heavy: { fontFamily: 'System', fontWeight: '900' as const },
        },
      }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <TabIcon routeName={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { ...typography.h3 },
          headerShadowVisible: false,
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Home' }}
        />
        <Tab.Screen
          name="Sessions"
          component={SessionsStackNavigator}
          options={{ headerShown: false, title: 'Sessions' }}
        />
        <Tab.Screen
          name="Remote"
          component={RemoteScreen}
          options={{ title: 'Remote' }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            title: 'Alerts',
            tabBarBadge: state.unreadCount > 0 ? state.unreadCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: colors.error,
              fontSize: 10,
              fontWeight: '700',
              minWidth: 18,
              height: 18,
              borderRadius: 9,
            },
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
