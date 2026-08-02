import { registerRootComponent } from 'expo';

import App from './App';
// Helper to check if Notifee native module is available (prevents crashes in Expo Go)
const hasNotifeeNativeModule = () => {
  try {
    const { NativeModules } = require('react-native');
    return !!NativeModules.NotifeeApiModule;
  } catch (e) {
    return false;
  }
};

if (hasNotifeeNativeModule()) {
  try {
    const notifee = require('@notifee/react-native').default;
    const { EventType } = require('@notifee/react-native');

    // Register Notifee foreground service task
    notifee.registerForegroundService((notification) => {
      return new Promise(() => {
        // Keeps the foreground service alive
      });
    });

    // Handle background events (e.g. action buttons on notification)
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      const { notification, action } = detail;
      if (type === EventType.ACTION_PRESS) {
        try {
          const LiveActivityManager = require('./services/LiveActivityManager').default;
          LiveActivityManager.emit(action.id);
        } catch (e) {
          console.warn('[index.js] Background event emit failed:', e);
        }

        if (action.id === 'finish_workout') {
          await notifee.stopForegroundService();
          await notifee.cancelNotification(notification.id);
        }
      }
    });
  } catch (e) {
    console.warn('[index.js] Failed to initialize Notifee handlers:', e);
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
