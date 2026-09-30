import React, { useState, useEffect, useCallback } from 'react';
import { View, SectionList, ActivityIndicator, RefreshControl, Dimensions, TouchableOpacity, Alert, Modal, ScrollView, Share, Platform, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clock, Dumbbell, Trash2, Calendar, Flame, AlertCircle, TrendingUp, ChevronRight, ChevronLeft, X, CheckCircle2, RotateCcw, Share2, Layers, AlertTriangle, Droplets, Info } from 'lucide-react-native';
import WorkoutDetailModal from '../components/history/WorkoutDetailModal';
import NutritionDetailModal from '../components/history/NutritionDetailModal';
import WaterDetailModal from '../components/history/WaterDetailModal';
import DeleteConfirmModal from '../components/history/DeleteConfirmModal';
import HistoryVolumeChart from '../components/history/HistoryVolumeChart';
import { AppText, theme, styles } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeSelect } from '../supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatMonthKey = (d) => {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const formatDateStr = (d) => {
  return `${DAYS[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
};

const formatTimeStr = (d) => {
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

export default function HistoryScreen({ session, dbReady, onStartWorkout, onStartRoutine, onBack }) {
  const { t } = useTranslation();
  const { graphicsQuality } = useTheme();
  const [historyData, setHistoryData] = useState([]);
  const [nutritionHistory, setNutritionHistory] = useState([]);
  const [waterHistory, setWaterHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('workouts'); // 'workouts' | 'nutrition' | 'water'
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ visible: false, type: null, id: null });

  // Detail Modal States
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedNutrition, setSelectedNutrition] = useState(null);
  const [selectedWater, setSelectedWater] = useState(null);

  useEffect(() => {
    fetchHistory();
    const sub = DeviceEventEmitter.addListener('activity_logged', () => {
      fetchHistory();
    });
    return () => sub.remove();
  }, [session]);

  const fetchHistory = async () => {
    if (!session?.user?.id) {
      setHistoryData([]);
      setNutritionHistory([]);
      setWaterHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Workout Sessions with resilient fallback
      let { data: sessions, error: fetchErr } = await safeSelect('workout_sessions', {
        columns: '*, workout_sets(*, exercises(name, muscle_group))',
        filters: { user_id: session.user.id, is_completed: true },
        order: { column: 'started_at', ascending: false },
      });

      // Defensive fallback if relation join failed
      if (fetchErr && fetchErr.message?.includes('relationship')) {
        const fallbackRes = await safeSelect('workout_sessions', {
          columns: '*, workout_sets(*)',
          filters: { user_id: session.user.id, is_completed: true },
          order: { column: 'started_at', ascending: false },
        });
        sessions = fallbackRes.data;
        fetchErr = fallbackRes.error;
      }

      if (fetchErr) {
        if (fetchErr.message?.includes('does not exist')) {
          setError('Database not set up. Run setup_database.sql in Supabase SQL Editor.');
        } else {
          setError(`Failed to load history: ${fetchErr.message}`);
        }
        setHistoryData([]);
      } else if (!sessions || sessions.length === 0) {
        setHistoryData([]);
        setChartData([]);
      } else {
        // Prepare Chart Data (Last 7 sessions reversed)
        const recentSessions = [...sessions].reverse().slice(-7);
        const chartPoints = recentSessions.map(s => {
          let vol = 0;
          (s.workout_sets || []).forEach(set => {
            const isCompleted = set.is_checked === true || (set.is_checked !== false && ((Number(set.weight_kg) || 0) > 0 || (Number(set.reps) || 0) > 0));
            if (isCompleted) vol += ((Number(set.weight_kg) || 0) * (Number(set.reps) || 0));
          });
          
          const safeStr = (s.started_at || '').replace(' ', 'T');
          const dateObj = new Date(safeStr);
          const dateLabel = isNaN(dateObj.getTime()) ? '' : `${dateObj.getDate()}/${dateObj.getMonth()+1}`;
          
          return { vol: Math.round(vol), date: dateLabel };
        }).filter(item => item.vol > 0);
        setChartData(chartPoints);

        // Group workouts by month
        const groups = {};
        sessions.forEach(s => {
          let totalVolume = 0;
          let completedSets = 0;

          const rawSets = s.workout_sets || [];
          rawSets.forEach(set => {
            const isCompleted = set.is_checked === true || (set.is_checked !== false && ((Number(set.weight_kg) || 0) > 0 || (Number(set.reps) || 0) > 0));
            if (isCompleted) {
              totalVolume += ((Number(set.weight_kg) || 0) * (Number(set.reps) || 0));
              completedSets++;
            }
          });

          const safeStr = (s.started_at || '').replace(' ', 'T');
          const dateObj = new Date(safeStr);
          if (isNaN(dateObj.getTime())) return;
          const monthKey = formatMonthKey(dateObj);
          const dateStr = formatDateStr(dateObj);
          const timeStr = formatTimeStr(dateObj);

          if (!groups[monthKey]) groups[monthKey] = [];
          groups[monthKey].push({
            id: s.id,
            split_name: s.split_name || 'Workout Session',
            date: dateStr,
            time: timeStr,
            totalVolume: Math.round(totalVolume),
            completedSets,
            workout_sets: rawSets,
            started_at: s.started_at,
          });
        });

        const sections = Object.entries(groups).map(([title, data]) => ({ title, data }));
        setHistoryData(sections);
      }

      // 2. Fetch Nutrition Logs
      const { data: nutritionLogs, error: nutErr } = await safeSelect('nutrition_logs', {
        filters: { user_id: session.user.id },
        order: { column: 'created_at', ascending: false }
      });

      if (!nutErr && nutritionLogs) {
        const groups = {};
        nutritionLogs.forEach(n => {
          const safeStr = (n.created_at || '').replace(' ', 'T');
          const dateObj = new Date(safeStr);
          if (isNaN(dateObj.getTime())) return;
          const monthKey = formatMonthKey(dateObj);
          const dateStr = formatDateStr(dateObj);
          const timeStr = formatTimeStr(dateObj);

          if (!groups[monthKey]) groups[monthKey] = [];
          groups[monthKey].push({
            id: n.id,
            food_name: n.food_name,
            calories: n.calories,
            protein: n.protein,
            carbs: n.carbs,
            fats: n.fats,
            date: dateStr,
            time: timeStr,
            created_at: n.created_at,
          });
        });
        const sections = Object.entries(groups).map(([title, data]) => ({ title, data }));
        setNutritionHistory(sections);
      }

      // 3. Fetch Water History from AsyncStorage
      const waterHistoryStr = await AsyncStorage.getItem('water_history');
      if (waterHistoryStr) {
        let parsed = {};
        try {
          parsed = JSON.parse(waterHistoryStr) || {};
        } catch (e) {
          parsed = {};
        }
        
        if (parsed && typeof parsed === 'object') {
          const groups = {};
          // Sort keys descending
          const sortedEntries = Object.entries(parsed).sort((a, b) => b[0].localeCompare(a[0]));
          
          sortedEntries.forEach(([dateStr, ml]) => {
            if (ml <= 0 || !dateStr) return;
            const parts = dateStr.split('-');
            if (parts.length !== 3) return;
            const [yr, mn, dy] = parts;
            const dateObj = new Date(Number(yr), Number(mn) - 1, Number(dy));
            if (isNaN(dateObj.getTime())) return;

            const monthKey = formatMonthKey(dateObj);
            const displayDateStr = formatDateStr(dateObj);

            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push({
              id: dateStr,
              ml,
              date: displayDateStr,
              time: 'Daily Total'
            });
          });
          const sections = Object.entries(groups).map(([title, data]) => ({ title, data }));
          setWaterHistory(sections);
        } else {
          setWaterHistory([]);
        }
      } else {
        setWaterHistory([]);
      }

    } catch (e) {
      setError(`Error: ${e.message}`);
    }

    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [session]);

  // ─── Repeat Workout Handler ───
  const handleRepeatWorkout = (sessionItem) => {
    if (!sessionItem) return;
    try {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch(e){}

    let raw = sessionItem.split_name || 'Workout';
    const parenMatch = raw.match(/\((.*?)\)/);
    if (parenMatch && parenMatch[1].includes(',')) {
      raw = parenMatch[1];
    }
    // Clean exercise names from brackets like "Bench Press [Chest]" -> "Bench Press"
    const exNames = raw
      .split(',')
      .map(s => s.replace(/\[.*?\]/g, '').trim())
      .filter(Boolean);

    if (typeof onStartRoutine === 'function' && exNames.length > 0) {
      // Calculate actual number of sets per exercise if workout_sets available
      const sets = sessionItem.workout_sets || [];
      const setsCountPerEx = {};
      let currentExIdx = 0;
      let prevSetIndex = 0;
      let prevExId = null;

      sets.forEach((st, idx) => {
        let exName = st.exercise_name || st.exercises?.name;
        if (!exName) {
          const curSetNum = Number(st.set_index) || 1;
          const curExId = st.exercise_id || null;
          if (idx > 0) {
            const exIdChanged = curExId && prevExId && curExId !== prevExId;
            const setIndexReset = curSetNum <= prevSetIndex || curSetNum === 1;
            if (exIdChanged || setIndexReset) {
              if (currentExIdx < exNames.length - 1) currentExIdx++;
            }
          }
          exName = exNames[currentExIdx] || exNames[0];
          prevSetIndex = curSetNum;
          prevExId = curExId;
        }
        setsCountPerEx[exName] = (setsCountPerEx[exName] || 0) + 1;
      });

      onStartRoutine({
        name: splitStr,
        exercises: exNames.map(name => ({
          name,
          numSets: setsCountPerEx[name] || 3
        }))
      });
    } else if (typeof onStartWorkout === 'function') {
      onStartWorkout();
    }
  };

  // ─── Share Workout Session ───
  const handleShareSession = async (sess) => {
    if (!sess) return;
    try {
      const setsCount = sess.completedSets || 0;
      const volCount = sess.totalVolume || 0;
      const text = `🏋️ GymVault Workout Log:
