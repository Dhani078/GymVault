import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { Search, Plus, X, Dumbbell, PlayCircle, Filter, ChevronRight, Database, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { AppText, theme, styles } from '../theme';
import { supabase } from '../supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { useAppMode, EXERCISE_SWAP_MAP } from '../contexts/AppModeContext';
import { FALLBACK_EXERCISES } from './FallbackExercises';
import { AnimatedFlashList, AnimatedScrollCard } from '../components/AnimatedFlashList';
import DummyAdBanner from '../components/DummyAdBanner';

// Animation Component for Exercise Visuals
const AnimatedExerciseImage = ({ images }) => {
  const [frame, setFrame] = useState(0);

  // Reset frame when images prop changes to prevent out of bounds crashes
  useEffect(() => {
    setFrame(0);
  }, [images]);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % images.length);
    }, 1000); // Toggle every 1s
    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <View style={{ width: '100%', height: 240, backgroundColor: theme.colors.card, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
        <Dumbbell color={theme.colors.textMuted} size={48} />
      </View>
    );
  }

  // Safe guard access
  const activeImage = images[frame] || images[0];

  if (!activeImage) {
    return (
      <View style={{ width: '100%', height: 240, backgroundColor: theme.colors.card, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
        <Dumbbell color={theme.colors.textMuted} size={48} />
      </View>
    );
  }

  return (
    <View style={{ width: '100%', height: 240, backgroundColor: theme.colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }}>
      <Image
        source={{ uri: activeImage }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
      {images.length > 1 && (
        <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(204,255,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 0.5, borderColor: theme.colors.primary }}>
          <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 9, letterSpacing: 0.5 }}>ANIMATED</AppText>
        </View>
      )}
    </View>
  );
};

const POPULAR_EXERCISES = [
  'bench press', 'squat', 'deadlift', 'pull up', 'push up',
  'bicep curl', 'hammer curl', 'tricep', 'overhead press', 'lat pulldown',
  'leg press', 'romanian deadlift', 'cable crossover', 'plank', 'crunch',
  'shoulder press', 'lateral raise', 'cable row', 'dumbbell row', 'chest fly',
  'leg curl', 'leg extension', 'bulgarian split', 'lunge', 'hip thrust'
];

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Expert'];
const LOCATIONS = ['All', 'Home Workout', 'Gym'];

// Memoized List Item to prevent re-rendering 800 cards
const ExerciseCard = React.memo(({ item, index, scrollY, onPress }) => (
  <AnimatedScrollCard index={index} itemHeight={92} scrollY={scrollY} style={{
      marginBottom: 10,
  }}>
  <TouchableOpacity
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      height: 82,
    }}
    onPress={() => onPress(item)}
  >
    <View style={{ position: 'relative' }}>
      <Image
        source={{ uri: item.thumbnail_url }}
        style={{ width: 56, height: 56, borderRadius: 12, marginRight: 14, backgroundColor: theme.colors.inputBg }}
        resizeMode="cover"
      />
      {item.images && item.images.length > 1 && (
        <View style={{
          position: 'absolute', top: -3, right: 11,
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: theme.colors.primary,
          borderWidth: 1.5, borderColor: theme.colors.background
        }} />
      )}
    </View>
    <View style={{ flex: 1 }}>
      <AppText weight="bold" style={{ fontSize: 15, color: theme.colors.text, marginBottom: 6 }} numberOfLines={1}>
        {item.name}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <View style={{
          backgroundColor: 'rgba(204,255,0,0.06)',
          paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
          borderWidth: 0.5, borderColor: 'rgba(204,255,0,0.2)'
        }}>
          <AppText style={{ fontSize: 10, color: theme.colors.primary, fontWeight: 'bold' }}>
            {item.level}
          </AppText>
        </View>
        <View style={{
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
          borderWidth: 0.5, borderColor: theme.colors.border
        }}>
          <AppText style={{ fontSize: 10, color: theme.colors.textMuted }}>
            {item.muscle_group}
          </AppText>
        </View>
        <View style={{
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
          borderWidth: 0.5, borderColor: theme.colors.border
        }}>
          <AppText style={{ fontSize: 10, color: theme.colors.textMuted }}>
            {item.equipment_type}
          </AppText>
        </View>
        {item.isSwapped && (
          <View style={{
            backgroundColor: 'rgba(0, 240, 255, 0.08)',
            paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
            borderWidth: 0.5, borderColor: 'rgba(0, 240, 255, 0.25)'
          }}>
            <AppText style={{ fontSize: 10, color: '#00F0FF', fontWeight: 'bold' }}>
              🏡 Home Eq
            </AppText>
          </View>
        )}
      </View>
    </View>
    <View style={{ paddingLeft: 8 }}>
      <ChevronRight color={theme.colors.textMuted} size={20} />
    </View>
  </TouchableOpacity>
  </AnimatedScrollCard>
));

