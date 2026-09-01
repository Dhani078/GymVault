import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StatusBar, View, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LayoutDashboard, Dumbbell, PenLine, BarChart3, Clock, Camera } from 'lucide-react-native';
import { AppText, theme, styles } from './theme';
import { supabase, ensureDatabase } from './supabaseClient';
import { LanguageProvider } from './contexts/LanguageContext';
import { DynamicIslandProvider } from './contexts/DynamicIslandContext';
import { AppModeProvider } from './contexts/AppModeContext';
import * as Notifications from 'expo-notifications';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AdaptiveLayout from './components/AdaptiveLayout';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

import AuthScreen from './screens/AuthScreen';
import PaywallScreen from './screens/PaywallScreen';
import DashboardScreen from './screens/DashboardScreen';
import LibraryScreen from './screens/LibraryScreen';
import LoggerScreen from './screens/LoggerScreen';
import ProfileScreen from './screens/ProfileScreen';
import HistoryScreen from './screens/HistoryScreen';
import NutritionScannerModal from './screens/NutritionScannerModal';
import OnboardingScreen from './screens/OnboardingScreen';
import NotificationManager from './services/NotificationManager';

const TABS = [
  { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'Library', label: 'Library', icon: Dumbbell },
  { key: 'Scanner', label: '', icon: Camera, isAction: true },
  { key: 'Logger', label: 'Logger', icon: PenLine },
  { key: 'Profile', label: 'Profile', icon: BarChart3 },
];

import * as Crypto from 'expo-crypto';
import { makeId } from './utils/makeId';


