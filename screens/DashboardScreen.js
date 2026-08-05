import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, ActivityIndicator, RefreshControl, Animated, Easing, TextInput, Alert, Platform, Image } from 'react-native';
import { Dumbbell, Activity, Flame, Trophy, Calendar, TrendingUp, Target, Zap, Coffee, ShieldAlert, Home, CheckCircle2, Check, Droplet, Gamepad2, Timer, RefreshCw, X, Users } from 'lucide-react-native';
import { AppText, styles, theme } from '../theme';
import { supabase, safeSelect, safeUpsert } from '../supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { useDynamicIsland } from '../contexts/DynamicIslandContext';
import { useAppMode, HOME_EQUIPMENT_CATALOG } from '../contexts/AppModeContext';
import AIChatBubble from './AIChatBubble';
import AIRoutineModal from '../components/AIRoutineModal';
import SocialLeaderboardModal from '../components/SocialLeaderboardModal';
import AICoachLogo from '../components/AICoachLogo';
import MuscleRecoveryMap from '../components/MuscleRecoveryMap';
import ProgressAnalyticsModal from '../components/ProgressAnalyticsModal';
import AIMealPlanModal from './AIMealPlanModal';
import SmoothScrollView from '../components/SmoothScrollView';
import SkiaProgressRing from '../components/SkiaProgressRing';
import DummyAdBanner from '../components/DummyAdBanner';
import { MotiView } from 'moti';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const GEMINI_API_KEY = (() => {
  const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim() !== '' && envKey !== 'undefined' && envKey !== 'null') {
    return envKey;
  }
  return "AIzaSyDVkBIsm2qZx6YwRS62l3qPKtuXqP6d9jU";
})();

