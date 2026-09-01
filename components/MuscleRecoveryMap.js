import React, { useState, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { AppText, theme } from '../theme';
import { Shield, Zap, Activity, Info, Calendar, X } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useDynamicIsland } from '../contexts/DynamicIslandContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectMuscleGroups, calculateMuscleRecovery } from '../utils/fitnessMath';

// Anatomical SVG Paths mapped to viewBox="50 10 170 190" (Center = 135)
const FRONT_MUSCLE_PATHS = [
  {
    id: 'traps',
    label: 'Pundak & Traps (Trapezius)',
    paths: [
      'M 124 25 C 120 28, 115 32, 111 36 C 111 44, 115 44, 125 36 Z',
      'M 146 25 C 150 28, 155 32, 159 36 C 159 44, 155 44, 145 36 Z'
    ]
  },
  {
    id: 'shoulders',
    label: 'Bahu (Shoulders)',
    paths: [
      'M 98 48 C 96 52, 94 58, 96 63 C 98 64, 108 63, 110 59 C 111 55, 107 50, 98 48 Z',
      'M 172 48 C 174 52, 176 58, 174 63 C 172 64, 162 63, 160 59 C 159 55, 163 50, 172 48 Z'
    ]
  },
  {
    id: 'chest',
    label: 'Dada (Chest)',
    paths: [
      'M 112 46 C 116 46, 126 46, 134 46 C 134 54, 133 60, 134 65 C 127 65, 120 63, 112 59 Z',
      'M 158 46 C 154 46, 144 46, 136 46 C 136 54, 137 60, 136 65 C 143 65, 150 63, 158 59 Z'
    ]
  },
  {
    id: 'biceps',
    label: 'Bisep (Biceps)',
    paths: [
      'M 93 64 C 91 75, 91 80, 90 86 C 91 88, 97 88, 101 86 C 103 80, 104 75, 105 64 Z',
      'M 177 64 C 179 75, 179 80, 180 86 C 179 88, 173 88, 169 86 C 167 80, 166 75, 165 64 Z'
    ]
  },
  {
    id: 'forearms',
    label: 'Lengan Bawah (Forearms)',
    paths: [
      'M 90 87 C 88 95, 88 102, 90 105 C 92 106, 94 106, 95 105 C 97 100, 99 95, 101 87 Z',
      'M 180 87 C 182 95, 182 102, 180 105 C 178 106, 176 106, 175 105 C 173 100, 171 95, 169 87 Z'
    ]
  },
  {
    id: 'core',
    label: 'Inti & Abs (Core)',
    paths: [
      'M 122 70 C 130 68, 140 68, 148 70 C 148 82, 146 95, 145 106 C 138 108, 132 108, 125 106 C 124 95, 122 82, 122 70 Z'
    ]
  },
  {
    id: 'quads',
    label: 'Paha Depan (Quads)',
    paths: [
      'M 111 112 C 118 112, 126 112, 132 112 C 131 128, 129 144, 126 160 C 121 160, 117 155, 115 145 Z',
      'M 159 112 C 152 112, 144 112, 138 112 C 139 128, 141 144, 144 160 C 149 160, 153 155, 155 145 Z'
    ]
  },
  {
    id: 'calves',
    label: 'Betis (Calves)',
    paths: [
      'M 115 158 C 112 170, 114 182, 122 189 C 126 180, 125 168, 124 158 Z',
      'M 155 158 C 158 170, 156 182, 148 189 C 144 180, 145 168, 146 158 Z'
    ]
  }
];