function AppContent() {
  const { colors, darkMode } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [tab, setTab] = useState('Dashboard');
  const [dbReady, setDbReady] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  // Workout state lives here so it survives tab switches
  const [workoutData, setWorkoutData] = useState([]);
  const [workoutIndex, setWorkoutIndex] = useState(0);
  // Track workout start time for duration calculation
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState(['Dashboard']);

  useEffect(() => {
    if (!visitedTabs.includes(tab)) {
      setVisitedTabs(prev => [...prev, tab]);
    }
  }, [tab]);

  useEffect(() => {
    const initApp = async () => {
      // Load onboarding status
      const seen = await AsyncStorage.getItem('has_seen_onboarding');
      if (!seen) setShowOnboarding(true);

      // Setup Smart Daily Notifications
      NotificationManager.setupDailyReminders();

      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        setLoading(false);

        // Load active workout state for this user to prevent loss on app restart
        if (session?.user?.id) {
          try {
            const savedData = await AsyncStorage.getItem(`active_workout_data_${session.user.id}`);
            const savedIndex = await AsyncStorage.getItem(`active_workout_index_${session.user.id}`);
            const savedStartTime = await AsyncStorage.getItem(`active_workout_start_time_${session.user.id}`);
            if (savedData) {
              const parsedData = JSON.parse(savedData);
              if (parsedData && parsedData.length > 0) {
                setWorkoutData(parsedData);
                if (savedIndex) setWorkoutIndex(Number(savedIndex));
                if (savedStartTime) setWorkoutStartTime(savedStartTime);
                // setTab('Logger'); // Removed auto-redirect based on user request
              }
            }
          } catch (e) {
            console.warn('Failed to restore active workout state:', e);
          }
        }
      });
    };
    const { DeviceEventEmitter } = require('react-native');
    const offlineSub = DeviceEventEmitter.addListener('offline_login', (guestSession) => {
      setSession(guestSession);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (_event === 'SIGNED_OUT' || !session) {
        setWorkoutData([]);
        setWorkoutIndex(0);
        setWorkoutStartTime(null);
        // Reset notif timer saat logout agar bisa menjadwalkan ulang
        Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      }
    });

    initApp();

    return () => {
      offlineSub.remove();
      subscription.unsubscribe();
    };
  }, []);

  if (!fontsLoaded && Platform.OS !== 'web') {
    return <View style={{ flex: 1, backgroundColor: '#0E0E0F' }} />;
  }

  // Save active workout state to AsyncStorage whenever it changes
  useEffect(() => {
    const saveActiveWorkout = async () => {
      if (!session?.user?.id) return;
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        if (workoutData && workoutData.length > 0) {
          await AsyncStorage.setItem(`active_workout_data_${session.user.id}`, JSON.stringify(workoutData));
          await AsyncStorage.setItem(`active_workout_index_${session.user.id}`, String(workoutIndex));
          if (workoutStartTime) {
            await AsyncStorage.setItem(`active_workout_start_time_${session.user.id}`, workoutStartTime);
          }
        } else {
          // If workoutData is empty, clear the saved state
          await AsyncStorage.removeItem(`active_workout_data_${session.user.id}`);
          await AsyncStorage.removeItem(`active_workout_index_${session.user.id}`);
          await AsyncStorage.removeItem(`active_workout_start_time_${session.user.id}`);
        }
      } catch (e) {
        console.warn('Failed to save active workout state:', e);
      }
    };
    saveActiveWorkout();
  }, [workoutData, workoutIndex, workoutStartTime, session]);

  // Centralized LiveActivityManager sync
  useEffect(() => {
    try {
      const LiveActivityManager = require('./services/LiveActivityManager').default;
      if (workoutStartTime) {
        const activeExName = workoutData[workoutIndex]?.name || 'Workout Session';
        LiveActivityManager.startWorkoutActivity({ 
          startTime: workoutStartTime, 
          exerciseName: activeExName
        });
      } else {
        LiveActivityManager.stopActivity();
      }
    } catch (err) {
      console.warn('[App.js] LiveActivity sync error:', err);
    }
  }, [workoutStartTime, workoutIndex, workoutData]);

  // Setup Inactivity Reminder (3 Days) — hanya jadwalkan jika belum ada
  useEffect(() => {
    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      // Cek apakah sudah ada notifikasi terjadwal — jangan reset kalau sudah ada
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const alreadySet = scheduled.some(n => n.content?.title?.includes("Don't lose your streak"));
      if (alreadySet) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔥 Don't lose your streak!",
          body: "It's been a few days since your last session. Time to crush a workout today!",
          sound: true,
        },
        trigger: { seconds: 3 * 24 * 60 * 60 }, // 3 days
      });
    };
    setupNotifications();
  }, []);

  // Check database on session ready
  useEffect(() => {
    if (session) {
      ensureDatabase().then(ready => {
        setDbReady(ready);
        if (!ready) {
          console.warn('Database tables not found. Please run setup_database.sql in Supabase SQL Editor.');
        }
      });
    }
  }, [session]);

  // Dashboard "Start Workout"
  const handleStartWorkout = useCallback(() => {
    if (workoutData.length === 0) {
      setWorkoutStartTime(new Date().toISOString());
      setTab('Library');
    } else {
      setTab('Logger');
    }
  }, [workoutData]);

  // Dashboard "Start Routine"
  const handleStartRoutine = useCallback((routine) => {
    const newWorkoutData = routine.exercises.map(ex => {
      const sets = Array.from({ length: ex.numSets || 3 }).map(() => ({ id: makeId(), kg: 0, reps: 0, completed: false }));
      return {
        id: makeId(),
        name: ex.name,
        muscle_group: ex.muscle_group || '',
        image: ex.image,
        sets: sets
      };
    });
    setWorkoutData(newWorkoutData);
    setWorkoutStartTime(new Date().toISOString());
    setTab('Logger');
  }, []);

  // Library "Start Exercise" → APPEND to workout
  const handleAddExercise = useCallback((ex) => {
    if (!workoutStartTime) {
      setWorkoutStartTime(new Date().toISOString());
    }
    setWorkoutData(prev => {
      const existing = prev.findIndex(e => e.name === ex.name);
      if (existing >= 0) {
        setWorkoutIndex(existing);
        return prev;
      }
      const newItem = {
        id: makeId(),
        name: ex.name,
        muscle_group: ex.muscle_group || ex.primaryMuscles?.[0] || '',
        secondary_muscles: ex.secondary_muscles || ex.secondaryMuscles || [],
        equipment_type: ex.equipment_type || ex.equipment || '',
        image: ex.thumbnail_url || ex.image || '',
        sets: [{ id: makeId(), kg: 0, reps: 0, completed: false }],
      };
      const newData = [...prev, newItem];
      setWorkoutIndex(newData.length - 1);
      return newData;
    });
    setTab('Logger');
  }, [workoutStartTime]);

  // Logger finished → clear workout, go to History
  const handleFinishWorkout = useCallback(() => {
    setWorkoutData([]);
    setWorkoutIndex(0);
    setWorkoutStartTime(null);
    setTab('History');
  }, []);

  // Sync Notifee Foreground actions to React state
  useEffect(() => {
    try {
      const notifee = require('@notifee/react-native').default;
      const { EventType } = require('@notifee/react-native');
      const LiveActivityManager = require('./services/LiveActivityManager').default;

      const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
        const { action } = detail;
        if (type === EventType.ACTION_PRESS) {
          LiveActivityManager.emit(action.id);
          if (action.id === 'finish_workout') {
            handleFinishWorkout();
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('[App.js] Foreground event subscription failed:', e);
    }
  }, [handleFinishWorkout]);

  // Handle start live workout from AI Coach
  useEffect(() => {
    const { DeviceEventEmitter } = require('react-native');
    const sub = DeviceEventEmitter.addListener('start_live_workout', (event) => {
      if (!event || !event.exercises) return;

      const newWorkoutData = event.exercises.map(ex => ({
        id: makeId(),
        name: ex.name,
        image: '',
        sets: ex.sets ? ex.sets.map(s => ({
          id: makeId(),
          kg: Number(s.weight || s.weight_kg) || 0,
          reps: Number(s.reps) || 0,
          completed: false
        })) : [{ id: makeId(), kg: 0, reps: 0, completed: false }]
      }));

      setWorkoutData(newWorkoutData);
      setWorkoutIndex(0);
      setWorkoutStartTime(new Date().toISOString());
      setTab('Logger');
    });
    return () => sub.remove();
  }, []);

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const renderContent = () => {
    if (!session) {
      return <AuthScreen />;
    }
    if (showOnboarding) {
      return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
    }
    if (showPaywall) {
      return <PaywallScreen onSkip={() => setShowPaywall(false)} session={session} />;
    }
    return (
      <>
        <View style={{ flex: 1, width: '100%', alignSelf: 'center', backgroundColor: colors.background, overflow: 'hidden' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, display: tab === 'Dashboard' ? 'flex' : 'none' }}>
              {visitedTabs.includes('Dashboard') && <DashboardScreen onStartWorkout={handleStartWorkout} onStartRoutine={handleStartRoutine} session={session} dbReady={dbReady} hasActiveWorkout={workoutData.length > 0} />}
            </View>
            <View style={{ flex: 1, display: tab === 'Library' ? 'flex' : 'none' }}>
              {visitedTabs.includes('Library') && <LibraryScreen onStartExercise={handleAddExercise} />}
            </View>
            <View style={{ flex: 1, display: tab === 'Logger' ? 'flex' : 'none' }}>
              {visitedTabs.includes('Logger') && (
                <LoggerScreen
                  session={session}
                  dbReady={dbReady}
                  workoutData={workoutData}
                  setWorkoutData={setWorkoutData}
                  currentIndex={workoutIndex}
                  setCurrentIndex={setWorkoutIndex}
                  workoutStartTime={workoutStartTime}
                  onFinish={handleFinishWorkout}
                  onGoToLibrary={() => setTab('Library')}
                />
              )}
            </View>
            <View style={{ flex: 1, display: tab === 'History' ? 'flex' : 'none' }}>
              {visitedTabs.includes('History') && <HistoryScreen session={session} dbReady={dbReady} />}
            </View>
            <View style={{ flex: 1, display: tab === 'Profile' ? 'flex' : 'none' }}>
              {visitedTabs.includes('Profile') && <ProfileScreen session={session} dbReady={dbReady} onSignOut={() => supabase.auth.signOut()} onGoToHistory={() => setTab('History')} />}
            </View>
          </View>

          <View style={styles.tabBar}>
            {TABS.map(t => {
              if (t.isAction) {
                return (
                  <View key={t.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={{
                        top: -20,
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: theme.colors.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                        elevation: 8,
                        borderWidth: 4,
                        borderColor: colors.background,
                      }}
                      onPress={() => setScannerVisible(true)}
                    >
                      <t.icon color="#000" size={28} />
                    </TouchableOpacity>
                  </View>
                );
              }

              const active = tab === t.key;
              return (
                <TouchableOpacity key={t.key} style={styles.tabItem} onPress={() => setTab(t.key)}>
                  <t.icon color={active ? theme.colors.primary : theme.colors.textMuted} size={24} />
                  <AppText style={[styles.tabLabel, active && { color: theme.colors.primary }]}>{t.label}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <NutritionScannerModal 
          visible={scannerVisible} 
          onClose={() => setScannerVisible(false)} 
          session={session}
        />
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <AdaptiveLayout session={session}>
        {renderContent()}
      </AdaptiveLayout>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppModeProvider>
          <DynamicIslandProvider>
            <AppContent />
          </DynamicIslandProvider>
        </AppModeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
