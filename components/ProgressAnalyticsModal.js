import React, { useState, useEffect, useMemo } from 'react';
import { View, Modal, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { supabase } from '../supabaseClient';
import { AppText, theme } from '../theme';
import { X, TrendingUp, Award, Activity, BarChart2 } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import SkiaLineChart from './SkiaLineChart';

export default function ProgressAnalyticsModal({ visible, onClose, userId, dbReady }) {
  const { colors, darkMode } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [exercisesList, setExercisesList] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [exerciseHistoryMap, setExerciseHistoryMap] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  // 1. Fetch completed sessions & parse real logged exercises
  useEffect(() => {
    if (!visible || !userId || !dbReady) return;

    const fetchLoggedExercises = async () => {
      setLoading(true);
      try {
        const { data: sessions, error } = await supabase
          .from('workout_sessions')
          .select('id, started_at, split_name, workout_sets(id, set_index, weight_kg, reps, is_checked, exercise_id, exercises(id, name))')
          .eq('user_id', userId)
          .eq('is_completed', true)
          .order('started_at', { ascending: true });

        if (!error && sessions) {
          const map = {};

          sessions.forEach(sess => {
            let rawSplit = sess.split_name || '';
            const parenMatch = rawSplit.match(/\((.*?)\)/);
            if (parenMatch && parenMatch[1].includes(',')) {
              rawSplit = parenMatch[1];
            }
            const splitNames = rawSplit.includes(',') 
              ? rawSplit.split(',').map(s => s.replace(/\[.*?\]/g, '').trim()).filter(Boolean)
              : (rawSplit ? [rawSplit.replace(/\[.*?\]/g, '').trim()] : []);

            let currentSplitIdx = 0;
            let lastSetIndex = -1;

            (sess.workout_sets || []).forEach(set => {
              let exName = set.exercise_name || set.exercises?.name;
              if (!exName) {
                const sIdx = Number(set.set_index) || 1;
                if (lastSetIndex !== -1 && sIdx <= lastSetIndex) {
                  if (currentSplitIdx + 1 < splitNames.length) {
                    currentSplitIdx++;
                  }
                }
                lastSetIndex = sIdx;
                exName = splitNames[currentSplitIdx] || splitNames[0] || 'Exercise';
              }

              const key = exName.toLowerCase().trim();
              if (!map[key]) {
                map[key] = { id: key, name: exName, sessionsGrouped: {} };
              }

              const safeStr = (sess.started_at || '').replace(' ', 'T');
              const sessDate = new Date(safeStr);
              const dateStr = !isNaN(sessDate.getTime()) 
                ? sessDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Session';
              const timestamp = !isNaN(sessDate.getTime()) ? sessDate.getTime() : 0;

              const weight = Number(set.weight_kg) || 0;
              const reps = Number(set.reps) || 0;
              const oneRepMax = reps > 0 ? Number((weight * (1 + reps / 30)).toFixed(1)) : 0;
              const volume = weight * reps;

              if (!map[key].sessionsGrouped[dateStr]) {
                map[key].sessionsGrouped[dateStr] = {
                  date: dateStr,
                  max1RM: oneRepMax,
                  totalVolume: volume,
                  timestamp
                };
              } else {
                map[key].sessionsGrouped[dateStr].totalVolume += volume;
                if (oneRepMax > map[key].sessionsGrouped[dateStr].max1RM) {
                  map[key].sessionsGrouped[dateStr].max1RM = oneRepMax;
                }
              }
            });
          });

          let list = Object.values(map).map(e => ({ id: e.id, name: e.name }));

          // Fallback: If no sets logged, fetch catalog exercises to show preview
          if (list.length === 0) {
            const { data: catData } = await supabase.from('exercises').select('id, name').limit(15);
            if (catData && catData.length > 0) {
              list = catData.map(c => ({ id: c.name.toLowerCase().trim(), name: c.name }));
            }
          }

          setExerciseHistoryMap(map);
          setExercisesList(list);
          if (list.length > 0) {
            setSelectedExerciseId(list[0].id);
            const firstPoints = Object.values(map[list[0].id]?.sessionsGrouped || {})
              .sort((a, b) => a.timestamp - b.timestamp);
            setHistoryData(firstPoints);
          } else {
            setHistoryData([]);
          }
        }
      } catch (e) {
        // Fallback gracefully on exception
      } finally {
        setLoading(false);
      }
    };

    fetchLoggedExercises();
  }, [visible, userId, dbReady]);

  // 2. Reactively update charts when user switches selected exercise
  useEffect(() => {
    if (!selectedExerciseId) {
      setHistoryData([]);
      return;
    }
    const target = exerciseHistoryMap[selectedExerciseId];
    if (target && target.sessionsGrouped) {
      const points = Object.values(target.sessionsGrouped).sort((a, b) => a.timestamp - b.timestamp);
      setHistoryData(points);
    } else {
      setHistoryData([]);
    }
  }, [selectedExerciseId, exerciseHistoryMap]);

  const activeExerciseName = useMemo(() => {
    const found = exercisesList.find(e => e.id === selectedExerciseId);
    return found ? found.name : 'Select Exercise';
  }, [selectedExerciseId, exercisesList]);

  const renderChart = (key, chartColor) => {
    return (
      <SkiaLineChart 
        data={historyData}
        dataKey={key}
        color={chartColor}
        height={160}
      />
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TrendingUp color={theme.colors.primary} size={22} />
              <AppText weight="bold" style={{ fontSize: 20, color: colors.text }}>Progress Analytics</AppText>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}>
              <X color={colors.text} size={20} />
            </TouchableOpacity>
          </View>

          {loading && <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginVertical: 20 }} />}

          {/* Exercise Selector */}
          <TouchableOpacity onPress={() => setPickerVisible(true)} style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AppText weight="bold" style={{ color: colors.text, fontSize: 15 }}>{activeExerciseName}</AppText>
            <AppText style={{ color: theme.colors.primary, fontSize: 13 }}>Change</AppText>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
            {exercisesList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Award color="#444" size={48} style={{ marginBottom: 12 }} />
                <AppText style={{ color: '#888', textAlign: 'center', fontSize: 14 }}>
                  No completed exercises found. Log sets in the Logger to begin generating progression maps.
                </AppText>
              </View>
            ) : (
              <View>
                {/* 1RM Line Chart */}
                <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Activity color={theme.colors.primary} size={16} />
                    <AppText weight="bold" style={{ color: colors.text, fontSize: 15 }}>Estimated 1-Rep Max (1RM)</AppText>
                  </View>
                  <AppText style={[styles.cardDesc, { color: colors.textMuted }]}>Highest strength potential estimated via Epley's formula</AppText>
                  {renderChart('max1RM', theme.colors.primary)}
                </View>

                {/* Training Volume Chart */}
                <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <BarChart2 color="#00F0FF" size={16} />
                    <AppText weight="bold" style={{ color: colors.text, fontSize: 15 }}>Total Workout Volume</AppText>
                  </View>
                  <AppText style={[styles.cardDesc, { color: colors.textMuted }]}>Total load lifted (weight × reps) across all sets</AppText>
                  {renderChart('totalVolume', '#00F0FF')}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* INNER EXERCISE PICKER MODAL */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.pickerHeader}>
              <AppText weight="bold" style={{ fontSize: 18, color: colors.text }}>Select Exercise</AppText>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <X color={colors.text} size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {exercisesList.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.pickerItem, { backgroundColor: colors.inputBg }, item.id === selectedExerciseId && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedExerciseId(item.id);
                    setPickerVisible(false);
                  }}
                >
                  <AppText weight="bold" style={{ color: item.id === selectedExerciseId ? '#000' : colors.text, fontSize: 15 }}>
                    {item.name}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    height: '85%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0A0C',
    borderWidth: 1,
    borderColor: '#1C1C22',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  chartCard: {
    backgroundColor: '#0A0A0C',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1C1C22',
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardDesc: {
    color: '#555',
    fontSize: 12,
    marginBottom: 10,
  },
  emptyChart: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerContent: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    width: '100%',
    maxWidth: 350,
    padding: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#222',
  },
  pickerItemActive: {
    backgroundColor: theme.colors.primary,
  },
});