const BACK_MUSCLE_PATHS = [
  {
    id: 'traps',
    label: 'Pundak & Traps (Trapezius)',
    paths: [
      'M 135 26 L 124 38 L 135 48 L 146 38 Z'
    ]
  },
  {
    id: 'shoulders',
    label: 'Bahu (Shoulders)',
    paths: [
      'M 98 48 C 96 52, 94 58, 96 63 C 98 64, 108 63, 110 59 C 111 55, 107 50, 98 48 Z',
      'M 172 48 C 174 52, 176 58, 174 63 C 172 64, 162 63, 160 59 C 159 55, 163 50, 172 48 Z'
    ]
  },
  {
    id: 'lats',
    label: 'Punggung Atas & Lats (Lats)',
    paths: [
      'M 112 46 C 120 45, 124 45, 124 45 L 124 48 C 130 52, 140 52, 146 48 L 146 45 C 146 45, 150 45, 158 46 C 158 55, 155 64, 153 72 C 141 74, 129 74, 117 72 C 115 64, 112 55, 112 46 Z'
    ]
  },
  {
    id: 'lower_back',
    label: 'Punggung Bawah (Lower Back)',
    paths: [
      'M 117 72 C 129 74, 141 74, 153 72 C 151 79, 150 85, 150 90 C 140 92, 130 92, 120 90 C 119 85, 118 79, 117 72 Z'
    ]
  },
  {
    id: 'triceps',
    label: 'Trisep (Triceps)',
    paths: [
      'M 93 64 C 91 75, 91 80, 90 86 C 91 88, 97 88, 101 86 C 103 80, 104 75, 105 64 Z',
      'M 177 64 C 179 75, 179 80, 180 86 C 179 88, 173 88, 169 86 C 167 80, 166 75, 165 64 Z'
    ]
  },
  {
    id: 'forearms',
    label: 'Lengan Bawah (Forearms)',
    paths: [
      'M 90 87 C 88 95, 88 102, 90 105 C 92 106, 94 106, 95 105 C 97 100, 99 95, 101 87 Z',
      'M 180 87 C 182 95, 182 102, 180 105 C 178 106, 176 106, 175 105 C 173 100, 171 95, 169 87 Z'
    ]
  },
  {
    id: 'glutes',
    label: 'Bokong (Glutes)',
    paths: [
      'M 112 95 C 110 102, 113 111, 134 111 C 134 100, 125 95, 112 95 Z',
      'M 158 95 C 160 102, 157 111, 136 111 C 136 100, 145 95, 158 95 Z'
    ]
  },
  {
    id: 'hamstrings',
    label: 'Paha Belakang (Hamstrings)',
    paths: [
      'M 111 112 C 118 112, 126 112, 132 112 C 131 126, 129 140, 127 154 C 122 154, 118 150, 115 142 Z',
      'M 159 112 C 152 112, 144 112, 138 112 C 139 126, 141 140, 143 154 C 148 154, 152 150, 155 142 Z'
    ]
  },
  {
    id: 'calves',
    label: 'Betis (Calves)',
    paths: [
      'M 115 158 C 112 170, 114 182, 122 189 C 126 180, 125 168, 124 158 Z',
      'M 155 158 C 158 170, 156 182, 148 189 C 143 180, 144 168, 146 158 Z'
    ]
  }
];

