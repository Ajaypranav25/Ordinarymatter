/**
 * OrdinaryMatter — Notifications Service
 *
 * Handles local push notifications using expo-notifications.
 *
 * Guard: expo-notifications crashes at import time on Android in Expo Go
 * (SDK 53+ removed push support). We use a conditional require() to skip
 * loading the module entirely in that environment.
 */

import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';

// Conditionally load expo-notifications to avoid the SDK 53 side-effect crash
// on Android in Expo Go (DevicePushTokenAutoRegistration.fx.js throws on import).
let Notifications: typeof import('expo-notifications') | null = null;

if (!(Platform.OS === 'android' && isRunningInExpoGo())) {
  Notifications = require('expo-notifications');

  // Configure notification behavior
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} else {
  console.warn('[notifications] Disabled in Expo Go on Android (SDK 53+ removed push support).');
}

class NotificationService {
  private initialized = false;

  /**
   * Initialize notification permissions.
   */
  async init(): Promise<boolean> {
    if (this.initialized) return true;
    if (!Notifications) {
      this.initialized = true;
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[notifications] Permission not granted');
        return false;
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('ordinarymatter', {
          name: 'OrdinaryMatter',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4F6EF7',
          sound: 'default',
        });
      }

      this.initialized = true;
      return true;
    } catch (err) {
      console.error('[notifications] Init error:', err);
      return false;
    }
  }

  /**
   * Show a local notification.
   */
  async show(title: string, body: string, data?: Record<string, any>): Promise<void> {
    if (!Notifications) return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: null, // Immediate
      });
    } catch (err) {
      console.error('[notifications] Show error:', err);
    }
  }

  /**
   * Show a notification for a server event.
   */
  async showForEvent(notification: {
    type: string;
    message: string;
    data?: any;
  }): Promise<void> {
    const titles: Record<string, string> = {
      task_completed: '✅ Task Completed',
      task_failed: '❌ Task Failed',
      needs_input: '✋ Input Needed',
      error: '⚠️ Error',
      info: 'ℹ️ OrdinaryMatter',
    };

    const title = titles[notification.type] || '⚛️ OrdinaryMatter';
    await this.show(title, notification.message, notification.data);
  }

  /**
   * Clear all notifications.
   */
  async clearAll(): Promise<void> {
    if (!Notifications) return;
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Set badge count.
   */
  async setBadge(count: number): Promise<void> {
    if (!Notifications) return;
    await Notifications.setBadgeCountAsync(count);
  }
}

export const notificationService = new NotificationService();