export default function DashboardScreen({ onStartWorkout, onStartRoutine, session, dbReady, hasActiveWorkout }) {
  const { t } = useTranslation();
  const { showNotification } = useDynamicIsland();
  const { mode, setMode, isHome, equipmentInventory, toggleEquipment } = useAppMode();
  const [modalVisible, setModalVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customRoutines, setCustomRoutines] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);

  const [stats, setStats] = useState({
    totalWorkouts: 0,
    latestWorkout: null,
    thisWeek: 0,
    totalVolume: 0,
    streak: 0,
  });
  const [todayNutrition, setTodayNutrition] = useState({ protein: 0, carbs: 0, fats: 0, calories: 0 });
  const [userProfile, setUserProfile] = useState(null);
  const [dbError, setDbError] = useState(false);

  // CNS State
  const [sleep, setSleep] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [energy, setEnergy] = useState(3);

  // Neuro Reaction Game State
  const [showReactionGame, setShowReactionGame] = useState(false);
  const [reactionGameState, setReactionGameState] = useState('idle'); // 'idle', 'waiting', 'flash', 'result'
  const [reactionTrials, setReactionTrials] = useState([]);
  const [reactionStartTime, setReactionStartTime] = useState(0);
  const [reactionTimer, setReactionTimer] = useState(null);
  const [reactionMsg, setReactionMsg] = useState('Ketuk untuk memulai tes (3x percobaan)');
  const [reactionProgress, setReactionProgress] = useState(0);

  // Nutrition & Water State
  const [nutritionStats, setNutritionStats] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [macroTarget, setMacroTarget] = useState({ target_calories: 0, target_protein: 0 });
  const [todayMeals, setTodayMeals] = useState([]);
  const [waterMl, setWaterMl] = useState(0);
  const [manualNutModal, setManualNutModal] = useState(false);
  const [mealPlannerVisible, setMealPlannerVisible] = useState(false);
  const [manualNutForm, setManualNutForm] = useState({ food: '', cal: '', p: '', c: '', f: '' });
  const [aiFoodInput, setAiFoodInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingText, setAiLoadingText] = useState("AI Berpikir...");
  const [showWaterInput, setShowWaterInput] = useState(false);
  const [customWaterMl, setCustomWaterMl] = useState('');
  const [quickLogText, setQuickLogText] = useState('');

  // Offline / Online Connectivity & Sync State
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  const checkConnectivity = async () => {
    if (Platform.OS === 'web') {
      return navigator.onLine;
    }
    try {
      const fetchPromise = fetch('https://clients3.google.com/generate_204');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout Google')), 3000)
      );
      const res = await Promise.race([fetchPromise, timeoutPromise]);
      if (res.status === 204 || res.status === 200 || res.ok) {
        setConnectionError('');
        return true;
      }
      throw new Error(`Google status ${res.status}`);
    } catch (e) {
      try {
        const fetchPromise2 = fetch('https://sjrzhiigrcrcpgvnfixo.supabase.co');
        const timeoutPromise2 = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout Supabase')), 3000)
        );
        const res2 = await Promise.race([fetchPromise2, timeoutPromise2]);
        if (res2.status > 0) {
          setConnectionError('');
          return true;
        }
        throw new Error(`Supabase status ${res2.status}`);
      } catch (err) {
        setConnectionError(`G: ${e.message || e} | S: ${err.message || err}`);
        return false;
      }
    }
  };

  const loadOfflineQueueCount = async () => {
    try {
      if (!session?.user?.id) return [];
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const queueStr = await AsyncStorage.getItem(`offline_workouts_${session.user.id}`);
      if (queueStr) {
        const queue = JSON.parse(queueStr);
        setOfflineQueueCount(queue.length);
        return queue;
      }
    } catch (e) {
      console.warn("Error loading offline queue:", e);
    }
    setOfflineQueueCount(0);
    return [];
  };

  const syncOfflineQueue = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      if (!session?.user?.id) return;
      const userId = session.user.id;
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;

      // 🥗 SYNC OFFLINE NUTRITION LOGS
      try {
        const nutQueueStr = await AsyncStorage.getItem(`offline_nutrition_${userId}`);
        if (nutQueueStr) {
          const nutQueue = JSON.parse(nutQueueStr);
          if (nutQueue.length > 0) {
            const { safeInsert } = require('../supabaseClient');
            let successCount = 0;
            for (const item of nutQueue) {
              const { error } = await safeInsert('nutrition_logs', {
                user_id: userId,
                food_name: item.food_name,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs || 0,
                fats: item.fats || 0,
                created_at: item.created_at || new Date().toISOString()
              });
              if (!error) successCount++;
            }
            await AsyncStorage.removeItem(`offline_nutrition_${userId}`);
            if (successCount > 0) {
              showNotification({
                type: 'success',
                title: 'Nutrisi Sinkron! 🥗',
                subtitle: `Berhasil mengunggah ${successCount} riwayat makan offline.`,
                duration: 4000
              });
            }
          }
        }
      } catch (nutErr) {
        console.warn("[Offline Sync] Nutrition sync error:", nutErr);
      }

      const queueStr = await AsyncStorage.getItem(`offline_workouts_${userId}`);
      if (!queueStr) return;
      
      const queue = JSON.parse(queueStr);
      if (queue.length === 0) return;

      const successfulIds = [];
      const { safeInsert, safeBatchInsert } = require('../supabaseClient');

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        try {
          if (!item.sessionPayload) continue;
          
          const payload = {
            ...item.sessionPayload,
            user_id: userId
          };
          
          const { data: sessionData, error: sessionErr } = await safeInsert('workout_sessions', payload);
          if (sessionErr || !sessionData) {
            console.warn("[Offline Sync] Failed to insert session:", sessionErr?.message);
            continue;
          }

          const setRows = [];
          if (item.workoutData && Array.isArray(item.workoutData)) {
            item.workoutData.forEach((ex) => {
              if (ex.sets && Array.isArray(ex.sets)) {
                ex.sets.forEach((s, setIdx) => {
                  if (s.completed) {
                    setRows.push({
                      session_id: sessionData.id,
                      exercise_id: null,
                      weight_kg: s.kg,
                      reps: s.reps,
                      set_index: setIdx + 1,
                      is_checked: true
                    });
                  }
                });
              }
            });
          }

          if (setRows.length > 0) {
            const { error: setsErr } = await safeBatchInsert('workout_sets', setRows);
            if (setsErr) {
              console.warn('[Offline Sync] Sets save partial failure:', setsErr.message);
            }
          }

          successfulIds.push(i);
        } catch (err) {
          console.warn("[Offline Sync] Network/request failed during sync:", err);
        }
      }

      const remainingQueue = queue.filter((_, idx) => !successfulIds.includes(idx));
      if (remainingQueue.length === 0) {
        await AsyncStorage.removeItem(`offline_workouts_${userId}`);
        setOfflineQueueCount(0);
        showNotification({
          type: 'success',
          title: 'Sinkronisasi Selesai! ⚡',
          subtitle: `Berhasil mengunggah ${successfulIds.length} latihan offline.`,
          duration: 5000
        });
        fetchDashboardData();
      } else {
        await AsyncStorage.setItem(`offline_workouts_${userId}`, JSON.stringify(remainingQueue));
        setOfflineQueueCount(remainingQueue.length);
        if (successfulIds.length > 0) {
          showNotification({
            type: 'warning',
            title: 'Sinkronisasi Parsial ⚠️',
            subtitle: `${successfulIds.length} terunggah, ${remainingQueue.length} tertunda.`,
            duration: 5000
          });
          fetchDashboardData();
        }
      }
    } catch (e) {
      console.warn("syncOfflineQueue error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const runCheck = async () => {
      const online = await checkConnectivity();
      if (!isMounted) return;
      setIsOnline(online);
      
      const queue = await loadOfflineQueueCount();
      if (!isMounted) return;

      // Auto-sync if online and there are items in the queue
      if (online && queue && queue.length > 0 && !isSyncing) {
        await syncOfflineQueue();
      }
    };

    runCheck();
    intervalId = setInterval(runCheck, 15000);

    // If on web, listen directly to browser online/offline events for instant response
    let handleOnline, handleOffline;
    if (Platform.OS === 'web') {
      handleOnline = () => {
        setIsOnline(true);
        setConnectionError('');
        loadOfflineQueueCount().then(queue => {
          if (queue && queue.length > 0 && !isSyncing) {
            syncOfflineQueue();
          }
        });
      };
      handleOffline = () => {
        setIsOnline(false);
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (Platform.OS === 'web' && handleOnline && handleOffline) {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [session]);

  // Animations refactored to MotiView
  useEffect(() => {
    return () => {
      if (reactionTimer) clearTimeout(reactionTimer);
    };
  }, [reactionTimer]);


  useEffect(() => {
    if (session?.user?.id) fetchDashboardData();
    fetchCustomRoutines();

    const { DeviceEventEmitter } = require('react-native');
    const sub = DeviceEventEmitter.addListener('activity_logged', () => {
      if (session?.user?.id) fetchDashboardData();
    });
    return () => sub.remove();
  }, [session, dbReady]);

  const fetchCustomRoutines = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // 1. Load local routines first for instant UI
      const routinesStr = await AsyncStorage.getItem('customRoutines');
      let localRoutines = [];
      if (routinesStr) {
        localRoutines = JSON.parse(routinesStr);
        setCustomRoutines(localRoutines);
      }

      // 2. Sync from Supabase if session exists
      if (session?.user?.id && dbReady) {
        const { data, error } = await supabase
          .from('users_profile')
          .select('custom_routines')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!error && data?.custom_routines) {
          const remoteRoutines = Array.isArray(data.custom_routines) ? data.custom_routines : [];
          
          if (remoteRoutines.length > 0) {
            setCustomRoutines(remoteRoutines);
            await AsyncStorage.setItem('customRoutines', JSON.stringify(remoteRoutines));
          } else if (localRoutines.length > 0) {
            // Upload local routines to remote if remote is empty
            await supabase
              .from('users_profile')
              .update({ custom_routines: localRoutines })
              .eq('id', session.user.id);
          }
        } else if (error) {
          console.log('[Dashboard] Supabase custom_routines fetch failed or column not ready:', error.message);
        }
      }
    } catch (e) {
      console.warn("Failed to load or sync routines:", e);
    }
  };

  const deleteRoutine = async (routineId) => {
    try {
      const updated = customRoutines.filter(r => r.id !== routineId);
      setCustomRoutines(updated);
      
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('customRoutines', JSON.stringify(updated));

      if (session?.user?.id && dbReady) {
        const { error } = await supabase
          .from('users_profile')
          .update({ custom_routines: updated })
          .eq('id', session.user.id);
        if (error) console.warn("[Dashboard] Failed to sync routine deletion to Supabase:", error.message);
      }
      showNotification({
        type: 'success',
        title: 'Routine Deleted 🗑️',
        subtitle: 'The routine has been removed.',
        duration: 2500,
      });
    } catch (e) {
      console.warn("Failed to delete routine", e);
    }
  };

  const fetchDashboardData = async () => {
    if (!session?.user?.id) return;

    try {
      const { data: profile, error: profileErr } = await safeSelect('users_profile', {
        filters: { id: session.user.id },
        single: true,
      });

      if (profileErr) {
        setDbError(true);
        setUserProfile({ name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Athlete' });
      } else if (profile) {
        setUserProfile(profile);
        setDbError(false);
      } else {
        setUserProfile({ name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Athlete' });
      }

      const { data: sessions, error: sessErr } = await safeSelect('workout_sessions', {
        columns: 'id, started_at, workout_sets(weight_kg, reps, is_checked, exercises(name, muscle_group))',
        filters: { user_id: session.user.id, is_completed: true },
        order: { column: 'started_at', ascending: false },
      });

      if (sessErr) {
        setDbError(true);
        setStats({ totalWorkouts: 0, latestWorkout: null, thisWeek: 0, totalVolume: 0, streak: 0 });
        setCompletedSessions([]);
      } else if (sessions && sessions.length > 0) {
        setCompletedSessions(sessions);
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        let thisWeek = 0;
        let totalVolume = 0;

        sessions.forEach(s => {
          const safeStr = (s.started_at || '').replace(' ', 'T');
          const d = new Date(safeStr);
          if (d >= startOfWeek) thisWeek++;
          (s.workout_sets || []).forEach(set => {
            if (set.is_checked) totalVolume += (set.weight_kg || 0) * (set.reps || 0);
          });
        });

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const hasWorkout = sessions.some(s => {
            const safeStr2 = (s.started_at || '').replace(' ', 'T');
            const d = new Date(safeStr2);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === checkDate.getTime();
          });
          if (hasWorkout) streak++;
          else if (i > 0) break;
        }

        const latestD = new Date(sessions[0].started_at);
        const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const latestWorkoutStr = `${monthsShort[latestD.getMonth()]} ${latestD.getDate()}`;

        setStats({
          totalWorkouts: sessions.length,
          latestWorkout: latestWorkoutStr,
          thisWeek,
          totalVolume,
          streak,
        });
        setDbError(false);
      } else {
        setStats({ totalWorkouts: 0, latestWorkout: null, thisWeek: 0, totalVolume: 0, streak: 0 });
        setCompletedSessions([]);
      }

      // Fetch Nutrition
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: numLogs } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', todayStart.toISOString());
      
      if (numLogs) {
        let cal = 0, p = 0, c = 0, f = 0;
        numLogs.forEach(l => {
          cal += Number(l.calories) || 0;
          p += Number(l.protein) || 0;
          c += Number(l.carbs) || 0;
          f += Number(l.fats) || 0;
        });
        setNutritionStats({ calories: cal, protein: p, carbs: c, fats: f });
        setTodayMeals(numLogs);
      } else {
        setTodayMeals([]);
      }

      // Fetch Water
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const waterData = await AsyncStorage.getItem('daily_water_ml');
      if (waterData) {
        const parsed = JSON.parse(waterData);
        if (parsed.date === getLocalDateString()) {
          setWaterMl(parsed.ml || 0);
        } else {
          setWaterMl(0);
        }
      }
      
      // Fetch Macro Target
      const macroData = await AsyncStorage.getItem(`nutrition_goals_${session.user.id}`);
      if (macroData) {
        setMacroTarget(JSON.parse(macroData));
      } else {
        setMacroTarget({ target_calories: 0, target_protein: 0 });
      }

      // Fetch Global Leaderboard for dashboard preview widget
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_global_leaderboard');
        if (!rpcErr && rpcData) {
          const mapped = rpcData.map((row, index) => ({
            id: row.user_id,
            name: row.name || 'Athlete',
            avatar: row.avatar_url,
            volume: Number(row.total_volume) || 0,
            streak: row.streak || 0,
            isMe: row.user_id === session.user.id,
            rank: index + 1
          }));
          setLeaderboardData(mapped);
        } else if (rpcErr) {
          console.warn('[Dashboard] Leaderboard RPC error:', rpcErr.message);
        }
      } catch (leaderboardErr) {
        console.warn('[Dashboard] Failed to fetch leaderboard:', leaderboardErr);
      }

    } catch (e) {
      console.warn('[Dashboard] fetch error:', e.message);
      setDbError(true);
    }

    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleQuickStart = async () => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setLoading(true);
    if (session?.user && !dbError) {
      try {
        await safeUpsert('users_profile', {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || userProfile?.name || 'Athlete',
          email: session.user.email,
          cns_fatigue: 3, // Default Neutral
        });
      } catch (e) {
        console.warn('[Dashboard] Quick Start CNS save failed:', e.message);
      }
    }
    setLoading(false);
    showNotification({
      type: 'workout',
      title: 'Workout Started! 💪',
      subtitle: 'Good luck, let\'s crush it today!',
      duration: 3000,
    });
    onStartWorkout();
  };

  const handleStartWorkout = async () => {
    setLoading(true);
    const averageCns = Math.round((sleep + soreness + energy) / 3);

    if (session?.user && !dbError) {
      try {
        await safeUpsert('users_profile', {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || userProfile?.name || 'Athlete',
          email: session.user.email,
          cns_fatigue: averageCns,
        });
      } catch (e) {
        console.warn('[Dashboard] CNS save failed:', e.message);
      }
    }

    setLoading(false);
    setModalVisible(false);
    onStartWorkout();
  };

  useEffect(() => {
    let interval;
    if (aiLoading) {
      const phrases = [
        "Menganalisis teks...",
        "Menghitung porsi...",
        "Mengekstrak makro...",
        "Menyelesaikan log..."
      ];
      let i = 0;
      setAiLoadingText(phrases[0]);
      interval = setInterval(() => {
        i = (i + 1) % phrases.length;
        setAiLoadingText(phrases[i]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [aiLoading]);

  const handleAIFoodParse = async () => {
    if (!aiFoodInput.trim()) return;
    setAiLoading(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "Anda adalah asisten nutrisi. Ekstrak data makanan dari input pengguna ke format JSON: {\"food\": \"Nama Makanan\", \"cal\": 123, \"p\": 12, \"c\": 34, \"f\": 5}. Jika protein, karbo, atau lemak tidak disebutkan, buat estimasi kasar secara logis berdasarkan database gizi umum. Kembalikan HANYA JSON valid tanpa markdown." }]
          },
          contents: [{ role: 'user', parts: [{ text: aiFoodInput }] }]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const aiText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      setManualNutForm({
        food: parsed.food || '',
        cal: String(parsed.cal || '0'),
        p: String(parsed.p || '0'),
        c: String(parsed.c || '0'),
        f: String(parsed.f || '0')
      });
      setAiFoodInput('');
      
      showNotification({
        type: 'success',
        title: 'AI Parse Success 🥗',
        subtitle: `Form terisi otomatis untuk: ${parsed.food || 'Makanan'}`,
        duration: 2500,
      });
    } catch (e) {
      console.warn("AI parse food failed:", e);
      Alert.alert("Gagal memproses", "AI gagal mendeteksi makanan. Coba ketik dengan format lebih jelas (cth: dada ayam bakar 200 kalori).");
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogManualNutrition = async () => {
    if (!manualNutForm.food || !manualNutForm.cal) {
      alert("Please enter food name and calories.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('nutrition_logs').insert({
      user_id: session.user.id,
      food_name: manualNutForm.food,
      calories: parseFloat(manualNutForm.cal) || 0,
      protein: parseFloat(manualNutForm.p) || 0,
      carbs: parseFloat(manualNutForm.c) || 0,
      fats: parseFloat(manualNutForm.f) || 0
    });
    setLoading(false);
    if (!error) {
      setManualNutModal(false);
      setManualNutForm({ food: '', cal: '', p: '', c: '', f: '' });
      fetchDashboardData();
    } else {
      alert("Failed to save meal: " + error.message);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    setLoading(true);
    const { error } = await supabase.from('nutrition_logs').delete().eq('id', mealId);
    setLoading(false);
    if (error) {
      alert("Failed to delete meal: " + error.message);
    } else {
      fetchDashboardData();
    }
  };

  const addWater = async (amount) => {
    const newMl = Math.max(0, waterMl + amount);
    setWaterMl(newMl);
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const { DeviceEventEmitter } = require('react-native');
    const todayStr = getLocalDateString();
    await AsyncStorage.setItem('daily_water_ml', JSON.stringify({ date: todayStr, ml: newMl }));

    // Also update water_history
    const historyStr = await AsyncStorage.getItem('water_history');
    let history = {};
    if (historyStr) {
      try { history = JSON.parse(historyStr); } catch (e) {}
    }
    history[todayStr] = newMl;
    await AsyncStorage.setItem('water_history', JSON.stringify(history));

    DeviceEventEmitter.emit('activity_logged');
  };

  // CNS Real-time Feedback Logic
  const currentCnsScore = Math.round((sleep + soreness + energy) / 3);
  const getCnsFeedback = (score) => {
    if (score >= 4) return { text: "PR Day! You are fully recovered and primed for heavy weights.", icon: Zap, color: '#10B981' };
    if (score === 3) return { text: "Moderate readiness. Solid state for a standard hypertrophy or volume session.", icon: Coffee, color: '#3B82F6' };
    return { text: "High fatigue detected. Consider a deload, active recovery, or lighter session today.", icon: ShieldAlert, color: '#F59E0B' };
  };

  const feedback = getCnsFeedback(currentCnsScore);

  // Neuro Tap Game Logic
  const cancelReactionGame = () => {
    if (reactionTimer) clearTimeout(reactionTimer);
    setShowReactionGame(false);
    setReactionGameState('idle');
    setReactionMsg('Ketuk untuk memulai tes (3x percobaan)');
  };

  const startReactionGame = () => {
    if (reactionTimer) clearTimeout(reactionTimer);
    setReactionTrials([]);
    setReactionProgress(0);
    setReactionMsg('Mempersiapkan tes...');
    runReactionTrial([], 0);
  };

  const runReactionTrial = (trials, currentProgress) => {
    setReactionGameState('waiting');
    setReactionMsg('Tunggu sampai warna berubah menjadi NEON...');
    
    const randomDelay = Math.random() * 2000 + 1500; // 1.5s to 3.5s
    const timer = setTimeout(() => {
      setReactionGameState('flash');
      setReactionStartTime(Date.now());
      setReactionMsg('KETUK SEKARANG!');
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }, randomDelay);
    
    setReactionTimer(timer);
  };

  const handleReactionTap = () => {
    const Haptics = require('expo-haptics');
    if (reactionGameState === 'idle') {
      startReactionGame();
      return;
    }
    
    if (reactionGameState === 'waiting') {
      // Tapped too early
      if (reactionTimer) clearTimeout(reactionTimer);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      setReactionGameState('idle');
      setReactionMsg('Terlalu cepat! Silakan coba lagi.');
      return;
    }
    
    if (reactionGameState === 'flash') {
      const duration = Date.now() - reactionStartTime;
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      
      const newTrials = [...reactionTrials, duration];
      setReactionTrials(newTrials);
      const nextProgress = reactionProgress + 1;
      setReactionProgress(nextProgress);
      
      if (nextProgress < 3) {
        setReactionGameState('waiting');
        setReactionMsg(`Trial ${nextProgress} Sukses: ${duration}ms. Bersiap...`);
        const timer = setTimeout(() => {
          runReactionTrial(newTrials, nextProgress);
        }, 1200);
        setReactionTimer(timer);
      } else {
        setReactionGameState('result');
        const avg = Math.round(newTrials.reduce((a, b) => a + b, 0) / 3);
        let classification = '';
        if (avg < 250) classification = 'Sangat Prima 🔥 (Level 5)';
        else if (avg < 300) classification = 'Baik 👍 (Level 4)';
        else if (avg < 350) classification = 'Normal ☕ (Level 3)';
        else if (avg < 400) classification = 'Lelah Ringan ⚠️ (Level 2)';
        else classification = 'Lelah Parah 🚨 (Level 1)';
        
        setReactionMsg(`Rata-rata: ${avg}ms · ${classification}`);
      }
    }
  };

  const applyReactionResult = () => {
    if (reactionTrials.length === 0) return;
    const avg = Math.round(reactionTrials.reduce((a, b) => a + b, 0) / 3);
    let score = 3;
    if (avg < 250) score = 5;
    else if (avg < 300) score = 4;
    else if (avg < 350) score = 3;
    else if (avg < 400) score = 2;
    else score = 1;
    
    setSleep(score);
    setSoreness(score);
    setEnergy(score);
    
    setShowReactionGame(false);
    setReactionGameState('idle');
  };

  const applyMacroTarget = async (calories, protein) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const target = { target_calories: calories, target_protein: protein };
      await AsyncStorage.setItem(`nutrition_goals_${session.user.id}`, JSON.stringify(target));
      setMacroTarget(target);
      
      if (session?.user?.id && dbReady) {
        const { error } = await supabase
          .from('users_profile')
          .update({ nutrition_goals: target })
          .eq('id', session.user.id);
        if (error) console.warn("[Dashboard] Failed to sync nutrition target to Supabase:", error.message);
      }
    } catch(e){}
  };

  const renderRating = (val, setVal) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
      {[1, 2, 3, 4, 5].map(num => (
        <TouchableOpacity
          key={num}
          activeOpacity={0.7}
          onPress={() => setVal(num)}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: val === num ? theme.colors.primary : theme.colors.surface,
            borderWidth: 1,
            borderColor: val === num ? theme.colors.primary : theme.colors.border,
            justifyContent: 'center', alignItems: 'center',
            shadowColor: val === num ? theme.colors.primary : 'transparent',
            shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: val === num ? 4 : 0
          }}
        >
          <AppText weight="bold" style={{ color: val === num ? theme.colors.background : theme.colors.text, fontSize: 16 }}>{num}</AppText>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SmoothScrollView
        style={styles.screen}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
      <MotiView 
        from={{ opacity: 0, translateY: 30 }} 
        animate={{ opacity: 1, translateY: 0 }} 
        transition={{ type: 'timing', duration: 500 }}
      >

        {/* Connection & Offline Sync Status Banner */}
        {(!isOnline || offlineQueueCount > 0) && (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            padding: 16,
            marginBottom: 20,
            overflow: 'hidden'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {isSyncing ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : !isOnline ? (
                    <ShieldAlert color="#EF4444" size={20} />
                  ) : (
                    <RefreshCw color="#10B981" size={18} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AppText weight="bold" style={{ fontSize: 14, color: isOnline ? '#10B981' : '#EF4444' }}>
                      {!isOnline ? 'Mode Offline Aktif' : isSyncing ? 'Menyingkronkan...' : 'Antrean Latihan Tersimpan'}
                    </AppText>
                    {!isOnline && (
                      <View style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#EF4444'
                      }} />
                    )}
                  </View>
                  <AppText style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2, lineHeight: 16 }}>
                    {!isOnline 
                      ? `Latihan Anda akan disimpan secara lokal. (${offlineQueueCount} antrean)${connectionError ? '\nDebug: ' + connectionError : ''}`
                      : isSyncing 
                        ? 'Sedang mengirim data latihan Anda ke cloud...' 
                        : `${offlineQueueCount} latihan baru siap disinkronkan ke cloud.`
                    }
                  </AppText>
                </View>
              </View>
              
              {isOnline && offlineQueueCount > 0 && !isSyncing && (
                <TouchableOpacity
                  onPress={syncOfflineQueue}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: theme.colors.primary,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <AppText weight="bold" style={{ fontSize: 12, color: '#000' }}>Sync Now</AppText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* DB Warning Banner */}
        {dbError && (
          <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: '#F59E0B', borderRadius: 12, padding: 14, marginBottom: 20, flexDirection: 'row', gap: 10 }}>
            <Target color="#F59E0B" size={20} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <AppText weight="bold" style={{ fontSize: 13, color: '#F59E0B', marginBottom: 2 }}>Database Setup Required</AppText>
              <AppText style={{ fontSize: 12, color: theme.colors.textMuted, lineHeight: 18 }}>
                Run setup_database.sql in Supabase SQL Editor to enable workout saving & history.
              </AppText>
            </View>
          </View>
        )}

        {/* ═══ PREMIUM HEADER ═══ */}
        <View style={{ marginBottom: 28, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 }} />
                <AppText weight="bold" style={{ fontSize: 11, color: theme.colors.primary, letterSpacing: 3 }}>
                  {userProfile?.name ? `WELCOME BACK` : 'GYMVAULT'}
                </AppText>
              </View>
              <AppText weight="bold" style={{ fontSize: 30, color: theme.colors.text, lineHeight: 36 }}>
                {userProfile?.name || t('good_morning')} 💪
              </AppText>
              <AppText style={{ color: '#666', fontSize: 15, marginTop: 4 }}>
                {t('ready_to_break_limits')}
              </AppText>
            </View>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(204,255,0,0.08)', borderWidth: 1.5, borderColor: 'rgba(204,255,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
              <Flame color={theme.colors.primary} size={26} />
            </View>
          </View>

          {/* Quick Streak Pill & Leaderboard */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {stats.streak > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(204,255,0,0.06)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(204,255,0,0.15)' }}>
                <Flame color={theme.colors.primary} size={14} />
                <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 13, marginLeft: 6 }}>{stats.streak} day streak</AppText>
              </View>
            )}
            <TouchableOpacity onPress={() => setShowLeaderboard(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.colors.border }}>
              <Trophy color="#FFD700" size={14} style={{ marginRight: 6 }} />
              <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 13 }}>Leaderboard</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ ADAPTIVE ENGINE TOGGLE ═══ */}
        <View style={{ flexDirection: 'row', backgroundColor: theme.colors.inputBg, borderRadius: 20, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border }}>
          <TouchableOpacity 
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, backgroundColor: !isHome ? 'rgba(204,255,0,0.1)' : 'transparent', borderWidth: !isHome ? 1 : 0, borderColor: !isHome ? 'rgba(204,255,0,0.3)' : 'transparent' }}
            onPress={() => setMode('gym')}
          >
            <Dumbbell color={!isHome ? theme.colors.primary : theme.colors.textMuted} size={18} style={{ marginRight: 8 }} />
            <AppText weight="bold" style={{ color: !isHome ? theme.colors.text : theme.colors.textMuted, fontSize: 14 }}>Gym Mode</AppText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, backgroundColor: isHome ? 'rgba(204,255,0,0.1)' : 'transparent', borderWidth: isHome ? 1 : 0, borderColor: isHome ? 'rgba(204,255,0,0.3)' : 'transparent' }}
            onPress={() => setMode('home')}
          >
            <Home color={isHome ? theme.colors.primary : theme.colors.textMuted} size={18} style={{ marginRight: 8 }} />
            <AppText weight="bold" style={{ color: isHome ? theme.colors.text : theme.colors.textMuted, fontSize: 14 }}>Home Mode</AppText>
          </TouchableOpacity>
        </View>

        {/* ═══ HOME EQUIPMENT INVENTORY (CONDITIONAL) ═══ */}
        {isHome && (
          <View style={{ marginBottom: 24, padding: 16, backgroundColor: theme.colors.card, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border }}>
            <AppText weight="bold" style={{ fontSize: 16, marginBottom: 4 }}>Your Equipment</AppText>
            <AppText style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Select what you have available at home</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {HOME_EQUIPMENT_CATALOG.map(eq => {
                const hasEq = equipmentInventory.includes(eq.id);
                const isBodyOnly = eq.id === 'body_only';
                return (
                  <TouchableOpacity
                    key={eq.id}
                    onPress={() => !isBodyOnly && toggleEquipment(eq.id)}
                    activeOpacity={isBodyOnly ? 1 : 0.7}
                    style={{ 
                      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: hasEq ? 'rgba(204,255,0,0.08)' : theme.colors.surface,
                      borderWidth: 1, borderColor: hasEq ? theme.colors.primary : theme.colors.border
                    }}
                  >
                    <AppText style={{ fontSize: 14, marginRight: 6 }}>{eq.icon}</AppText>
                    <AppText style={{ color: hasEq ? theme.colors.primary : theme.colors.textMuted, fontSize: 13, fontWeight: hasEq ? '600' : '400' }}>{eq.label}</AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ═══ START WORKOUT CTA ═══ */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={{ 
            width: '100%', 
            borderRadius: 24, 
            overflow: 'hidden', 
            marginBottom: 16, 
            backgroundColor: hasActiveWorkout ? '#F59E0B' : theme.colors.primary, 
            shadowColor: hasActiveWorkout ? '#F59E0B' : theme.colors.primary, 
            shadowOffset: { width: 0, height: 10 }, 
            shadowOpacity: 0.45, 
            shadowRadius: 20, 
            elevation: 8,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)'
          }}
          onPress={handleQuickStart}
          disabled={loading}
        >
          <View style={{ paddingVertical: 24, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            {loading ? <ActivityIndicator color="#000" /> : (
              <>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                  <Dumbbell color="#000" size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{ color: '#000', fontSize: 20, letterSpacing: 0.2 }}>
                    {hasActiveWorkout ? (t('language') === 'Bahasa Indonesia' ? 'Lanjutkan Latihan' : 'Resume Workout') : t('quick_start')}
                  </AppText>
                  <AppText style={{ color: 'rgba(0,0,0,0.55)', fontSize: 13, marginTop: 2, fontWeight: '500' }}>
                    {hasActiveWorkout ? 'You have an active session' : 'Begin your custom training session'}
                  </AppText>
                </View>
                <Zap color="#000" size={20} />
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* ═══ QUICK AI LOG INPUT CARD ═══ */}
        <View style={{ 
          backgroundColor: theme.colors.card, 
          borderRadius: 24, 
          padding: 18, 
          borderWidth: 1, 
          borderColor: 'rgba(204,255,0,0.15)', 
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top accent light bar */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: theme.colors.primary }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AICoachLogo size={20} />
              <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text }}>AI Coach Quick Log</AppText>
            </View>
            <View style={{ backgroundColor: 'rgba(204,255,0,0.08)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 9 }}>ONLINE</AppText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(204,255,0,0.2)', paddingRight: 6 }}>
            <TextInput
              style={{ 
                flex: 1, 
                color: theme.colors.text, 
                paddingHorizontal: 16, 
                paddingVertical: 12, 
                fontSize: 13, 
                fontFamily: 'Inter_500Medium' 
              }}
              placeholder="Minum 500ml / Chest day / Nasi goreng 300kal..."
              placeholderTextColor={theme.colors.textMuted}
              value={quickLogText}
              onChangeText={setQuickLogText}
              onSubmitEditing={() => {
                if (quickLogText.trim()) {
                  const { DeviceEventEmitter } = require('react-native');
                  DeviceEventEmitter.emit('open_ai_coach_chat', { message: quickLogText.trim() });
                  setQuickLogText('');
                }
              }}
            />
            <TouchableOpacity 
              onPress={() => {
                if (quickLogText.trim()) {
                  const { DeviceEventEmitter } = require('react-native');
                  DeviceEventEmitter.emit('open_ai_coach_chat', { message: quickLogText.trim() });
                  setQuickLogText('');
                }
              }}
              style={{ 
                backgroundColor: theme.colors.primary, 
                borderRadius: 12, 
                paddingVertical: 8, 
                paddingHorizontal: 16 
              }}
            >
              <AppText weight="bold" style={{ color: '#000', fontSize: 12 }}>Log</AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, backgroundColor: 'rgba(204,255,0,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(204,255,0,0.35)' }}
            onPress={() => setAiModalVisible(true)}
          >
            <AICoachLogo size={20} />
            <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 15, letterSpacing: 0.5 }}>AI Routine Assistant</AppText>
          </TouchableOpacity>
        </View>

        {/* ═══ LEADERBOARD PREVIEW WIDGET ═══ */}
        <View style={{ marginBottom: 24, backgroundColor: theme.colors.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Trophy color={theme.colors.primary} size={18} />
              <AppText weight="bold" style={{ fontSize: 16, color: theme.colors.text }}>Top Athletes</AppText>
            </View>
            <TouchableOpacity onPress={() => setShowLeaderboard(true)} style={{ backgroundColor: 'rgba(204,255,0,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 11 }}>View All</AppText>
            </TouchableOpacity>
          </View>

          {leaderboardData.length === 0 ? (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <AppText style={{ color: theme.colors.textMuted, fontSize: 13 }}>No active athletes yet. Start a session!</AppText>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {leaderboardData.slice(0, 5).map((item, idx) => {
                const isMe = item.isMe;
                return (
                  <View 
                    key={item.id} 
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      padding: 10, 
                      borderRadius: 14, 
                      backgroundColor: isMe ? 'rgba(204,255,0,0.06)' : theme.colors.inputBg,
                      borderWidth: 1,
                      borderColor: isMe ? 'rgba(204,255,0,0.15)' : 'transparent'
                    }}
                  >
                    <View style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: 12, 
                      backgroundColor: idx === 0 ? 'rgba(255,215,0,0.12)' : idx === 1 ? 'rgba(192,192,192,0.12)' : 'rgba(205,127,50,0.12)', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      marginRight: 10
                    }}>
                      <AppText weight="bold" style={{ 
                        fontSize: 12, 
                        color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32' 
                      }}>
                        {idx + 1}
                      </AppText>
                    </View>

                    <View style={{ flex: 1 }}>
                      <AppText weight="bold" style={{ fontSize: 13, color: isMe ? theme.colors.primary : theme.colors.text }}>
                        {item.name} {isMe ? ' (You)' : ''}
                      </AppText>
                      <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 1 }}>
                        {item.volume > 1000 ? `${(item.volume / 1000).toFixed(1)}k` : item.volume} kg volume
                      </AppText>
                    </View>

                    {item.streak > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,69,0,0.06)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                        <Flame color="#FF4500" size={10} />
                        <AppText weight="bold" style={{ color: '#FF4500', fontSize: 10, marginLeft: 2 }}>{item.streak}</AppText>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Show Me at bottom if I am not in top 3 */}
              {(() => {
                const myIdx = leaderboardData.findIndex(x => x.isMe);
                if (myIdx >= 5) {
                  const meItem = leaderboardData[myIdx];
                  return (
                    <>
                      <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 2 }} />
                      <View 
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          padding: 10, 
                          borderRadius: 14, 
                          backgroundColor: 'rgba(204,255,0,0.06)',
                          borderWidth: 1,
                          borderColor: 'rgba(204,255,0,0.15)'
                        }}
                      >
                        <View style={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 12, 
                          backgroundColor: 'rgba(255,255,255,0.08)', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          marginRight: 10
                        }}>
                          <AppText weight="bold" style={{ fontSize: 12, color: theme.colors.textMuted }}>
                            {myIdx + 1}
                          </AppText>
                        </View>

                        <View style={{ flex: 1 }}>
                          <AppText weight="bold" style={{ fontSize: 13, color: theme.colors.primary }}>
                            {meItem.name} (You)
                          </AppText>
                          <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 1 }}>
                            {meItem.volume > 1000 ? `${(meItem.volume / 1000).toFixed(1)}k` : meItem.volume} kg volume
                          </AppText>
                        </View>

                        {meItem.streak > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,69,0,0.06)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                            <Flame color="#FF4500" size={10} />
                            <AppText weight="bold" style={{ color: '#FF4500', fontSize: 10, marginLeft: 2 }}>{meItem.streak}</AppText>
                          </View>
                        )}
                      </View>
                    </>
                  );
                }
                return null;
              })()}
            </View>
          )}
        </View>

        {/* ═══ STATS OVERVIEW ═══ */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <AppText weight="bold" style={{ fontSize: 18 }}>{t('your_overview')}</AppText>
          <TouchableOpacity 
            onPress={() => setAnalyticsVisible(true)} 
            style={{ 
              backgroundColor: 'rgba(0, 240, 255, 0.08)', 
              paddingHorizontal: 12, 
              paddingVertical: 5, 
              borderRadius: 12, 
              borderWidth: 0.5, 
              borderColor: 'rgba(0, 240, 255, 0.2)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}
          >
            <TrendingUp color="#00F0FF" size={12} />
            <AppText weight="bold" style={{ color: '#00F0FF', fontSize: 11 }}>Progress Charts</AppText>
          </TouchableOpacity>
        </View>

        {/* Top Row: Sessions + This Week */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          {/* Main Progress Ring Card */}
          <View style={{ flex: 1.5, backgroundColor: theme.colors.card, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }}>
            <SkiaProgressRing 
              progress={Math.min(stats.thisWeek / 4, 1)} 
              size={120} 
              strokeWidth={12} 
              primaryColor="#CCFF00" 
              secondaryColor="rgba(204,255,0,0.1)"
              title={stats.thisWeek.toString()}
              subtitle="This Week"
              label="Goal: 4"
            />
          </View>

          <View style={{ flex: 1, gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: theme.colors.card, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, position: 'relative', justifyContent: 'center' }}>
              <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(204,255,0,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Flame color={theme.colors.primary} size={14} />
              </View>
              <AppText weight="bold" style={{ fontSize: 22, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{stats.totalWorkouts}</AppText>
              <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>{t('total_sessions')}</AppText>
            </View>

            <View style={{ flex: 1, backgroundColor: theme.colors.card, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, position: 'relative', justifyContent: 'center' }}>
              <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,215,0,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Dumbbell color="#FFD700" size={14} />
              </View>
              <AppText weight="bold" style={{ fontSize: 20, color: theme.colors.text, fontVariant: ['tabular-nums'] }}>{stats.totalVolume > 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}k` : stats.totalVolume}</AppText>
              <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>Total Vol (kg)</AppText>
            </View>
          </View>
        </View>



        {/* ═══ CNS STATUS CARD ═══ */}
        <View style={{ 
          backgroundColor: theme.colors.card, 
          padding: 18, 
          borderRadius: 24, 
          borderWidth: 1, 
          borderColor: theme.colors.border,
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: 16,
          marginBottom: 24
        }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(204,255,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
            <Activity color={theme.colors.primary} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <AppText weight="bold" style={{ fontSize: 15, color: theme.colors.text }}>CNS Readiness</AppText>
              <AppText weight="bold" style={{ fontSize: 12, color: (userProfile?.cns_fatigue || 3) >= 4 ? '#10B981' : ((userProfile?.cns_fatigue || 3) === 3 ? '#CCFF00' : '#FF9F0A') }}>
                Level {userProfile?.cns_fatigue || 3}/5
              </AppText>
            </View>
            <AppText style={{ fontSize: 12, color: theme.colors.textMuted, lineHeight: 16, marginBottom: 8 }}>
              {userProfile?.cns_fatigue
                ? (userProfile.cns_fatigue >= 4 ? 'Siap latihan berat! Tubuh Anda pulih maksimal.' : userProfile.cns_fatigue >= 3 ? 'Kondisi baik. Siap untuk latihan normal.' : 'Kelelahan terdeteksi. Disarankan deload/istirahat.')
                : 'Mulai latihan untuk melacak tingkat kesiapan CNS Anda.'}
            </AppText>
            
            {/* Visual CNS Bar Indicator */}
            <View style={{ flexDirection: 'row', gap: 5 }}>
              {[1, 2, 3, 4, 5].map((level) => {
                const score = userProfile?.cns_fatigue || 3;
                const isLit = level <= score;
                const activeColor = score >= 4 ? '#10B981' : (score === 3 ? '#CCFF00' : '#FF9F0A');
                return (
                  <View 
                    key={level} 
                    style={{ 
                      flex: 1, 
                      height: 6, 
                      borderRadius: 3, 
                      backgroundColor: isLit ? activeColor : 'rgba(255,255,255,0.08)',
                      opacity: isLit ? 1 : 0.4
                    }} 
                  />
                );
              })}
            </View>

            {/* Test Readiness Button */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setModalVisible(true)}
              style={{ marginTop: 14, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              <Gamepad2 color={theme.colors.textMuted} size={16} />
              <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 13 }}>{t('check_cns')}</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ MUSCLE RECOVERY MAP ═══ */}
        <MuscleRecoveryMap completedSessions={completedSessions} session={session} />

        {/* ═══ NUTRITION & WATER DASHBOARD ═══ */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 16 }}>
          <AppText weight="bold" style={{ fontSize: 18 }}>Daily Nutrition</AppText>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setMealPlannerVisible(true)} style={{ backgroundColor: 'rgba(204,255,0,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(204,255,0,0.2)' }}>
              <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 12 }}>🍖 AI Plan</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setManualNutModal(true)}>
              <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 13 }}>+ Log Meal</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ NUTRITION SUMMARY ═══ */}
        <View style={{ backgroundColor: theme.colors.card, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View>
              <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 4 }}>
                Calories Consumed {macroTarget?.target_calories > 0 ? `(Target: ${macroTarget.target_calories} kcal)` : ''}
              </AppText>
              <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 24, fontVariant: ['tabular-nums'] }}>
                {nutritionStats.calories}
                {macroTarget?.target_calories > 0 && <AppText style={{ fontSize: 16, color: theme.colors.textMuted }}> / {macroTarget.target_calories}</AppText>}
                <AppText style={{ fontSize: 14, color: theme.colors.textMuted }}> kcal</AppText>
              </AppText>
              {macroTarget?.target_calories > 0 && (
                <AppText style={{ color: nutritionStats.calories > macroTarget.target_calories ? '#EF4444' : '#CCFF00', fontSize: 11, marginTop: 4 }}>
                  {nutritionStats.calories > macroTarget.target_calories 
                    ? `Over ${nutritionStats.calories - macroTarget.target_calories} kcal` 
                    : `${macroTarget.target_calories - nutritionStats.calories} kcal remaining`}
                </AppText>
              )}
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(204,255,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
              <Flame color={theme.colors.primary} size={20} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 16, marginTop: 16 }}>
            {/* Protein Ring */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <SkiaProgressRing 
                progress={nutritionStats.protein / (macroTarget?.target_protein || 150)} 
                size={68} strokeWidth={6} primaryColor="#CCFF00" secondaryColor="rgba(204,255,0,0.15)"
              />
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text }}>{nutritionStats.protein}g</AppText>
                <AppText style={{ fontSize: 9, color: theme.colors.textMuted }}>PRO</AppText>
              </View>
            </View>

            {/* Carbs Ring */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <SkiaProgressRing 
                progress={nutritionStats.carbs / 250} 
                size={68} strokeWidth={6} primaryColor="#00F0FF" secondaryColor="rgba(0,240,255,0.15)"
              />
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text }}>{nutritionStats.carbs}g</AppText>
                <AppText style={{ fontSize: 9, color: theme.colors.textMuted }}>CARB</AppText>
              </View>
            </View>

            {/* Fats Ring */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <SkiaProgressRing 
                progress={nutritionStats.fats / 70} 
                size={68} strokeWidth={6} primaryColor="#FF9F0A" secondaryColor="rgba(255,159,10,0.15)"
              />
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text }}>{nutritionStats.fats}g</AppText>
                <AppText style={{ fontSize: 9, color: theme.colors.textMuted }}>FAT</AppText>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ TODAY'S MEALS ═══ */}
        {todayMeals.length > 0 && (
          <View style={{ marginBottom: 20, gap: 8 }}>
            {todayMeals.map(meal => (
              <View key={meal.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.card, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border }}>
                <View>
                  <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 14 }}>{meal.food_name}</AppText>
                  <AppText style={{ color: theme.colors.textMuted, fontSize: 12 }}>{meal.calories} kcal · P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g</AppText>
                </View>
                <TouchableOpacity onPress={() => handleDeleteMeal(meal.id)} style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <AppText weight="bold" style={{ color: '#EF4444', fontSize: 11 }}>Delete</AppText>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ═══ WATER TRACKER ═══ */}
        {(() => {
          const dynamicWaterTarget = userProfile?.body_weight ? Math.round(userProfile.body_weight * 35) : 2000;
          const totalGlasses = Math.max(8, Math.ceil(dynamicWaterTarget / 250));
          
          return (
            <View style={{ backgroundColor: theme.colors.card, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
              {/* Subtle water glow background */}
              <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(59, 130, 246, 0.08)' }} />
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(59, 130, 246, 0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                    <Droplet color="#3B82F6" size={22} fill="rgba(59, 130, 246, 0.2)" />
                  </View>
                  <View>
                    <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>Hydration</AppText>
                    <AppText style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 2 }}>
                      <AppText weight="bold" style={{ color: '#3B82F6' }}>{waterMl}</AppText> / {dynamicWaterTarget} ml
                    </AppText>
                  </View>
                </View>
            
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {showWaterInput ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TextInput
                    style={{ 
                      backgroundColor: theme.colors.inputBg, 
                      color: theme.colors.text, 
                      borderRadius: 12, 
                      paddingHorizontal: 8, 
                      paddingVertical: 6, 
                      width: 60, 
                      fontSize: 14, 
                      borderWidth: 1, 
                      borderColor: theme.colors.border,
                      textAlign: 'center',
                      fontFamily: 'Inter_700Bold'
                    }}
                    keyboardType="numeric"
                    placeholder="ml"
                    placeholderTextColor={theme.colors.textMuted}
                    value={customWaterMl}
                    onChangeText={setCustomWaterMl}
                    autoFocus
                  />
                  <TouchableOpacity 
                    onPress={async () => {
                      const val = Number(customWaterMl);
                      if (val > 0) await addWater(val);
                      setCustomWaterMl('');
                      setShowWaterInput(false);
                    }}
                    style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Check color="#FFF" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowWaterInput(false)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center' }}>
                    <AppText style={{ color: theme.colors.textMuted, fontSize: 16 }}>×</AppText>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity onPress={() => addWater(-250)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
                    <AppText weight="bold" style={{ color: theme.colors.textMuted, fontSize: 16 }}>-</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => addWater(250)} style={{ width: 44, height: 36, borderRadius: 12, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}>
                    <AppText weight="bold" style={{ color: '#FFF', fontSize: 16 }}>+250</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowWaterInput(true)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
                    <AppText style={{ color: theme.colors.text, fontSize: 11 }}>✎</AppText>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          {/* Visual Dynamic-Glass representation */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 40, marginTop: 4 }}>
            {[...Array(totalGlasses)].map((_, i) => {
              const glassValue = (i + 1) * 250;
              const isFilled = waterMl >= glassValue;
              const isPartial = waterMl > (i * 250) && waterMl < glassValue;
              const partialPercent = isPartial ? ((waterMl - (i * 250)) / 250) * 100 : 0;
              
              return (
                <View key={i} style={{ 
                  flex: 1, 
                  height: isFilled || isPartial ? 36 : 24, 
                  marginHorizontal: 2,
                  backgroundColor: isFilled ? '#3B82F6' : theme.colors.inputBg, 
                  borderRadius: 16, 
                  borderWidth: 1, 
                  borderColor: isFilled ? '#3B82F6' : 'rgba(59, 130, 246, 0.2)',
                  overflow: 'hidden',
                  justifyContent: 'flex-end',
                  opacity: isFilled || isPartial ? 1 : 0.6
                }}>
                  {isPartial && (
                    <View style={{ width: '100%', height: `${partialPercent}%`, backgroundColor: '#60A5FA', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }} />
                  )}
                </View>
              );
            })}
          </View>
            </View>
          );
        })()}

        {/* ═══ COMMUNITY SOCIAL FEED ═══ */}
        <View style={{ marginTop: 24, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Users color={theme.colors.text} size={20} />
              <AppText weight="bold" style={{ fontSize: 18 }}>Aktivitas Teman</AppText>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
            {leaderboardData && leaderboardData.length > 0 ? (
              leaderboardData.filter(user => user.volume > 0).slice(0, 6).map(feed => {
                let action = "aktif menyelesaikan latihan";
                if (feed.streak >= 3) action = `sedang on fire🔥 (streak ${feed.streak} hari)`;
                else if (feed.volume > 10000) action = "mengangkat beban raksasa";

                return (
                  <View key={feed.id} style={{ 
                    width: 280, marginRight: 16, padding: 16, backgroundColor: theme.colors.card, 
                    borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', gap: 12
                  }}>
                    <Image source={{ uri: feed.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(feed.name)}&background=random&color=fff` }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    <View style={{ flex: 1 }}>
                      <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text, marginBottom: 2 }}>{feed.name} {feed.isMe && '(Anda)'}</AppText>
                      <AppText style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8, lineHeight: 18 }}>{action}</AppText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <AppText weight="bold" style={{ fontSize: 12, color: theme.colors.primary }}>🔥 {feed.volume >= 1000 ? (feed.volume/1000).toFixed(1) + 'k' : feed.volume} kg</AppText>
                        <AppText style={{ fontSize: 11, color: theme.colors.textMuted }}>Hari ini</AppText>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <AppText style={{ color: theme.colors.textMuted, marginVertical: 20 }}>Belum ada aktivitas komunitas hari ini.</AppText>
            )}
            <View style={{ width: 24 }} />
          </ScrollView>
        </View>

        {/* ═══ CUSTOM ROUTINES ═══ */}
        {customRoutines.length > 0 && (
          <View style={{ marginTop: 8, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <AppText weight="bold" style={{ fontSize: 18 }}>My Routines</AppText>
              <View style={{ backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 12 }}>{customRoutines.length}</AppText>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
              {customRoutines.map((routine) => (
                <TouchableOpacity 
                  key={routine.id}
                  activeOpacity={0.8}
                  style={{ 
                    width: 260, 
                    marginRight: 14, 
                    padding: 20, 
                    backgroundColor: theme.colors.card,
                    borderRadius: 20,
                    borderColor: theme.colors.border, 
                    borderWidth: 1,
                    position: 'relative'
                  }}
                  onPress={() => onStartRoutine(routine)}
                  onLongPress={() => {
                    Alert.alert(
                      "Delete Routine 🗑️",
                      `Are you sure you want to delete "${routine.name}"?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => deleteRoutine(routine.id) }
                      ]
                    );
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <AppText weight="bold" style={{ fontSize: 16, color: theme.colors.text, flex: 1, paddingRight: 8 }} numberOfLines={1}>{routine.name}</AppText>
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(204,255,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                      <Zap color={theme.colors.primary} size={14} />
                    </View>
                  </View>
                  <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 14 }}>
                    {routine.exercises.length} exercises
                  </AppText>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {routine.exercises.slice(0, 2).map((ex, i) => (
                      <View key={i} style={{ backgroundColor: theme.colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: theme.colors.border }}>
                        <AppText style={{ fontSize: 10, color: theme.colors.textMuted }} numberOfLines={1}>
                          {ex.name.length > 12 ? ex.name.substring(0, 12) + '…' : ex.name}
                        </AppText>
                      </View>
                    ))}
                    {routine.exercises.length > 2 && (
                      <View style={{ backgroundColor: 'rgba(204,255,0,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(204,255,0,0.15)' }}>
                        <AppText style={{ fontSize: 10, color: theme.colors.primary }}>+{routine.exercises.length - 2}</AppText>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

      </MotiView>

      {/* Interactive CNS Readiness Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Activity color={theme.colors.primary} size={24} style={{ marginRight: 12 }} />
                <AppText weight="bold" style={{ fontSize: 20 }}>CNS Readiness Check</AppText>
              </View>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={{ padding: 8 }}
              >
                <X color={theme.colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
                  Uji Saraf Neuro-Tap 🎮
                </AppText>
                <TouchableOpacity 
                  onPress={() => {
                    cancelReactionGame();
                    setModalVisible(false);
                  }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                >
                  <AppText style={{ color: theme.colors.textMuted, fontSize: 11 }}>Batal</AppText>
                </TouchableOpacity>
              </View>
              <AppText style={{ fontSize: 13, color: theme.colors.textMuted, lineHeight: 18, marginBottom: 16 }}>
                Tes reaksi motorik mengukur status Neuromuskular Anda. Ketuk box secepat mungkin ketika warnanya berkedip NEON HIJAU!
              </AppText>

            {/* The main Tap Target Area */}
            <TouchableOpacity
              activeOpacity={reactionGameState === 'flash' ? 0.6 : 0.9}
              onPress={handleReactionTap}
              style={{
                width: '100%',
                height: 200,
                borderRadius: 20,
                backgroundColor: reactionGameState === 'flash' 
                  ? '#CCFF00' 
                  : (reactionGameState === 'waiting' 
                    ? 'rgba(255, 69, 0, 0.12)' 
                    : 'rgba(255, 255, 255, 0.04)'),
                borderWidth: 1,
                borderColor: reactionGameState === 'flash' 
                  ? '#CCFF00' 
                  : (reactionGameState === 'waiting' 
                    ? '#FF4500' 
                    : theme.colors.border),
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
                marginBottom: 16
              }}
            >
              {reactionGameState === 'idle' && (
                <View style={{ alignItems: 'center' }}>
                  <Gamepad2 color={theme.colors.textMuted} size={48} style={{ marginBottom: 12 }} />
                  <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>Mulai Uji Saraf</AppText>
                  <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>Ketuk box ini untuk memulai tes (3x percobaan)</AppText>
                </View>
              )}
              {reactionGameState === 'waiting' && (
                <View style={{ alignItems: 'center' }}>
                  <Timer color="#FF4500" size={32} style={{ marginBottom: 12 }} />
                  <AppText weight="bold" style={{ color: '#FF4500', fontSize: 16 }}>SIAP-SIAP...</AppText>
                  <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }}>Jangan ketuk sebelum berubah warna!</AppText>
                </View>
              )}
              {reactionGameState === 'flash' && (
                <View style={{ alignItems: 'center' }}>
                  <Zap color="#000" size={54} style={{ marginBottom: 8 }} />
                  <AppText weight="bold" style={{ color: '#000', fontSize: 24 }}>KETUK SEKARANG!</AppText>
                </View>
              )}
              {reactionGameState === 'result' && (
                <View style={{ alignItems: 'center' }}>
                  <Trophy color="#CCFF00" size={40} style={{ marginBottom: 10 }} />
                  <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 18 }}>Hasil Uji Saraf</AppText>
                  <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
                    {reactionTrials.map((t, i) => (
                      <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 0.5, borderColor: theme.colors.border }}>
                        <AppText style={{ color: theme.colors.textMuted, fontSize: 11 }}>#{i+1}: <AppText weight="bold" style={{ color: theme.colors.text }}>{t}ms</AppText></AppText>
                      </View>
                    ))}
                  </View>
                  <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 15, marginTop: 2 }}>{reactionMsg}</AppText>
                </View>
              )}
            </TouchableOpacity>

            {/* Secondary game message text info */}
            {reactionGameState !== 'result' && (
              <View style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, borderWidth: 0.5, borderColor: theme.colors.border, alignItems: 'center', marginBottom: 16 }}>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center' }}>{reactionMsg}</AppText>
              </View>
            )}

            {reactionGameState === 'result' && (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={startReactionGame}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    paddingVertical: 14,
                    borderRadius: 12,
                    borderWidth: 0.5,
                    borderColor: theme.colors.border,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <RefreshCw color={theme.colors.text} size={14} />
                  <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 14 }}>Ulangi Tes</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={applyReactionResult}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: '#CCFF00',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center'
                  }}
                >
                  <AppText weight="bold" style={{ color: '#000', fontSize: 14 }}>Terapkan Skor</AppText>
                </TouchableOpacity>
              </View>
            )}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.btnPrimary, { paddingVertical: 18, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }]}
              onPress={handleStartWorkout}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={theme.colors.background} /> : <AppText weight="bold" style={[styles.btnPrimaryText, { fontSize: 16 }]}>Confirm & Start</AppText>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnGhost, { marginTop: 12, paddingVertical: 16 }]} onPress={() => setModalVisible(false)}>
              <AppText weight="bold" style={{ color: theme.colors.textMuted, fontSize: 15, textAlign: 'center' }}>Cancel</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      </SmoothScrollView>

      {/* Floating AI Coach Chat Bubble */}
      <AIChatBubble />

      {/* AI Routine Generator Modal */}
      <AIRoutineModal 
        visible={aiModalVisible} 
        onClose={() => setAiModalVisible(false)} 
        onStartRoutine={onStartRoutine}
        cnsScore={currentCnsScore}
        isHome={isHome}
        equipmentInventory={equipmentInventory}
        session={session}
      />

      <SocialLeaderboardModal
        visible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentUserProfile={userProfile}
        currentUserStats={stats}
      />

      <ProgressAnalyticsModal
        visible={analyticsVisible}
        onClose={() => setAnalyticsVisible(false)}
        userId={session?.user?.id}
        dbReady={dbReady}
      />

      {/* MANUAL NUTRITION MODAL */}
      <Modal visible={manualNutModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <AppText weight="bold" style={{ fontSize: 20 }}>Manual Meal Entry</AppText>
              <TouchableOpacity onPress={() => setManualNutModal(false)}>
                <CheckCircle2 color={theme.colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            {/* AI Fast Log */}
            <View style={{ marginBottom: 20, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(204,255,0,0.2)' }}>
              <AppText weight="bold" style={{ fontSize: 13, color: theme.colors.primary, marginBottom: 6 }}>✨ AI Fast Log (Tulis Bebas)</AppText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={{ 
                    flex: 1, 
                    backgroundColor: theme.colors.inputBg, 
                    color: theme.colors.text, 
                    borderRadius: 10, 
                    paddingHorizontal: 12, 
                    paddingVertical: 10, 
                    fontSize: 14, 
                    borderWidth: 1, 
                    borderColor: theme.colors.border 
                  }}
                  placeholder="cth: dada ayam bakar 200g plus nasi"
                  placeholderTextColor={theme.colors.textMuted}
                  value={aiFoodInput}
                  onChangeText={setAiFoodInput}
                />
                <TouchableOpacity 
                  disabled={aiLoading}
                  onPress={handleAIFoodParse}
                  style={{ 
                    backgroundColor: theme.colors.primary, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    paddingHorizontal: 16, 
                    borderRadius: 10,
                    flexDirection: 'row'
                  }}
                >
                  {aiLoading ? (
                    <>
                      <ActivityIndicator size="small" color="#000" style={{ marginRight: 6 }} />
                      <AppText weight="bold" style={{ color: '#000', fontSize: 11, maxWidth: 90 }} numberOfLines={1}>{aiLoadingText}</AppText>
                    </>
                  ) : (
                    <AppText weight="bold" style={{ color: '#000', fontSize: 13 }}>Gunakan AI</AppText>
                  )}
                </TouchableOpacity>
              </View>
              <AppText style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 6, lineHeight: 14 }}>
                AI akan otomatis mengestimasi kalori & makro nutrisi lalu mengisi form di bawah.
              </AppText>
            </View>
            
            <AppText style={{ color: theme.colors.textMuted, marginBottom: 8, fontSize: 12 }}>Food Name</AppText>
            <TextInput
              style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border }}
              placeholder="e.g. Nasi Goreng"
              placeholderTextColor={theme.colors.textMuted}
              value={manualNutForm.food}
              onChangeText={t => setManualNutForm(prev => ({...prev, food: t}))}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <AppText style={{ color: theme.colors.textMuted, marginBottom: 8, fontSize: 12 }}>Calories (kcal)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border }}
                  keyboardType="numeric" placeholder="0" placeholderTextColor={theme.colors.textMuted}
                  value={manualNutForm.cal} onChangeText={t => setManualNutForm(prev => ({...prev, cal: t}))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ color: theme.colors.textMuted, marginBottom: 8, fontSize: 12 }}>Protein (g)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border }}
                  keyboardType="numeric" placeholder="0" placeholderTextColor={theme.colors.textMuted}
                  value={manualNutForm.p} onChangeText={t => setManualNutForm(prev => ({...prev, p: t}))}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
              <View style={{ flex: 1 }}>
                <AppText style={{ color: theme.colors.textMuted, marginBottom: 8, fontSize: 12 }}>Carbs (g)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border }}
                  keyboardType="numeric" placeholder="0" placeholderTextColor={theme.colors.textMuted}
                  value={manualNutForm.c} onChangeText={t => setManualNutForm(prev => ({...prev, c: t}))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ color: theme.colors.textMuted, marginBottom: 8, fontSize: 12 }}>Fats (g)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border }}
                  keyboardType="numeric" placeholder="0" placeholderTextColor={theme.colors.textMuted}
                  value={manualNutForm.f} onChangeText={t => setManualNutForm(prev => ({...prev, f: t}))}
                />
              </View>
            </View>

            <TouchableOpacity 
              disabled={loading}
              style={{ backgroundColor: theme.colors.primary, padding: 18, borderRadius: 16, alignItems: 'center' }}
              onPress={handleLogManualNutrition}
            >
              {loading ? <ActivityIndicator color="#000" /> : <AppText weight="bold" style={{ color: '#000', fontSize: 16 }}>Save Meal</AppText>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AIMealPlanModal 
        visible={mealPlannerVisible}
        onClose={() => setMealPlannerVisible(false)}
        session={session}
        userProfile={userProfile}
        onApplyTarget={applyMacroTarget}
      />
      
      {/* Sticky Bottom Ad Banner */}
      <DummyAdBanner />
    </View>
  );
}
