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
  const [historyData, setHistoryData] = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  // 1. Fetch all exercises the user has recorded sets for
  useEffect(() => {
    if (!visible || !userId || !dbReady) return;

    const fetchLoggedExercises = async () => {
      setLoading(true);
      try {
        // Query distinct exercises from logged sets
        const { data, error } = await supabase
          .from('workout_sets')
          .select('exercise_id, exercises!inner(id, name), workout_sessions!inner(user_id, is_completed)')
          .eq('workout_sessions.user_id', userId)
          .eq('workout_sessions.is_completed', true)
          .eq('is_checked', true);

        if (error) {

        }

        if (!error && data) {
          const uniqueMap = {};
          data.forEach(item => {
            if (item.exercises) {
              uniqueMap[item.exercises.id] = item.exercises.name;
            }
          });
          const list = Object.entries(uniqueMap).map(([id, name]) => ({ id, name }));
          setExercisesList(list);
          if (list.length > 0) {
            setSelectedExerciseId(list[0].id);
          }
        }
      } catch (e) {

      } finally {
        setLoading(false);
      }
    };

    fetchLoggedExercises();
  }, [visible, userId, dbReady]);

  // 2. Fetch set records for selected exercise
  useEffect(() => {
    if (!visible || !userId || !selectedExerciseId || !dbReady) {
      setHistoryData([]);
      return;
    }

    const fetchExerciseHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('workout_sets')
          .select('weight_kg, reps, workout_sessions!inner(started_at, is_completed)')
          .eq('exercise_id', selectedExerciseId)
          .eq('workout_sessions.user_id', userId)
          .eq('workout_sessions.is_completed', true)
          .eq('is_checked', true);

        if (error) {

        }

        if (!error && data) {
          // Sort in JS because Supabase PostgREST can't sort outer rows by inner join column
          data.sort((a, b) => new Date(a.workout_sessions.started_at) - new Date(b.workout_sessions.started_at));

          // Group by session date to sum volume & calculate max 1RM of the session
          const sessionsGrouped = {};

          data.forEach(item => {
            const dateStr = new Date(item.workout_sessions.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const weight = Number(item.weight_kg) || 0;
            const reps = Number(item.reps) || 0;

            // Epley 1RM formula: Weight * (1 + reps/30)
            const oneRepMax = reps > 0 ? Number((weight * (1 + reps / 30)).toFixed(1)) : 0;
            const volume = weight * reps;

            if (!sessionsGrouped[dateStr]) {
              sessionsGrouped[dateStr] = {
                date: dateStr,
                max1RM: oneRepMax,
                totalVolume: volume,
              };
            } else {
              sessionsGrouped[dateStr].totalVolume += volume;
              if (oneRepMax > sessionsGrouped[dateStr].max1RM) {
                sessionsGrouped[dateStr].max1RM = oneRepMax;
              }
            }
          });

          setHistoryData(Object.values(sessionsGrouped));
        }
      } catch (e) {

      } finally {
        setLoading(false);
      }
    };

    fetchExerciseHistory();
  }, [visible, selectedExerciseId, userId, dbReady]);

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
    <Modal visible={visible} transparent animationType="slide">
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
      <Modal visible={pickerVisible} transparent animationType="fade">
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
