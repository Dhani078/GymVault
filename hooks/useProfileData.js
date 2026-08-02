import { useState, useEffect, useMemo } from 'react';
import { safeSelect, safeUpsert } from '../supabaseClient';

export function useProfileData(session, dbReady) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    email: '',
    body_weight: 0,
    height: 0,
    cns_fatigue: 0,
    avatar_url: null,
  });
  const [sessions, setSessions] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [measurements, setMeasurements] = useState({ chest: '', biceps: '', waist: '' });
  const [nutritionGoals, setNutritionGoals] = useState({ target_calories: 0, target_protein: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user?.id && dbReady) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [session, dbReady]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await safeSelect('users_profile', {
        filters: { id: session.user.id },
        single: true,
      });

      if (profileErr) throw new Error('Failed to load profile.');

      if (profileData) {
        setProfile({
          name: profileData.name || session.user.user_metadata?.full_name || 'Athlete',
          username: profileData.username || '',
          email: profileData.email || session.user.email || '',
          body_weight: profileData.body_weight || 0,
          height: profileData.height || 0,
          cns_fatigue: profileData.cns_fatigue || 0,
          avatar_url: profileData.avatar_url || null,
        });
      }

      // 2. Fetch ALL sessions for Lifetime Stats & AI Engine
      const { data: sessionData, error: sessErr } = await safeSelect('workout_sessions', {
        columns: 'id, started_at, workout_sets(weight_kg, reps, is_checked)',
        filters: { user_id: session.user.id, is_completed: true },
      });

      if (sessErr) throw new Error('Failed to load workout history for AI Engine.');

      if (sessionData) {
        setSessions(sessionData);
      }
      
      // 3. Fetch Local Weight Logs
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const localWeights = await AsyncStorage.getItem(`weight_logs_${session.user.id}`);
        if (localWeights) {
          setWeightLogs(JSON.parse(localWeights));
        } else if (profileData && profileData.body_weight) {
          // Initialize with current weight if no logs exist
          const initialLog = [{ weight: profileData.body_weight, date: new Date().toISOString() }];
          await AsyncStorage.setItem(`weight_logs_${session.user.id}`, JSON.stringify(initialLog));
          setWeightLogs(initialLog);
        }
        
        // 4. Fetch Body Measurements
        const localMeasures = await AsyncStorage.getItem(`measurements_${session.user.id}`);
        if (localMeasures) setMeasurements(JSON.parse(localMeasures));
        
        // 5. Fetch Nutrition Goals
        const localGoals = await AsyncStorage.getItem(`nutrition_goals_${session.user.id}`);
        if (localGoals) setNutritionGoals(JSON.parse(localGoals));
        
      } catch (e) {}

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Optimistic Update function
  const updateProfile = async (updates) => {
    // 1. Optimistic UI update
    const previousProfile = { ...profile };
    setProfile(prev => ({ ...prev, ...updates }));

    // 2. Background DB write
    try {
      const payload = {
        id: session.user.id,
        ...profile, // existing
        ...updates, // new
      };
      
      // Update weight logs if weight changed
      if (updates.body_weight && updates.body_weight !== profile.body_weight) {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const newLogs = [...weightLogs, { weight: updates.body_weight, date: new Date().toISOString() }].slice(-30); // keep last 30
          await AsyncStorage.setItem(`weight_logs_${session.user.id}`, JSON.stringify(newLogs));
          setWeightLogs(newLogs);
        } catch (e) {}
      }
      
      const { error: upsertErr } = await safeUpsert('users_profile', payload);
      if (upsertErr) throw upsertErr;
      
      return { success: true };
    } catch (err) {
      // Rollback on failure
      setProfile(previousProfile);
      return { success: false, error: err.message };
    }
  };

  // Helper to save local JSON states
  const saveLocalState = async (key, value, setter) => {
    try {
      setter(value);
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(`${key}_${session.user.id}`, JSON.stringify(value));
    } catch (e) {}
  };

  const updateMeasurements = (newVals) => saveLocalState('measurements', { ...measurements, ...newVals }, setMeasurements);
  const updateNutritionGoals = (newVals) => saveLocalState('nutrition_goals', { ...nutritionGoals, ...newVals }, setNutritionGoals);

  // ─── AI COACH ENGINE (Memoized Aggregators) ───

  // [Injury Risk] Logic: Delta Week N vs Week N-1 > 40%
  const injuryRisk = useMemo(() => {
    if (!sessions || sessions.length === 0) return { risk: 'Low', message: 'Not enough data.' };

    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    let weekNVolume = 0;   // Last 7 days
    let weekN1Volume = 0;  // 8-14 days ago

    sessions.forEach(s => {
      const dateStr = s.started_at ? s.started_at.replace(' ', 'T') : '';
      const d = new Date(dateStr);
      let sessionVol = 0;
      (s.workout_sets || []).forEach(set => {
        if (set.is_checked) sessionVol += (set.weight_kg || 0) * (set.reps || 0);
      });

      if (d >= oneWeekAgo && d <= now) {
        weekNVolume += sessionVol;
      } else if (d >= twoWeeksAgo && d < oneWeekAgo) {
        weekN1Volume += sessionVol;
      }
    });

    if (weekN1Volume === 0 && weekNVolume > 0) return { risk: 'Moderate', message: 'Sudden spike from 0 volume.' };
    if (weekN1Volume === 0) return { risk: 'Low', message: 'Volume is stable.' };

    const delta = ((weekNVolume - weekN1Volume) / weekN1Volume) * 100;
    
    if (delta > 40) {
      return { risk: 'High', message: `Volume spiked by ${delta.toFixed(0)}%! Watch your joints.` };
    } else if (delta > 20) {
      return { risk: 'Moderate', message: `Volume up ${delta.toFixed(0)}%. Monitor fatigue.` };
    }
    
    return { risk: 'Low', message: 'Volume progression is optimal.' };
  }, [sessions]);

  // [Deload Suggester] Logic: CNS Fatigue trend
  const deloadSuggestion = useMemo(() => {
    // Since cns_fatigue is stored as a single integer (1-5) in the current schema representing the latest state,
    // we use it combined with workout frequency to synthesize a deload suggestion.
    const fatigueScore = profile.cns_fatigue;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const sessionsThisWeek = sessions.filter(s => {
      const dateStr = s.started_at ? s.started_at.replace(' ', 'T') : '';
      return new Date(dateStr) >= oneWeekAgo;
    }).length;

    if (fatigueScore >= 4) {
      return { status: 'Optimal', text: 'CNS is fresh. Ready to push PRs.' };
    } else if (fatigueScore === 3 && sessionsThisWeek > 4) {
      return { status: 'Warning', text: 'High frequency. Consider an active recovery day soon.' };
    } else if (fatigueScore < 3) {
      return { status: 'Danger', text: 'Deload Recommended. CNS fatigue is high (Score: < 3).' };
    }

    return { status: 'Good', text: 'Training state is balanced.' };
  }, [profile.cns_fatigue, sessions]);

  // General Stats
  const stats = useMemo(() => {
    let totalWorkouts = sessions.length;
    let totalVolume = 0;
    sessions.forEach(s => {
      (s.workout_sets || []).forEach(set => {
        if (set.is_checked) totalVolume += (set.weight_kg || 0) * (set.reps || 0);
      });
    });
    return { totalWorkouts, totalVolume };
  }, [sessions]);

  return { 
    profile, loading, error, sessions, updateProfile, 
    injuryRisk, deloadSuggestion, stats, weightLogs,
    measurements, updateMeasurements,
    nutritionGoals, updateNutritionGoals
  };
}
