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
import SmoothScrollView from '../components/SmoothScrollView';
import SkiaProgressRing from '../components/SkiaProgressRing';
import DummyAdBanner from '../components/DummyAdBanner';
import WaterTrackerWidget from '../components/WaterTrackerWidget';
import CnsReadinessWidget from '../components/CnsReadinessWidget';
import NutritionWidget from '../components/NutritionWidget';
import OfflineSyncBanner from '../components/OfflineSyncBanner';
import CustomRoutinesWidget from '../components/CustomRoutinesWidget';
import CommunitySocialFeedWidget from '../components/CommunitySocialFeedWidget';
import LeaderboardPreviewWidget from '../components/LeaderboardPreviewWidget';
import { formatShortDate } from '../utils/dateHelpers';
import { MotiView } from 'moti';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export default function DashboardScreen({ onStartWorkout, onStartRoutine, session, dbReady, hasActiveWorkout }) {
  const { t } = useTranslation();
  const { showNotification } = useDynamicIsland();
  const { mode, setMode, isHome, equipmentInventory, toggleEquipment } = useAppMode();
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  const [userProfile, setUserProfile] = useState(null);
  const [dbError, setDbError] = useState(false);


    const [quickLogText, setQuickLogText] = useState('');

  useEffect(() => {
    if (session?.user?.id) fetchDashboardData();

    const { DeviceEventEmitter } = require('react-native');
    const sub = DeviceEventEmitter.addListener('activity_logged', () => {
      if (session?.user?.id) fetchDashboardData();
    });
    return () => sub.remove();
  }, [session, dbReady]);

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
        columns: 'id, started_at, split_name, workout_sets(weight_kg, reps, is_checked, exercises(name, muscle_group))',
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

        const latestWorkoutStr = formatShortDate(sessions[0].started_at);

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


  const triggerRefresh = () => {
    fetchDashboardData();
  };


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

        <OfflineSyncBanner session={session} onSyncComplete={fetchDashboardData} />

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

        <LeaderboardPreviewWidget leaderboardData={leaderboardData} onShowLeaderboard={() => setShowLeaderboard(true)} />

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

        <CnsReadinessWidget 
          session={session}
          userProfile={userProfile}
          dbError={dbError}
          onStartWorkout={onStartWorkout}
        />

        {/* ═══ MUSCLE RECOVERY MAP ═══ */}
        <MuscleRecoveryMap completedSessions={completedSessions} session={session} />

        {/* ═══ NUTRITION WIDGET ═══ */}
        <NutritionWidget session={session} userProfile={userProfile} refreshTrigger={refreshing} />

        {/* ═══ WATER TRACKER ═══ */}
        <WaterTrackerWidget userProfile={userProfile} refreshTrigger={refreshing} />

        <CommunitySocialFeedWidget leaderboardData={leaderboardData} />

        <CustomRoutinesWidget session={session} dbReady={dbReady} onStartRoutine={onStartRoutine} />

      </MotiView>


      </SmoothScrollView>

      {/* Floating AI Coach Chat Bubble */}
      <AIChatBubble />

      {/* AI Routine Generator Modal */}
      <AIRoutineModal 
        visible={aiModalVisible} 
        onClose={() => setAiModalVisible(false)} 
        onStartRoutine={onStartRoutine}
        cnsScore={userProfile?.cns_fatigue || 3}
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
      
      {/* Sticky Bottom Ad Banner */}
      <DummyAdBanner />
    </View>
  );
}
