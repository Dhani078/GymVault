import { Platform } from 'react-native';

const getNotifee = () => {
  try {
    const { NativeModules } = require('react-native');
    if (!NativeModules.NotifeeApiModule) return null;
    return require('@notifee/react-native');
  } catch (e) {
    return null;
  }
};

class LiveActivityManager {
  constructor() {
    this.channelId = 'gymvault_active_session';
    this.initPromise = null;
    this.listeners = new Set();
    if (Platform.OS === 'android') {
      this.initPromise = this.initAndroidChannel();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(actionId) {
    this.listeners.forEach(l => {
      try {
        l(actionId);
      } catch (err) {

      }
    });
  }

  async initAndroidChannel() {
    const notifeeLib = getNotifee();
    if (!notifeeLib) return;
    const notifee = notifeeLib.default;
    const { AndroidImportance, AndroidVisibility } = notifeeLib;

    try {
      await notifee.requestPermission();
      await notifee.createChannel({
        id: this.channelId,
        name: 'Active Workout Session',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        vibration: false,
        sound: 'default',
      });
    } catch (e) {

    }
  }

  async startWorkoutActivity({ startTime, exerciseName = 'Active Session' }) {
    if (Platform.OS !== 'android') {
      return;
    }

    const notifeeLib = getNotifee();
    if (!notifeeLib) return;
    const notifee = notifeeLib.default;

    await this.initPromise;

    const startMs = new Date(startTime).getTime();

    try {
      await notifee.displayNotification({
        id: 'active_workout',
        title: 'GymVault Session Active 💪',
        body: `Working out: ${exerciseName}`,
        android: {
          channelId: this.channelId,
          ongoing: true,
          onlyAlertOnce: true,
          asForegroundService: true,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          showChronometer: true,
          chronometerCountDown: false,
          timestamp: startMs,
          actions: [
            {
              title: 'Finish Workout',
              pressAction: { id: 'finish_workout' },
            },
          ],
        },
      });
    } catch (e) {

    }
  }

  async startRestTimer({ restTimeSeconds, exerciseName = '' }) {
    if (Platform.OS !== 'android') {
      return;
    }

    const notifeeLib = getNotifee();
    if (!notifeeLib) return;
    const notifee = notifeeLib.default;

    await this.initPromise;

    const targetTimeMs = Date.now() + restTimeSeconds * 1000;

    try {
      await notifee.displayNotification({
        id: 'active_workout',
        title: 'Rest Timer Active ⏱️',
        body: exerciseName ? `Next set of ${exerciseName}` : 'Resting before next set',
        android: {
          channelId: this.channelId,
          ongoing: true,
          onlyAlertOnce: true,
          asForegroundService: true,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          showChronometer: true,
          chronometerCountDown: true,
          timestamp: targetTimeMs,
          actions: [
            {
              title: '+30s Rest',
              pressAction: { id: 'add_30s' },
            },
            {
              title: 'Skip Rest',
              pressAction: { id: 'skip_rest' },
            },
          ],
        },
      });
    } catch (e) {

    }
  }

  async stopActivity() {
    if (Platform.OS !== 'android') {
      return;
    }

    const notifeeLib = getNotifee();
    if (!notifeeLib) return;
    const notifee = notifeeLib.default;

    try {
      await notifee.stopForegroundService();
      await notifee.cancelNotification('active_workout');
    } catch (e) {

    }
  }
}

export default new LiveActivityManager();