const MUSCLE_DETAILS = {
  traps: {
    desc: 'Otot trapezius mengontrol pundak, leher atas, belikat, dan menopang postur tubuh tegak.',
    rehab: ['Peregangan Leher Lateral', 'Squeeze Shoulder Blade', 'Peregangan Bahu Pasif'],
    workouts: ['Dumbbell Shrugs', 'Barbell Shrugs', 'Upright Rows', 'Face Pulls']
  },
  shoulders: {
    desc: 'Otot deltoid mengontrol rotasi dan pergerakan lengan atas.',
    rehab: ['Putaran Lengan Ringan', 'Peregangan Bahu Handuk', 'Peregangan Silang Dada'],
    workouts: ['Overhead Press', 'Lateral Raise', 'Rear Delt Fly']
  },
  chest: {
    desc: 'Pectoralis major & minor mendukung kekuatan dorongan horizontal.',
    rehab: ['Peregangan Kusen Pintu', 'Pose Cobra Yoga', 'Deep Breathing Chest Opener'],
    workouts: ['Bench Press', 'Dumbbell Flyes', 'Push-ups']
  },
  lats: {
    desc: 'Otot punggung lebar (latissimus dorsi) mengontrol gerakan menarik vertikal dan horizontal.',
    rehab: ['Peregangan Sayap/Lats Dinamis', 'Child Pose Lateral Stretch', 'Hanging Pasif'],
    workouts: ['Pull-ups', 'Lat Pulldown', 'Bent-Over Rows']
  },
  lower_back: {
    desc: 'Otot erector spinae menstabilkan tulang belakang bagian bawah.',
    rehab: ['Cat-Cow Stretch', 'Bird-Dog Exercise', 'Glute Bridges tanpa Beban'],
    workouts: ['Deadlifts', 'Hyperextensions', 'Good Mornings']
  },
  biceps: {
    desc: 'Biceps brachii mengontrol gerakan menarik dan fleksi siku.',
    rehab: ['Peregangan Biceps Dinding', 'Wrist Extensor Stretch', 'Bicep Stretch Duduk'],
    workouts: ['Barbell Bicep Curl', 'Dumbbell Hammer Curl', 'Incline Dumbbell Curl']
  },
  triceps: {
    desc: 'Triceps brachii mengontrol ekstensi siku dan gerakan mendorong.',
    rehab: ['Overhead Triceps Stretch', 'Peregangan Silang Dada', 'Forearm Release'],
    workouts: ['Lying Tricep Extension', 'Triceps Cable Pushdown', 'Close-Grip Bench Press']
  },
  forearms: {
    desc: 'Otot lengan bawah (brachioradialis & flexors) mengendalikan kekuatan cengkeraman (grip) dan pergelangan tangan.',
    rehab: ['Wrist Flexor Stretch', 'Wrist Extensor Stretch', 'Pijat Lengan Bawah'],
    workouts: ['Wrist Curls', 'Reverse Curls', 'Farmer Walks', 'Deadhangs']
  },
  core: {
    desc: 'Otot inti perut menjaga stabilitas tulang belakang.',
    rehab: ['Glute Bridges Lambat', 'Pose Cobra', 'Peregangan Samping'],
    workouts: ['Plank', 'Ab Wheel Rollouts', 'Hanging Knee Raises']
  },
  quads: {
    desc: 'Paha depan (quadriceps) mengontrol ekstensi lutut.',
    rehab: ['Kneeling Quad Stretch', 'Couch Stretch', 'Air Squats Lambat'],
    workouts: ['Barbell Squats', 'Leg Press', 'Bulgarian Split Squats']
  },
  hamstrings: {
    desc: 'Paha belakang mendorong kekuatan engsel pinggul.',
    rehab: ['Figure-4 Stretch', 'Peregangan Hamstring dengan Handuk', 'Glute Bridges tanpa Beban'],
    workouts: ['Romanian Deadlift (RDL)', 'Leg Curls', 'Good Mornings']
  },
  glutes: {
    desc: 'Otot bokong (gluteus maximus & medius) mengendalikan ekstensi pinggul.',
    rehab: ['Pose Pigeon Yoga', 'Glute Bridges tanpa Beban', 'Peregangan Glute Duduk'],
    workouts: ['Hip Thrusts', 'Glute Kickbacks', 'Sumo Squats']
  },
  calves: {
    desc: 'Otot betis (gastrocnemius & soleus) membantu gerakan jinjit dan melompat.',
    rehab: ['Wall Calf Stretch', 'Ankle Rotations', 'Down Dog Pedaling'],
    workouts: ['Standing Calf Raises', 'Seated Calf Raises', 'Donkey Calf Raises']
  }
};