let globalCachedExercises = null;
let globalCachedMuscleGroups = null;

export default function LibraryScreen({ onStartExercise }) {
  const { t } = useTranslation();
  const { isHome, equipmentInventory } = useAppMode();
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Filters
  const [activeMuscle, setActiveMuscle] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All');
  const [activeLocation, setActiveLocation] = useState('All');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [muscleGroups, setMuscleGroups] = useState(['All']);
  const [exercises, setExercises] = useState(FALLBACK_EXERCISES);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(true);
  const [showDoneBanner, setShowDoneBanner] = useState(false);
  const [selectedEx, setSelectedEx] = useState(null);

  useEffect(() => {
    if (globalCachedExercises) {
      setExercises(globalCachedExercises);
      setMuscleGroups(globalCachedMuscleGroups);
      setIsFetchingMore(false);
    } else {
      fetchExercises();
    }
  }, []);

  useEffect(() => {
    if (!isFetchingMore) {
      setShowDoneBanner(true);
      const timer = setTimeout(() => {
        setShowDoneBanner(false);
      }, 5000); // Auto-hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isFetchingMore]);

  const fetchExercises = async () => {
    // Initial groups from fallback
    const initialGroups = new Set(FALLBACK_EXERCISES.map(e => e.muscle_group));
    setMuscleGroups(['All', ...Array.from(initialGroups).sort()]);

    const fetchWithTimeout = (url, options = {}, timeout = 6000) => {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request Timeout')), timeout)
        )
      ]);
    };

    try {
      const [res1, res2] = await Promise.all([
        fetchWithTimeout('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json')
          .then(r => r.ok ? r.json() : [])
          .then(data => Array.isArray(data) ? data : [])
          .catch(() => []),
        fetchWithTimeout('https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json')
          .then(r => r.ok ? r.json() : [])
          .then(data => Array.isArray(data) ? data : [])
          .catch(() => [])
      ]);

      const parsedData1 = res1.map(ex => {
        const group = ex.primaryMuscles?.[0] ? ex.primaryMuscles[0].charAt(0).toUpperCase() + ex.primaryMuscles[0].slice(1) : 'Other';
        const equipment = ex.equipment ? ex.equipment.toLowerCase() : 'body only';
        const level = ex.level ? ex.level.charAt(0).toUpperCase() + ex.level.slice(1) : 'Intermediate';

        return {
          id: ex.id,
          name: ex.name,
          equipment_type: equipment.charAt(0).toUpperCase() + equipment.slice(1),
          muscle_group: group,
          level: level,
          thumbnail_url: ex.images && ex.images.length > 0
            ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${ex.images[0]}`
            : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop',
          images: ex.images ? ex.images.map(img => `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${img}`) : [],
          instructions: ex.instructions ? ex.instructions.join('\n\n') : 'No instructions provided.'
        };
      });

      const parsedData2 = res2.map((ex, idx) => {
        const group = ex.target ? ex.target.charAt(0).toUpperCase() + ex.target.slice(1) : 'Other';
        const equipment = ex.equipment ? ex.equipment.toLowerCase() : 'body only';
        const name = ex.name ? ex.name.charAt(0).toUpperCase() + ex.name.slice(1) : 'Exercise';

        const thumb = ex.image
          ? `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${ex.image}`
          : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop';

        const images = [];
        if (ex.gif_url) {
          images.push(`https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${ex.gif_url}`);
        } else if (ex.image) {
          images.push(thumb);
        }

        let instructions = 'No instructions provided.';
        if (ex.instructions) {
          if (typeof ex.instructions === 'string') {
            instructions = ex.instructions;
          } else if (Array.isArray(ex.instructions)) {
            instructions = ex.instructions.join('\n\n');
          } else if (typeof ex.instructions === 'object') {
            instructions = ex.instructions.en || ex.instructions.id || ex.instructions.tr || ex.instructions.it || Object.values(ex.instructions)[0] || 'No instructions provided.';
          }
        }

        return {
          id: `hasan-${idx}`,
          name: name,
          equipment_type: equipment.charAt(0).toUpperCase() + equipment.slice(1),
          muscle_group: group,
          level: 'Intermediate',
          thumbnail_url: thumb,
          images: images,
          instructions: instructions
        };
      });

      // Merge and deduplicate by name (normalized lowercase)
      const merged = [];
      const seenNames = new Set();

      // 1. Add gold-standard local exercises first
      FALLBACK_EXERCISES.forEach(e => {
        const norm = e.name.toLowerCase().trim();
        seenNames.add(norm);
        merged.push(e);
      });

      // 2. Add parsedData1 (free-exercise-db)
      parsedData1.forEach(e => {
        const norm = e.name.toLowerCase().trim();
        if (!seenNames.has(norm)) {
          seenNames.add(norm);
          merged.push(e);
        }
      });

      // 3. Add parsedData2 (hasan-dataset)
      parsedData2.forEach(e => {
        const norm = e.name.toLowerCase().trim();
        if (!seenNames.has(norm)) {
          seenNames.add(norm);
          merged.push(e);
        }
      });

      // Sort
      merged.sort((a, b) => {
        const aPop = POPULAR_EXERCISES.some(p => a.name.toLowerCase().includes(p));
        const bPop = POPULAR_EXERCISES.some(p => b.name.toLowerCase().includes(p));
        if (aPop && !bPop) return -1;
        if (!aPop && bPop) return 1;
        return a.name.localeCompare(b.name);
      });

      const uniqueGroups = new Set(merged.map(e => e.muscle_group));
      const sortedGroups = ['All', ...Array.from(uniqueGroups).sort()];
      setMuscleGroups(sortedGroups);
      setExercises(merged);

      globalCachedMuscleGroups = sortedGroups;
      globalCachedExercises = merged;

    } catch (err) {
      console.log('Error fetching exercises:', err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // High performance memoized filtering
  const filtered = useMemo(() => {
    let baseList = exercises;

    // ADAPTIVE ENGINE: Map and filter based on Home Mode
    if (isHome) {
      baseList = exercises.map(ex => {
        // Check for specific home swap
        const swapInfo = EXERCISE_SWAP_MAP[ex.name.toLowerCase()];
        if (swapInfo && equipmentInventory.includes(swapInfo.equipment)) {
          return { ...ex, name: swapInfo.home, equipment_type: 'Home Equivalent', isSwapped: true };
        }
        return ex;
      }).filter(ex => {
        const eq = ex.equipment_type?.toLowerCase() || '';
        if (eq === 'home equivalent' || eq.includes('body') || eq === 'none') return true;
        
        // Match inventory
        if (eq.includes('dumbbell') && equipmentInventory.includes('dumbbells')) return true;
        if (eq.includes('band') && equipmentInventory.includes('resistance_bands')) return true;
        if (eq.includes('kettlebell') && equipmentInventory.includes('kettlebell')) return true;
        if (eq.includes('pull') && equipmentInventory.includes('pull_up_bar')) return true;

        // Filter out machines/cables/barbells in home mode if they don't have equivalent
        return false;
      });
    }

    return baseList.filter(e => {
      const matchesSearch = e.name?.toLowerCase().includes(search.toLowerCase());
      const matchesGroup = activeMuscle === 'All' || e.muscle_group?.toLowerCase() === activeMuscle.toLowerCase();
      const matchesDiff = activeDifficulty === 'All' || e.level?.toLowerCase() === activeDifficulty.toLowerCase();

      let matchesLocation = true;
      if (activeLocation === 'Home Workout') {
        const homeEq = ['body only', 'bands', 'none', 'home equivalent'];
        matchesLocation = homeEq.some(h => e.equipment_type?.toLowerCase().includes(h));
      } else if (activeLocation === 'Gym') {
        const gymEq = ['barbell', 'dumbbell', 'machine', 'cable', 'kettlebells', 'e-z curl bar'];
        matchesLocation = gymEq.some(g => e.equipment_type?.toLowerCase().includes(g));
      }

      return matchesSearch && matchesGroup && matchesDiff && matchesLocation;
    });
  }, [exercises, search, activeMuscle, activeDifficulty, activeLocation, isHome, equipmentInventory]);


  const handleCardPress = useCallback((item) => {
    setSelectedEx(item);
  }, []);

  const renderItem = useCallback(({ item, index, scrollY }) => (
    <ExerciseCard item={item} index={index} scrollY={scrollY} onPress={handleCardPress} />
  ), [handleCardPress]);

  const isAnyFilterActive = activeLocation !== 'All' || activeDifficulty !== 'All' || activeMuscle !== 'All';

  return (
    <View style={styles.screen}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 16, marginBottom: 12, paddingHorizontal: 24 }}>
        <View style={{
          flex: 1,
          flexDirection: 'row', alignItems: 'center', height: 50,
          backgroundColor: theme.colors.card, borderWidth: 1,
          borderColor: isFocused ? theme.colors.primary : theme.colors.border,
          borderRadius: 16, paddingHorizontal: 16, gap: 12,
          shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isFocused ? 0.15 : 0, shadowRadius: 8,
        }}>
          <Search color={isFocused ? theme.colors.primary : theme.colors.textMuted} size={18} />
          <TextInput
            placeholder={`${t('search_exercises')} (${exercises.length})`}
            placeholderTextColor={theme.colors.textMuted}
            style={{ flex: 1, color: theme.colors.text, fontSize: 15, fontFamily: 'Inter_500Medium' }}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
              <X color={theme.colors.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
          style={{
            width: 50,
            height: 50,
            borderRadius: 16,
            backgroundColor: isAnyFilterActive ? 'rgba(204,255,0,0.06)' : theme.colors.card,
            borderWidth: 1,
            borderColor: isAnyFilterActive ? theme.colors.primary : theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          <Filter color={isAnyFilterActive ? theme.colors.primary : theme.colors.textMuted} size={20} />
          {isAnyFilterActive && (
            <View style={{
              position: 'absolute', top: -3, right: -3,
              width: 14, height: 14, borderRadius: 7,
              backgroundColor: theme.colors.primary,
              justifyContent: 'center', alignItems: 'center'
            }}>
              <AppText weight="bold" style={{ color: '#000', fontSize: 8 }}>!</AppText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Ultra-Polished Sync/Loading Status Banner */}
      {isFetchingMore ? (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(204,255,0,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(204,255,0,0.25)',
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginHorizontal: 24,
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <ActivityIndicator color={theme.colors.primary} size="small" />
            <View style={{ flex: 1 }}>
              <AppText weight="bold" style={{ fontSize: 12, color: theme.colors.text }}>
                Mengambil 800+ Katalog Gerakan HD
              </AppText>
              <AppText style={{ fontSize: 10, color: theme.colors.primary, marginTop: 1 }}>
                ⚡ {exercises.length} gerakan siap di perpustakaan...
              </AppText>
            </View>
          </View>
          <View style={{ backgroundColor: 'rgba(204,255,0,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 0.5, borderColor: theme.colors.primary }}>
            <AppText style={{ fontSize: 9, color: theme.colors.primary, fontWeight: '900', letterSpacing: 0.5 }}>SYNCING</AppText>
          </View>
        </View>
      ) : showDoneBanner ? (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(0, 240, 255, 0.06)',
          borderWidth: 1,
          borderColor: 'rgba(0, 240, 255, 0.25)',
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 8,
          marginHorizontal: 24,
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 color="#00F0FF" size={16} />
            <AppText weight="bold" style={{ fontSize: 11, color: '#00F0FF' }}>
              Database Lengkap! Total {exercises.length} Gerakan HD Siap
            </AppText>
          </View>
          <Sparkles color="#00F0FF" size={14} />
        </View>
      ) : null}

      {loading ? (
        <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText style={{ color: theme.colors.textMuted, marginTop: 12 }}>Loading 2000+ HD Exercises...</AppText>
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <AppText weight="bold" style={{ fontSize: 18 }}>
              {search || isAnyFilterActive ? t('filtered_results') : t('popular_exercises')} ({filtered.length})
            </AppText>
          </View>

          <AnimatedFlashList
            data={filtered}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            estimatedItemSize={92}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Filter color={theme.colors.textMuted} size={32} style={{ marginBottom: 12 }} />
                <AppText style={{ color: theme.colors.textMuted }}>No exercises match your filters.</AppText>
              </View>
            }
          />
        </View>
      )}

      {/* Filter Bottom Sheet Modal */}
      <Modal visible={filterModalVisible} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ 
            backgroundColor: theme.colors.card, 
            borderTopLeftRadius: 28, 
            borderTopRightRadius: 28, 
            borderTopWidth: 1, 
            borderTopColor: theme.colors.border, 
            padding: 24, 
            maxHeight: '80%' 
          }}>
            <View style={{ width: 40, height: 4, backgroundColor: theme.colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.text }}>Filter Latihan</AppText>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={{ backgroundColor: theme.colors.inputBg, padding: 6, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border }}>
                <X color={theme.colors.textMuted} size={16} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Location */}
              <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 12 }}>{t('filter_location')}</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {LOCATIONS.map(item => {
                  const isActive = activeLocation === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setActiveLocation(item)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
                        backgroundColor: isActive ? 'rgba(204,255,0,0.08)' : theme.colors.surface,
                        borderWidth: 1, borderColor: isActive ? theme.colors.primary : theme.colors.border,
                      }}
                    >
                      <AppText weight="bold" style={{ color: isActive ? theme.colors.primary : theme.colors.textMuted, fontSize: 12 }}>
                        {item === 'All' ? 'Semua' : item}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Difficulty */}
              <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 12 }}>{t('filter_level')}</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {DIFFICULTIES.map(item => {
                  const isActive = activeDifficulty === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setActiveDifficulty(item)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
                        backgroundColor: isActive ? 'rgba(204,255,0,0.08)' : theme.colors.surface,
                        borderWidth: 1, borderColor: isActive ? theme.colors.primary : theme.colors.border,
                      }}
                    >
                      <AppText weight="bold" style={{ color: isActive ? theme.colors.primary : theme.colors.textMuted, fontSize: 12 }}>
                        {item === 'All' ? 'Semua' : item}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Target Muscle */}
              <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 12 }}>{t('filter_muscle')}</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {muscleGroups.map(item => {
                  const isActive = activeMuscle === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setActiveMuscle(item)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
                        backgroundColor: isActive ? 'rgba(204,255,0,0.08)' : theme.colors.surface,
                        borderWidth: 1, borderColor: isActive ? theme.colors.primary : theme.colors.border,
                      }}
                    >
                      <AppText weight="bold" style={{ color: isActive ? theme.colors.primary : theme.colors.textMuted, fontSize: 12 }}>
                        {item === 'All' ? 'Semua' : item}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={{
                  flex: 1, height: 48, borderRadius: 14, backgroundColor: theme.colors.surface,
                  justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border
                }}
                onPress={() => {
                  setActiveLocation('All');
                  setActiveDifficulty('All');
                  setActiveMuscle('All');
                }}
              >
                <AppText weight="bold" style={{ color: theme.colors.textMuted, fontSize: 14 }}>Reset</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1.5, height: 48, borderRadius: 14, backgroundColor: theme.colors.primary,
                  justifyContent: 'center', alignItems: 'center'
                }}
                onPress={() => setFilterModalVisible(false)}
              >
                <AppText weight="bold" style={{ color: '#000', fontSize: 14 }}>Terapkan</AppText>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Exercise Detail Modal */}
      <Modal visible={!!selectedEx} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderTopColor: theme.colors.border, padding: 24, maxHeight: '88%' }}>
            
            <View style={{ width: 40, height: 4, backgroundColor: theme.colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <AppText weight="bold" style={{ fontSize: 11, color: theme.colors.primary, letterSpacing: 1.5 }}>EXERCISE DETAILS</AppText>
              <TouchableOpacity onPress={() => setSelectedEx(null)} style={{ backgroundColor: theme.colors.inputBg, padding: 6, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border }}>
                <X color={theme.colors.textMuted} size={16} />
              </TouchableOpacity>
            </View>

            {selectedEx && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <View style={{ marginBottom: 24 }}>
                  <AnimatedExerciseImage images={selectedEx.images} />
                </View>

                <AppText weight="bold" style={{ fontSize: 22, marginBottom: 8, color: theme.colors.text }}>{selectedEx.name}</AppText>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  <View style={{ backgroundColor: 'rgba(204,255,0,0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(204,255,0,0.2)' }}>
                    <AppText style={{ fontSize: 12, color: theme.colors.primary, fontWeight: 'bold' }}>{selectedEx.level}</AppText>
                  </View>
                  <View style={{ backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 0.5, borderColor: theme.colors.border }}>
                    <AppText style={{ fontSize: 12, color: theme.colors.textMuted }}>{selectedEx.muscle_group}</AppText>
                  </View>
                  <View style={{ backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 0.5, borderColor: theme.colors.border }}>
                    <AppText style={{ fontSize: 12, color: theme.colors.textMuted }}>{selectedEx.equipment_type}</AppText>
                  </View>
                </View>

                <AppText weight="bold" style={{ fontSize: 15, color: theme.colors.text, marginBottom: 8 }}>{t('instructions')}</AppText>
                <AppText style={{ fontSize: 13, color: theme.colors.textMuted, lineHeight: 22 }}>
                  {selectedEx.instructions}
                </AppText>

                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.primary,
                    height: 52,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    marginTop: 32,
                    shadowColor: theme.colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 6
                  }}
                  onPress={() => {
                    const ex = selectedEx;
                    setSelectedEx(null);
                    if (onStartExercise) onStartExercise(ex);
                  }}
                >
                  <Dumbbell color={theme.colors.background} size={18} />
                  <AppText weight="bold" style={{ color: theme.colors.background, fontSize: 15, fontWeight: '700' }}>{t('add_to_logger')}</AppText>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <DummyAdBanner />
    </View>
  );
}