📌 ${sess.split_name}
📅 ${sess.date} · ${sess.time}
🔥 Total Volume: ${volCount > 1000 ? `${(volCount/1000).toFixed(1)}k` : volCount} kg
⚡ Sets Completed: ${setsCount} Sets
Tracked with GymVault`;

      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          try {
            await navigator.share({ title: 'GymVault Workout Log', text });
            return;
          } catch(e) {}
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
          Alert.alert('Tersalin! 📋', 'Ringkasan latihan berhasil disalin ke clipboard.');
          return;
        }
      }
      await Share.share({ message: text, title: 'GymVault Workout Log' });
    } catch(e) {}
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  // ─── Delete Handlers ───
  const handleDeleteWorkout = (id) => {
    setDeleteConfirm({ visible: true, type: 'workout', id });
  };

  const handleDeleteNutrition = (id) => {
    setDeleteConfirm({ visible: true, type: 'nutrition', id });
  };

  const handleDeleteWater = (dateStr) => {
    setDeleteConfirm({ visible: true, type: 'water', id: dateStr });
  };

  const executeDelete = async () => {
    const { type, id } = deleteConfirm;
    setDeleteConfirm({ visible: false, type: null, id: null });
    
    // Close detail modals if deleted item was open
    if (type === 'workout' && selectedSession?.id === id) setSelectedSession(null);
    if (type === 'nutrition' && selectedNutrition?.id === id) setSelectedNutrition(null);
    if (type === 'water' && selectedWater?.id === id) setSelectedWater(null);

    try {
      const { supabase } = require('../supabaseClient');
      
      if (type === 'workout') {
        try {
          await supabase.from('workout_sets').delete().eq('session_id', id);
        } catch(e){}

        const { data: sessionDeleted, error: sessionError } = await supabase.from('workout_sessions').delete().eq('id', id).select();
        if (sessionError) throw sessionError;
        
        if (!sessionDeleted || sessionDeleted.length === 0) {
          Alert.alert("Gagal", "Sesi latihan tidak ditemukan atau akses ditolak (RLS).");
          return;
        }
        
        setHistoryData(prev => prev.map(section => ({
          ...section,
          data: section.data.filter(item => item.id !== id)
        })).filter(section => section.data.length > 0));
        
        const { DeviceEventEmitter } = require('react-native');
        DeviceEventEmitter.emit('activity_logged');
      } else if (type === 'nutrition') {
        const { data: nutDeleted, error: nutError } = await supabase.from('nutrition_logs').delete().eq('id', id).select();
        if (nutError) throw nutError;
        
        if (!nutDeleted || nutDeleted.length === 0) {
          Alert.alert("Gagal", "Data nutrisi tidak ditemukan atau akses ditolak (RLS).");
          return;
        }

        setNutritionHistory(prev => prev.map(section => ({
          ...section,
          data: section.data.filter(item => item.id !== id)
        })).filter(section => section.data.length > 0));
        
        const { DeviceEventEmitter } = require('react-native');
        DeviceEventEmitter.emit('activity_logged');
      } else if (type === 'water') {
        const dateStr = id;
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const waterHistoryStr = await AsyncStorage.getItem('water_history');
        if (waterHistoryStr) {
          let parsed = {};
          try {
            parsed = JSON.parse(waterHistoryStr) || {};
          } catch (e) {
            parsed = {};
          }
          
          if (parsed && typeof parsed === 'object') {
            delete parsed[dateStr];
            await AsyncStorage.setItem('water_history', JSON.stringify(parsed));
            
            // If today, also sync daily_water_ml
            const year = new Date().getFullYear();
            const month = String(new Date().getMonth() + 1).padStart(2, '0');
            const day = String(new Date().getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            if (dateStr === todayStr) {
              await AsyncStorage.removeItem('daily_water_ml');
            }
            
            setWaterHistory(prev => prev.map(section => ({
              ...section,
              data: section.data.filter(item => item.id !== dateStr)
            })).filter(section => section.data.length > 0));
            
            const { DeviceEventEmitter } = require('react-native');
            DeviceEventEmitter.emit('activity_logged');
          }
        }
      }
    } catch (e) {
      Alert.alert("Error", `Gagal menghapus: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ─── Chart Renderer ───
  const renderChart = () => {
    if (activeTab !== 'workouts') return null;
    return <HistoryVolumeChart chartData={chartData} />;
  };

  const getActiveSections = () => {
    if (activeTab === 'workouts') return historyData;
    if (activeTab === 'nutrition') return nutritionHistory;
    return waterHistory;
  };

    const renderItem = ({ item }) => {
    if (activeTab === 'workouts') {
      const isZeroData = item.completedSets === 0 && item.totalVolume === 0;

      return (
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => setSelectedSession(item)}
          style={[
            styles.card, 
            { 
              marginBottom: 12,
              borderWidth: 1,
              borderColor: isZeroData ? 'rgba(245, 158, 11, 0.3)' : theme.colors.border,
              cursor: 'pointer',
            }
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Lihat rincian sesi latihan ${item.split_name}`}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                <AppText weight="bold" style={{ fontSize: 16 }}>{item.split_name}</AppText>
                {isZeroData && (
                  <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    <AppText style={{ fontSize: 10, color: '#F59E0B', fontWeight: 'bold' }}>⚠️ 0 Sets Tersimpan</AppText>
                  </View>
                )}
              </View>

              <AppText style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 12 }}>
                {item.date} · {item.time}
              </AppText>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <View style={{ backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center' }}>
                  <Dumbbell color={theme.colors.primary} size={12} style={{ marginRight: 4 }} />
                  <AppText weight="bold" tabular style={{ fontSize: 12, color: theme.colors.text }}>
                    {item.totalVolume > 1000 ? `${(item.totalVolume / 1000).toFixed(1)}k` : item.totalVolume} kg
                  </AppText>
                </View>
                <View style={{ backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border }}>
                  <AppText weight="bold" tabular style={{ fontSize: 12, color: theme.colors.text }}>
                    {item.completedSets} {t('sets')}
                  </AppText>
                </View>
                <AppText style={{ fontSize: 11, color: theme.colors.primary, marginLeft: 2 }}>
                  Ketuk untuk rincian →
                </AppText>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity 
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleDeleteWorkout(item.id);
                }}
                style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(239, 68, 68, 0.2)' }}
                accessibilityLabel="Hapus sesi"
              >
                <Trash2 color="#EF4444" size={14} />
              </TouchableOpacity>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(204, 255, 0, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                <ChevronRight color={theme.colors.primary} size={18} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (activeTab === 'nutrition') {
      return (
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => setSelectedNutrition(item)}
          style={[styles.card, { marginBottom: 12, cursor: 'pointer' }]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <AppText weight="bold" style={{ fontSize: 16, marginBottom: 4 }}>{item.food_name}</AppText>
              <AppText style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 12 }}>
                {item.date} · {item.time}
              </AppText>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <View style={{ backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border }}>
                  <AppText weight="bold" tabular style={{ fontSize: 12, color: theme.colors.text }}>
                    {item.calories} kcal
                  </AppText>
                </View>
                {item.protein > 0 && (
                  <View style={{ backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border }}>
                    <AppText style={{ fontSize: 11, color: theme.colors.textMuted }}>P: <AppText weight="bold" style={{ color: '#38BDF8' }}>{item.protein}g</AppText></AppText>
                  </View>
                )}
                {item.carbs > 0 && (
                  <View style={{ backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border }}>
                    <AppText style={{ fontSize: 11, color: theme.colors.textMuted }}>C: <AppText weight="bold" style={{ color: '#34D399' }}>{item.carbs}g</AppText></AppText>
                  </View>
                )}
                {item.fats > 0 && (
                  <View style={{ backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border }}>
                    <AppText style={{ fontSize: 11, color: theme.colors.textMuted }}>F: <AppText weight="bold" style={{ color: '#FBBF24' }}>{item.fats}g</AppText></AppText>
                  </View>
                )}
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity 
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleDeleteNutrition(item.id);
                }}
                style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <Trash2 color="#EF4444" size={14} />
              </TouchableOpacity>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(251, 191, 36, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                <AppText style={{ fontSize: 18 }}>🥗</AppText>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Water tab
    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => setSelectedWater(item)}
        style={[styles.card, { marginBottom: 12, cursor: 'pointer' }]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText weight="bold" style={{ fontSize: 16, marginBottom: 4 }}>{item.ml} ml</AppText>
            <AppText style={{ fontSize: 13, color: theme.colors.textMuted }}>
              {item.date}
            </AppText>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity 
              onPress={(e) => {
                e?.stopPropagation?.();
                handleDeleteWater(item.id);
              }}
              style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              <Trash2 color="#EF4444" size={14} />
            </TouchableOpacity>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
              <AppText style={{ fontSize: 18 }}>💧</AppText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const activeSections = getActiveSections();

  return (
    <View style={styles.screen}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {typeof onBack === 'function' && (
          <TouchableOpacity 
            onPress={onBack}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}
            accessibilityLabel="Kembali ke profil"
            accessibilityRole="button"
          >
            <ChevronLeft color={theme.colors.text} size={20} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <AppText weight="bold" style={{ fontSize: 24, marginBottom: 4 }}>{t('history_title')}</AppText>
          <AppText style={{ color: theme.colors.textMuted }}>Review your workouts, water, and nutrition history.</AppText>
        </View>
      </View>

      {/* Tabs Switcher */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 24, marginBottom: 16 }}>
        {[
          { key: 'workouts', label: '🏋️ Latihan' },
          { key: 'nutrition', label: '🥗 Makanan' },
          { key: 'water', label: '💧 Air Minum' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeTab === tab.key ? theme.colors.primary : theme.colors.card,
              borderWidth: 1,
              borderColor: activeTab === tab.key ? theme.colors.primary : theme.colors.border,
            }}
          >
            <AppText weight="bold" style={{ color: activeTab === tab.key ? theme.colors.background : theme.colors.text, fontSize: 12 }}>
              {tab.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {renderChart()}

      {/* Error Banner */}
      {error && (
        <View style={{ marginHorizontal: 24, marginBottom: 12, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#EF4444', borderRadius: 10, padding: 14, flexDirection: 'row', gap: 10 }}>
          <AlertCircle color="#EF4444" size={18} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <AppText weight="bold" style={{ fontSize: 13, color: '#EF4444', marginBottom: 2 }}>Error</AppText>
            <AppText style={{ fontSize: 12, color: theme.colors.textMuted, lineHeight: 18 }}>{error}</AppText>
          </View>
        </View>
      )}

      <SectionList
        sections={activeSections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={activeSections.length === 0 ? { flex: 1, justifyContent: 'center' } : { paddingHorizontal: 24, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={graphicsQuality !== 'high'}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: theme.colors.card, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, marginHorizontal: 20, marginTop: 40 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(212,245,60,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Calendar color={theme.colors.primary} size={32} />
            </View>
            <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.text, marginBottom: 6, textAlign: 'center' }}>
              {activeTab === 'workouts' ? 'Belum Ada Sesi Latihan' : activeTab === 'nutrition' ? 'Belum Ada Catatan Makanan' : 'Belum Ada Catatan Air'}
            </AppText>
            <AppText style={{ fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280, marginBottom: 20 }}>
              {activeTab === 'workouts' ? 'Selesaikan sesi latihan pertamamu untuk melihat grafik volume & riwayat angkatan di sini.' : 'Catat asupan harianmu untuk memonitor progres nutrisi.'}
            </AppText>
            {activeTab === 'workouts' && (
              <TouchableOpacity
                onPress={() => {
                  try {
                    const Haptics = require('expo-haptics');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch(e){}
                  if (typeof onStartWorkout === 'function') onStartWorkout();
                }}
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                }}
                accessibilityLabel="Mulai latihan pertama Anda sekarang"
                accessibilityRole="button"
              >
                <Dumbbell color="#000" size={16} />
                <AppText weight="bold" style={{ color: '#000', fontSize: 14 }}>Mulai Latihan Sekarang</AppText>
              </TouchableOpacity>
            )}
          </View>
        )}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 }}>
            <AppText weight="bold" style={{ fontSize: 15, color: theme.colors.primary }}>{title}</AppText>
            <AppText style={{ fontSize: 12, color: theme.colors.textMuted }}>{data.length} item</AppText>
          </View>
        )}
        renderItem={renderItem}
      />

      {/* ─── WORKOUT DETAIL MODAL ─── */}
      <WorkoutDetailModal
        visible={!!selectedSession}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onRepeat={handleRepeatWorkout}
        onShare={handleShareSession}
        onDelete={handleDeleteWorkout}
      />

      {/* ─── NUTRITION DETAIL MODAL ─── */}
      <NutritionDetailModal
        visible={!!selectedNutrition}
        nutrition={selectedNutrition}
        onClose={() => setSelectedNutrition(null)}
        onDelete={handleDeleteNutrition}
      />

      {/* ─── WATER DETAIL MODAL ─── */}
      <WaterDetailModal
        visible={!!selectedWater}
        water={selectedWater}
        onClose={() => setSelectedWater(null)}
        onDelete={handleDeleteWater}
      />

      {/* ─── CUSTOM DELETE CONFIRMATION MODAL ─── */}
      <DeleteConfirmModal
        visible={deleteConfirm.visible}
        onCancel={() => setDeleteConfirm({ visible: false, type: null, id: null })}
        onConfirm={executeDelete}
      />
    </View>
  );
}