export default function MuscleRecoveryMap({ completedSessions = [], session }) {
  const { colors, darkMode } = useTheme();
  const { showNotification } = useDynamicIsland();
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [overrides, setOverrides] = useState({});
  const { width: screenWidth } = useWindowDimensions();

  const svgWidth = Math.min(140, (screenWidth - 80) / 2);
  const svgHeight = svgWidth * (190 / 170);

  // Load manual status overrides from AsyncStorage
  useEffect(() => {
    loadOverrides();
  }, [session]);

  const loadOverrides = async () => {
    try {
      const userId = session?.user?.id || 'guest';
      const data = await AsyncStorage.getItem(`muscle_recovery_overrides_${userId}`);
      if (data) {
        setOverrides(JSON.parse(data));
      } else {
        setOverrides({});
      }
    } catch (e) {

    }
  };

  const saveOverride = async (muscleId, percentage) => {
    try {
      const userId = session?.user?.id || 'guest';
      const updated = {
        ...overrides,
        [muscleId]: {
          percentage,
          lastUpdated: new Date().toISOString()
        }
      };
      setOverrides(updated);
      await AsyncStorage.setItem(`muscle_recovery_overrides_${userId}`, JSON.stringify(updated));

      // Show island alert
      showNotification({
        type: 'success',
        title: 'Status Otot Diperbarui 🗺️',
        subtitle: `Otot ${muscleId} diset ke ${percentage}% pemulihan.`,
        duration: 3000
      });

      // Instantly update local selected state
      if (selectedMuscle && selectedMuscle.id === muscleId) {
        let status = 'Fresh';
        if (percentage < 40) status = 'Fatigued';
        else if (percentage < 75) status = 'Recovering';

        setSelectedMuscle({
          ...selectedMuscle,
          percentage,
          status,
          hoursAgo: 0,
          isOverride: true
        });
      }
    } catch (e) {

    }
  };

  // Calculate real-time recovery states combining database history + manual overrides
  const muscleRecoveryStates = useMemo(() => {
    const states = {
      chest: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      lats: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      lower_back: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      shoulders: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      biceps: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      triceps: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      forearms: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      quads: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      hamstrings: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      core: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      traps: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      glutes: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
      calves: { status: 'Fresh', percentage: 100, hoursAgo: 999 },
    };

    const now = new Date();

    if (completedSessions && completedSessions.length > 0) {
      completedSessions.forEach(session => {
        const sessionDate = new Date((session.started_at || '').replace(' ', 'T'));
        const hoursAgo = Math.max(0, (now - sessionDate) / (1000 * 60 * 60));

        if (hoursAgo > 168) return; // Ignore workouts older than 7 days

        // Extract text from split_name AND workout_sets
        const splitText = (session.split_name || '').toLowerCase();
        const sets = session.workout_sets || [];

        const applyFatigue = (groups) => {
          groups.forEach(tg => {
            if (states[tg] && hoursAgo < states[tg].hoursAgo) {
              const recovery = calculateMuscleRecovery(hoursAgo);
              states[tg] = {
                status: recovery.status,
                percentage: recovery.percentage,
                hoursAgo: hoursAgo
              };
            }
          });
        };

        // 1. Check split_name (e.g. "Pull Day", "Lat Pulldown, Bicep Curl")
        if (splitText) {
          applyFatigue(detectMuscleGroups(splitText));
        }

        // 2. Check each set in workout_sets
        sets.forEach(set => {
          const rawMuscle = (set.muscle_group || set.exercises?.muscle_group || '').toLowerCase();
          const exName = (set.exercises?.name || '').toLowerCase();
          const combined = `${rawMuscle} ${exName}`;
          if (combined.trim()) {
            applyFatigue(detectMuscleGroups(combined));
          }
        });
      });
    }

    // Merge overrides with natural recovery decay (1.25% recovered per hour)
    Object.keys(overrides).forEach(muscleId => {
      const override = overrides[muscleId];
      if (override) {
        const lastUpdated = new Date(override.lastUpdated);
        const hoursAgo = (now - lastUpdated) / (1000 * 60 * 60);

        let percentage = 100;
        if (override.percentage < 100) {
          percentage = Math.min(100, Math.round(override.percentage + (hoursAgo * 1.25)));
        }

        // Apply override if it's more recent than actual workout session data
        if (states[muscleId] && hoursAgo < states[muscleId].hoursAgo) {
          let status = 'Fresh';
          if (percentage < 40) status = 'Fatigued';
          else if (percentage < 75) status = 'Recovering';

          states[muscleId] = {
            status,
            percentage,
            hoursAgo,
            isOverride: true
          };
        }
      }
    });

    return states;
  }, [completedSessions, overrides]);

  const getMuscleFill = (muscleId) => {
    const recovery = muscleRecoveryStates[muscleId];
    if (!recovery) return 'url(#grad-base)';
    if (recovery.percentage >= 95) return 'url(#grad-fresh)';
    if (recovery.percentage >= 40) return 'url(#grad-recovering)';
    return 'url(#grad-fatigued)';
  };

  const getMuscleStroke = (muscleId) => {
    const recovery = muscleRecoveryStates[muscleId];
    if (!recovery) return 'rgba(255,255,255,0.05)';
    if (recovery.percentage >= 95) return '#D4F53C';
    if (recovery.percentage >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const handleSelectMuscle = (muscle) => {
    setSelectedMuscle(prev => (prev?.id === muscle.id ? null : {
      ...muscle,
      ...muscleRecoveryStates[muscle.id]
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View>
          <AppText weight="bold" style={[styles.title, { color: colors.text }]}>Peta Pemulihan Otot</AppText>
          <AppText style={[styles.subtitle, { color: colors.textMuted }]}>Pilih bagian otot untuk detail status & pemulihan</AppText>
        </View>
        <Activity size={18} color={theme.colors.primary} />
      </View>

      {/* SVG Container for side-by-side silhouette maps */}
      <View style={styles.svgContainer}>
        {/* FRONT */}
        <View style={styles.bodyView}>
          <AppText weight="bold" style={styles.viewLabel}>TAMPAK DEPAN</AppText>
          <Svg width={svgWidth} height={svgHeight} viewBox="50 10 170 190">
            <Defs>
              <LinearGradient id="grad-fresh" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#D4F53C" stopOpacity="0.85" />
                <Stop offset="100%" stopColor="#88B800" stopOpacity="0.85" />
              </LinearGradient>
              <LinearGradient id="grad-recovering" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.85" />
                <Stop offset="100%" stopColor="#D97706" stopOpacity="0.85" />
              </LinearGradient>
              <LinearGradient id="grad-fatigued" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.85" />
                <Stop offset="100%" stopColor="#DC2626" stopOpacity="0.85" />
              </LinearGradient>
              <LinearGradient id="grad-base" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#1C1C24" />
                <Stop offset="100%" stopColor="#0C0C10" />
              </LinearGradient>
            </Defs>

            {/* Base front body outline */}
            <Path
              d="M 135 15 C 130 15, 125 18, 125 25 C 125 32, 120 35, 115 37 C 105 40, 95 48, 93 60 C 90 70, 91 90, 90 105 C 89 110, 93 112, 94 105 C 96 90, 102 75, 105 70 C 107 72, 108 85, 108 98 C 108 115, 106 122, 112 145 C 114 155, 110 175, 116 195 C 118 200, 126 200, 126 190 C 126 175, 131 160, 135 145 C 139 160, 144 175, 144 190 C 144 200, 152 200, 154 195 C 160 175, 156 155, 158 145 C 164 122, 162 115, 162 98 C 162 85, 163 72, 165 70 C 168 75, 174 90, 176 105 C 177 112, 181 110, 180 105 C 179 90, 180 70, 177 60 C 175 48, 165 40, 155 37 C 150 35, 145 32, 145 25 C 145 18, 140 15, 135 15 Z"
              fill={darkMode ? '#15151A' : '#E5E7EB'}
              stroke={darkMode ? '#22222E' : '#D1D5DB'}
              strokeWidth="1.5"
            />

            {/* Front Muscles Hotspots */}
            {FRONT_MUSCLE_PATHS.map((muscle) => {
              const fill = getMuscleFill(muscle.id);
              const stroke = getMuscleStroke(muscle.id);
              const isSelected = selectedMuscle?.id === muscle.id;

              return (
                <G key={muscle.id}>
                  {muscle.paths.map((d, index) => (
                    <Path
                      key={index}
                      d={d}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected ? 1.5 : 0.5}
                      opacity={isSelected ? 1 : 0.75}
                      onPress={() => handleSelectMuscle(muscle)}
                    />
                  ))}
                </G>
              );
            })}
          </Svg>
        </View>

        {/* BACK */}
        <View style={styles.bodyView}>
          <AppText weight="bold" style={styles.viewLabel}>TAMPAK BELAKANG</AppText>
          <Svg width={svgWidth} height={svgHeight} viewBox="50 10 170 190">
            {/* Base back body outline */}
            <Path
              d="M 135 15 C 130 15, 125 18, 125 25 C 125 32, 120 35, 115 37 C 105 40, 95 48, 93 60 C 90 70, 91 90, 90 105 C 89 110, 93 112, 94 105 C 96 90, 102 75, 105 70 C 107 72, 108 85, 108 98 C 108 115, 106 122, 112 145 C 114 155, 110 175, 116 195 C 118 200, 126 200, 126 190 C 126 175, 131 160, 135 145 C 139 160, 144 175, 144 190 C 144 200, 152 200, 154 195 C 160 175, 156 155, 158 145 C 164 122, 162 115, 162 98 C 162 85, 163 72, 165 70 C 168 75, 174 90, 176 105 C 177 112, 181 110, 180 105 C 179 90, 180 70, 177 60 C 175 48, 165 40, 155 37 C 150 35, 145 32, 145 25 C 145 18, 140 15, 135 15 Z"
              fill={darkMode ? '#15151A' : '#E5E7EB'}
              stroke={darkMode ? '#22222E' : '#D1D5DB'}
              strokeWidth="1.5"
            />

            {/* Back Muscles Hotspots */}
            {BACK_MUSCLE_PATHS.map((muscle) => {
              const fill = getMuscleFill(muscle.id);
              const stroke = getMuscleStroke(muscle.id);
              const isSelected = selectedMuscle?.id === muscle.id;

              return (
                <G key={muscle.id}>
                  {muscle.paths.map((d, index) => (
                    <Path
                      key={index}
                      d={d}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected ? 1.5 : 0.5}
                      opacity={isSelected ? 1 : 0.75}
                      onPress={() => handleSelectMuscle(muscle)}
                    />
                  ))}
                </G>
              );
            })}
          </Svg>
        </View>
      </View>

      {/* Selected Muscle Details Sheet */}
      {selectedMuscle ? (
        <View style={[styles.detailsPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Info size={16} color={theme.colors.primary} />
              <AppText weight="bold" style={{ color: colors.text, fontSize: 14 }}>{selectedMuscle.label}</AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusBadge, {
                backgroundColor: selectedMuscle.percentage >= 95 ? 'rgba(212,245,60,0.08)' : selectedMuscle.percentage >= 40 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                borderColor: selectedMuscle.percentage >= 95 ? '#D4F53C' : selectedMuscle.percentage >= 40 ? '#F59E0B' : '#EF4444'
              }]}>
                <AppText weight="bold" style={{
                  color: selectedMuscle.percentage >= 95 ? '#D4F53C' : selectedMuscle.percentage >= 40 ? '#F59E0B' : '#EF4444',
                  fontSize: 10
                }}>
                  {selectedMuscle.percentage}% Pemulihan
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setSelectedMuscle(null)} style={{ padding: 4 }}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Recovery Progress Bar */}
          <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
            <View style={{
              height: '100%',
              width: `${selectedMuscle.percentage}%`,
              backgroundColor: selectedMuscle.percentage >= 95 ? '#D4F53C' : selectedMuscle.percentage >= 40 ? '#F59E0B' : '#EF4444',
              borderRadius: 3
            }} />
          </View>

          {/* Description */}
          <AppText style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 10 }}>
            {MUSCLE_DETAILS[selectedMuscle.id]?.desc || ''}
          </AppText>

          {/* History Details */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Calendar size={13} color={colors.textMuted} />
            <AppText style={{ fontSize: 12, color: colors.textMuted }}>
              {selectedMuscle.percentage === 100 
                ? 'Latihan otot ini sudah pulih sepenuhnya.' 
                : `Latihan terakhir: ${selectedMuscle.hoursAgo === 999 ? 'Belum dicatat' : `${selectedMuscle.hoursAgo.toFixed(1)} jam yang lalu.`}`
              }
            </AppText>
          </View>

          {/* Action Suggestions */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
            {selectedMuscle.percentage < 70 ? (
              <View>
                <AppText weight="bold" style={{ color: '#EF4444', fontSize: 11, marginBottom: 4, letterSpacing: 0.5 }}>⚠️ REKOMENDASI PEMULIHAN (SORE):</AppText>
                {(MUSCLE_DETAILS[selectedMuscle.id]?.rehab || []).map((ex, idx) => (
                  <AppText key={idx} style={{ color: colors.text, fontSize: 12, lineHeight: 18 }}>• {ex}</AppText>
                ))}
              </View>
            ) : (
              <View>
                <AppText weight="bold" style={{ color: '#D4F53C', fontSize: 11, marginBottom: 4, letterSpacing: 0.5 }}>💪 LATIHAN YANG DIREKOMENDASIKAN (FRESH):</AppText>
                {(MUSCLE_DETAILS[selectedMuscle.id]?.workouts || []).map((ex, idx) => (
                  <AppText key={idx} style={{ color: colors.text, fontSize: 12, lineHeight: 18 }}>• {ex}</AppText>
                ))}
              </View>
            )}
          </View>

          {/* Manual override selection */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 14, paddingTop: 12 }}>
            <AppText weight="bold" style={{ color: colors.text, fontSize: 11, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Atur Status Manual
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: 'Sore 🔴', value: 20 },
                { label: 'Pemulihan 🟡', value: 60 },
                { label: 'Segar 🟢', value: 100 }
              ].map((preset) => {
                const isSelected = selectedMuscle.percentage === preset.value || 
                  (preset.value === 20 && selectedMuscle.percentage < 40) ||
                  (preset.value === 60 && selectedMuscle.percentage >= 40 && selectedMuscle.percentage < 80) ||
                  (preset.value === 100 && selectedMuscle.percentage >= 80);

                return (
                  <TouchableOpacity
                    key={preset.value}
                    onPress={() => saveOverride(selectedMuscle.id, preset.value)}
                    style={{
                      flex: 1,
                      backgroundColor: isSelected ? 'rgba(212,245,60,0.06)' : 'transparent',
                      borderWidth: 1,
                      borderColor: isSelected ? '#D4F53C' : 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 10,
                      paddingVertical: 8,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <AppText weight="bold" style={{ fontSize: 11, color: isSelected ? '#D4F53C' : colors.textMuted }}>
                      {preset.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      ) : (
        /* Status Legends */
        <View style={[styles.legendContainer, { borderTopColor: colors.border }]}>
          {[
            { label: 'Segar (95-100%)', color: '#D4F53C', bg: 'rgba(212,245,60,0.05)' },
            { label: 'Pemulihan (40-94%)', color: '#F59E0B', bg: 'rgba(245,158,11,0.05)' },
            { label: 'Sore / Lelah (<40%)', color: '#EF4444', bg: 'rgba(239,68,68,0.05)' }
          ].map((leg, index) => (
            <View key={index} style={[styles.legendItem, { backgroundColor: leg.bg, borderColor: leg.color + '22' }]}>
              <View style={[styles.dot, { backgroundColor: leg.color }]} />
              <AppText weight="bold" style={[styles.legendText, { color: leg.color }]}>{leg.label}</AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    marginBottom: 16,
  },
  svgContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 14,
  },
  bodyView: {
    alignItems: 'center',
  },
  viewLabel: {
    fontSize: 9,
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  detailsPanel: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
  },
});
