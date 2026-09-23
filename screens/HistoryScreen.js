import React, { useState, useEffect, useCallback } from 'react';
import { View, SectionList, ActivityIndicator, RefreshControl, Dimensions, TouchableOpacity, Alert, Modal, ScrollView, Share } from 'react-native';
import { Clock, Dumbbell, Trash2, Calendar, Flame, AlertCircle, TrendingUp, ChevronRight, X, CheckCircle2, RotateCcw, Share2, Layers, AlertTriangle, Droplets, Info } from 'lucide-react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
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

export default function HistoryScreen({ session, dbReady, onStartWorkout, onStartRoutine }) {
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
    const { DeviceEventEmitter } = require('react-native');
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
        columns: '*, workout_sets(id, set_index, weight_kg, reps, is_checked, exercise_id, exercises(name, muscle_group))',
        filters: { user_id: session.user.id, is_completed: true },
        order: { column: 'started_at', ascending: false },
      });

      // Defensive fallback if relation join failed
      if (fetchErr && fetchErr.message?.includes('relationship')) {
        const fallbackRes = await safeSelect('workout_sessions', {
          columns: '*, workout_sets(id, set_index, weight_kg, reps, is_checked, exercise_id)',
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
          const dateObj = new Date(n.created_at);
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

    const splitStr = sessionItem.split_name || 'Workout';
    // Clean exercise names from brackets like "Bench Press [Chest]" -> "Bench Press"
    const exNames = splitStr
      .split(',')
      .map(s => s.replace(/\[.*?\]/g, '').trim())
      .filter(Boolean);

    if (typeof onStartRoutine === 'function' && exNames.length > 0) {
      onStartRoutine({
        name: splitStr,
        exercises: exNames.map(name => ({
          name,
          numSets: 3
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
    if (activeTab !== 'workouts' || !chartData || chartData.length < 2) return null;
    
    const volumes = chartData.map(d => d.vol);
    const max = Math.max(...volumes);
    const min = Math.min(...volumes);
    const range = max - min || 1;
    const totalVol = volumes.reduce((a, b) => a + b, 0);
    const avgVol = Math.round(totalVol / volumes.length);
    
    const screenW = Dimensions.get('window').width;
    const padH = 24;
    const cardPad = 20;
    const w = screenW - (padH * 2) - (cardPad * 2);
    const chartH = 90;
    const dateAreaH = 24;
    const svgH = chartH + dateAreaH + 10;
    
    const getY = (vol) => {
      if (max === min) return chartH / 2;
      return chartH - ((vol - min) / range) * (chartH * 0.75) - 12;
    };
    
    const points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1)) * w;
      return `${x},${getY(d.vol)}`;
    }).join(' L ');
    
    const fmtVol = (v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`;
    
    return (
      <View style={{ marginHorizontal: padH, marginBottom: 20, backgroundColor: theme.colors.card, borderRadius: 20, padding: cardPad, borderWidth: 1, borderColor: theme.colors.border }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(204,255,0,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
              <TrendingUp color={theme.colors.primary} size={18} />
            </View>
            <View>
              <AppText weight="bold" style={{ fontSize: 15 }}>Volume Progression</AppText>
              <AppText style={{ fontSize: 11, color: theme.colors.textMuted }}>{chartData.length} sesi terakhir</AppText>
            </View>
          </View>
        </View>
        
        {/* Summary Stats Row */}
        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
          {[
            { label: 'Total', value: `${fmtVol(totalVol)} kg` },
            { label: 'Rata-rata', value: `${fmtVol(avgVol)} kg` },
            { label: 'Tertinggi', value: `${fmtVol(max)} kg` },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
              <AppText style={{ fontSize: 10, color: theme.colors.textMuted, marginBottom: 2 }}>{s.label}</AppText>
              <AppText weight="bold" tabular style={{ fontSize: 13, color: theme.colors.primary }}>{s.value}</AppText>
            </View>
          ))}
        </View>

        {/* SVG Chart */}
        <Svg width="100%" height={svgH} viewBox={`-8 -20 ${w+16} ${svgH+20}`}>
          <Defs>
            <LinearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.25" />
              <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>
          
          {/* Gradient fill area */}
          <Path 
            d={`M 0,${chartH} L ${points} L ${w},${chartH} Z`} 
            fill="url(#volGrad)" 
          />
          {/* Line */}
          <Path 
            d={`M ${points}`} 
            fill="none" 
            stroke={theme.colors.primary} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Points + Date labels */}
          {chartData.map((d, i) => {
            const cx = (i / (chartData.length - 1)) * w;
            const cy = getY(d.vol);
            const anchor = i === 0 ? "start" : i === chartData.length - 1 ? "end" : "middle";
            return (
              <React.Fragment key={i}>
                <Circle cx={cx} cy={cy} r="5" fill={theme.colors.background} stroke={theme.colors.primary} strokeWidth="2.5" />
                <SvgText x={cx} y={cy - 10} fontSize="9" fill={theme.colors.text} textAnchor={anchor} fontWeight="bold">
                  {fmtVol(d.vol)}
                </SvgText>
                <SvgText x={cx} y={chartH + dateAreaH} fontSize="9" fill={theme.colors.textMuted} textAnchor={anchor}>
                  {d.date}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    );
  };

  const getActiveSections = () => {
    if (activeTab === 'workouts') return historyData;
    if (activeTab === 'nutrition') return nutritionHistory;
    return waterHistory;
  };

  // ─── Render Workout Sets in Detail Modal ───
  const renderWorkoutSetsBreakdown = (sess) => {
    const sets = sess.workout_sets || [];
    if (!sets || sets.length === 0) return null;

    const splitExNames = (sess.split_name || '')
      .split(',')
      .map(s => s.replace(/\[.*?\]/g, '').trim())
      .filter(Boolean);

    // Group sets by exercise name
    const groups = {};
    sets.forEach((st, idx) => {
      let exName = st.exercises?.name;
      if (!exName) {
        // Fallback: estimate from split_name order or generic label
        exName = splitExNames[0] || 'Latihan';
      }
      if (!groups[exName]) groups[exName] = [];
      groups[exName].push({ ...st, originalIndex: idx + 1 });
    });

    return Object.entries(groups).map(([name, exSets], gIdx) => {
      const exVol = exSets.reduce((acc, curr) => acc + ((Number(curr.weight_kg) || 0) * (Number(curr.reps) || 0)), 0);

      return (
        <View key={gIdx} style={{ backgroundColor: theme.colors.background, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border, paddingBottom: 8 }}>
            <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text }}>{name}</AppText>
            <AppText style={{ fontSize: 11, color: theme.colors.textMuted }}>Vol: <AppText weight="bold" style={{ color: theme.colors.primary }}>{exVol} kg</AppText></AppText>
          </View>

          {exSets.map((s, sIdx) => {
            const setNum = s.set_index || (sIdx + 1);
            const w = Number(s.weight_kg) || 0;
            const r = Number(s.reps) || 0;
            const vol = w * r;

            return (
              <View key={s.id || sIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: sIdx < exSets.length - 1 ? 0.5 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
                    <AppText style={{ fontSize: 10, color: theme.colors.textMuted, fontWeight: 'bold' }}>{setNum}</AppText>
                  </View>
                  <AppText tabular weight="bold" style={{ fontSize: 13, color: theme.colors.text }}>
                    {w} kg <AppText style={{ color: theme.colors.textMuted, fontWeight: 'normal' }}>×</AppText> {r} reps
                  </AppText>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AppText tabular style={{ fontSize: 12, color: theme.colors.textMuted }}>{vol} kg</AppText>
                  <View style={{ backgroundColor: 'rgba(204, 255, 0, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <AppText style={{ fontSize: 10, color: theme.colors.primary, fontWeight: 'bold' }}>✓ Selesai</AppText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      );
    });
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
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
        <AppText weight="bold" style={{ fontSize: 24, marginBottom: 4 }}>{t('history_title')}</AppText>
        <AppText style={{ color: theme.colors.textMuted }}>Review your workouts, water, and nutrition history.</AppText>
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
      <Modal
        visible={!!selectedSession}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedSession(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: theme.colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: theme.colors.border,
            maxHeight: '88%',
            paddingBottom: 24,
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.text }}>{selectedSession?.split_name}</AppText>
                <AppText style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
                  {selectedSession?.date} · {selectedSession?.time}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedSession(null)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}
              >
                <X color={theme.colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {/* Stat Summary Cards */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                <View style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                  <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>Total Volume</AppText>
                  <AppText weight="bold" tabular style={{ fontSize: 16, color: theme.colors.primary }}>
                    {selectedSession?.totalVolume > 1000 ? `${(selectedSession.totalVolume / 1000).toFixed(1)}k` : (selectedSession?.totalVolume || 0)} kg
                  </AppText>
                </View>
                <View style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                  <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>Total Set</AppText>
                  <AppText weight="bold" tabular style={{ fontSize: 16, color: theme.colors.text }}>
                    {selectedSession?.completedSets || 0} Sets
                  </AppText>
                </View>
                <View style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                  <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>Rata-rata/Set</AppText>
                  <AppText weight="bold" tabular style={{ fontSize: 16, color: '#38BDF8' }}>
                    {selectedSession?.completedSets > 0 ? `${Math.round(selectedSession.totalVolume / selectedSession.completedSets)} kg` : '0 kg'}
                  </AppText>
                </View>
              </View>

              {/* If 0 Sets: Alert & Quick Actions */}
              {(!selectedSession?.workout_sets || selectedSession.workout_sets.length === 0 || selectedSession.completedSets === 0) ? (
                <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <AlertCircle color="#F59E0B" size={20} />
                    <AppText weight="bold" style={{ color: '#F59E0B', fontSize: 15 }}>Detail Set Belum Tersimpan</AppText>
                  </View>
                  <AppText style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                    Sesi ini tercatat di database dengan 0 set tersimpan (kemungkinan terjadi karena penolakan foreign key pada versi sebelumnya). Anda dapat mengulangi latihan ini ke Logger atau menghapusnya dari riwayat.
                  </AppText>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => {
                        const sId = selectedSession.id;
                        setSelectedSession(null);
                        handleDeleteWorkout(sId);
                      }}
                      style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', alignItems: 'center' }}
                    >
                      <AppText weight="bold" style={{ color: '#EF4444', fontSize: 12 }}>🗑️ Hapus Sesi</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const sess = selectedSession;
                        setSelectedSession(null);
                        handleRepeatWorkout(sess);
                      }}
                      style={{ flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                    >
                      <AppText weight="bold" style={{ color: '#000', fontSize: 12 }}>🔄 Ulangi Latihan</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Grouped Sets Breakdown */
                <View style={{ marginBottom: 20 }}>
                  <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                    RINCIAN SET & ANGKATAN
                  </AppText>
                  {renderWorkoutSetsBreakdown(selectedSession)}
                </View>
              )}

              {/* Bottom Actions */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    const sess = selectedSession;
                    setSelectedSession(null);
                    handleRepeatWorkout(sess);
                  }}
                  style={{ flex: 1, backgroundColor: theme.colors.surface, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                >
                  <RotateCcw color={theme.colors.text} size={15} />
                  <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 13 }}>Ulangi Sesi</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleShareSession(selectedSession)}
                  style={{ flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                >
                  <Share2 color="#000" size={15} />
                  <AppText weight="bold" style={{ color: '#000', fontSize: 13 }}>Bagikan</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const sId = selectedSession.id;
                    setSelectedSession(null);
                    handleDeleteWorkout(sId);
                  }}
                  style={{ paddingHorizontal: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Trash2 color="#EF4444" size={16} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── NUTRITION DETAIL MODAL ─── */}
      <Modal
        visible={!!selectedNutrition}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedNutrition(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.colors.card, width: '100%', maxWidth: 380, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.text }}>{selectedNutrition?.food_name}</AppText>
                <AppText style={{ fontSize: 12, color: theme.colors.textMuted }}>{selectedNutrition?.date} · {selectedNutrition?.time}</AppText>
              </View>
              <TouchableOpacity onPress={() => setSelectedNutrition(null)}>
                <X color={theme.colors.text} size={20} />
              </TouchableOpacity>
            </View>

            {/* Total Calories Badge */}
            <View style={{ backgroundColor: theme.colors.background, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', marginBottom: 16 }}>
              <AppText style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Total Energi</AppText>
              <AppText weight="bold" tabular style={{ fontSize: 26, color: theme.colors.primary }}>
                {selectedNutrition?.calories || 0} <AppText style={{ fontSize: 16, color: theme.colors.textMuted }}>kcal</AppText>
              </AppText>
            </View>

            {/* Macros Breakdown */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              <View style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                <AppText style={{ fontSize: 10, color: theme.colors.textMuted }}>Protein</AppText>
                <AppText weight="bold" tabular style={{ fontSize: 15, color: '#38BDF8', marginTop: 2 }}>{selectedNutrition?.protein || 0}g</AppText>
              </View>
              <View style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                <AppText style={{ fontSize: 10, color: theme.colors.textMuted }}>Carbs</AppText>
                <AppText weight="bold" tabular style={{ fontSize: 15, color: '#34D399', marginTop: 2 }}>{selectedNutrition?.carbs || 0}g</AppText>
              </View>
              <View style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                <AppText style={{ fontSize: 10, color: theme.colors.textMuted }}>Fats</AppText>
                <AppText weight="bold" tabular style={{ fontSize: 15, color: '#FBBF24', marginTop: 2 }}>{selectedNutrition?.fats || 0}g</AppText>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  const nId = selectedNutrition.id;
                  setSelectedNutrition(null);
                  handleDeleteNutrition(nId);
                }}
                style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', alignItems: 'center' }}
              >
                <AppText weight="bold" style={{ color: '#EF4444', fontSize: 13 }}>Hapus Catatan</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedNutrition(null)}
                style={{ flex: 1, backgroundColor: theme.colors.surface, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}
              >
                <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 13 }}>Tutup</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── WATER DETAIL MODAL ─── */}
      <Modal
        visible={!!selectedWater}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedWater(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.colors.card, width: '100%', maxWidth: 380, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.text }}>Konsumsi Air Harian</AppText>
                <AppText style={{ fontSize: 12, color: theme.colors.textMuted }}>{selectedWater?.date}</AppText>
              </View>
              <TouchableOpacity onPress={() => setSelectedWater(null)}>
                <X color={theme.colors.text} size={20} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: theme.colors.background, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <AppText style={{ fontSize: 22 }}>💧</AppText>
              </View>
              <AppText weight="bold" tabular style={{ fontSize: 26, color: '#38BDF8' }}>
                {selectedWater?.ml || 0} <AppText style={{ fontSize: 16, color: theme.colors.textMuted }}>ml</AppText>
              </AppText>
              <AppText style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
                Target Harian: 2500 ml ({Math.min(100, Math.round(((selectedWater?.ml || 0) / 2500) * 100))}% tercapai)
              </AppText>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  const wId = selectedWater.id;
                  setSelectedWater(null);
                  handleDeleteWater(wId);
                }}
                style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', alignItems: 'center' }}
              >
                <AppText weight="bold" style={{ color: '#EF4444', fontSize: 13 }}>Hapus Catatan</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedWater(null)}
                style={{ flex: 1, backgroundColor: theme.colors.surface, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}
              >
                <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 13 }}>Tutup</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── CUSTOM DELETE CONFIRMATION MODAL ─── */}
      <Modal
        visible={deleteConfirm.visible}
        transparent={true}
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.colors.card, width: '100%', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Trash2 color="#EF4444" size={24} />
            </View>
            <AppText weight="bold" style={{ fontSize: 20, marginBottom: 8 }}>Hapus Data?</AppText>
            <AppText style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 24 }}>
              Apakah Anda yakin ingin menghapus data ini secara permanen? Aksi ini tidak dapat dibatalkan.
            </AppText>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}
                onPress={() => setDeleteConfirm({ visible: false, type: null, id: null })}
              >
                <AppText weight="bold" style={{ color: theme.colors.text }}>Batal</AppText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' }}
                onPress={executeDelete}
              >
                <AppText weight="bold" style={{ color: '#fff' }}>Hapus</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
