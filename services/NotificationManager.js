import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_SETUP_KEY = '@notifications_setup_done';

export const NotificationManager = {
  async setupDailyReminders() {
    if (Platform.OS === 'web') return; // Notifications don't work the same on web

    try {
      const isSetup = await AsyncStorage.getItem(NOTIFICATION_SETUP_KEY);
      if (isSetup === 'true') return; // Already setup

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // Cancel any previous scheduled notifications to avoid duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Reminder 1: Morning Motivation (8:00 AM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Selamat Pagi! ☀️",
          body: "Jangan lupa penuhi target kalori dan protein harianmu dengan Nutrition Scanner hari ini.",
          sound: true,
        },
        trigger: {
          hour: 8,
          minute: 0,
          repeats: true,
        },
      });

      // Reminder 2: Afternoon Workout Reminder (4:00 PM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Waktunya Nge-Gym! 🏋️‍♂️",
          body: "Hari ini belum ada catatan latihan. AI Coach sudah menyiapkan rutinitas terbaik untukmu!",
          sound: true,
        },
        trigger: {
          hour: 16,
          minute: 0,
          repeats: true,
        },
      });

      // Reminder 3: Evening Water Hydration (8:00 PM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Sudah Minum Air? 💧",
          body: "Pastikan hidrasi tubuhmu terpenuhi untuk proses recovery otot malam ini.",
          sound: true,
        },
        trigger: {
          hour: 20,
          minute: 0,
          repeats: true,
        },
      });

      await AsyncStorage.setItem(NOTIFICATION_SETUP_KEY, 'true');
      console.log('Daily Reminders Scheduled!');
    } catch (error) {
      console.log('Error scheduling notifications:', error);
    }
  },

  async clearAllReminders() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(NOTIFICATION_SETUP_KEY);
    } catch (e) {
      console.error(e);
    }
  }
};

export default NotificationManager;
