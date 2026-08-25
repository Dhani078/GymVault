import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import {
  User, Target, Activity, Zap, TrendingUp, AlertTriangle, CheckCircle,
  XCircle, Settings, Clock, Flame, Award, ChevronRight, Crown
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { AppText, styles, theme } from '../theme';
import { useProfileData } from '../hooks/useProfileData';
import { supabase, safeSelect } from '../supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDynamicIsland } from '../contexts/DynamicIslandContext';
import SmoothScrollView from '../components/SmoothScrollView';
import DummyAdBanner from '../components/DummyAdBanner';

// Subcomponents
import DailyCheckInCard from '../components/profile/DailyCheckInCard';
import TrophyCabinet from '../components/profile/TrophyCabinet';
import ShareVolumeModal from '../components/profile/ShareVolumeModal';
import RedeemCodeModal from '../components/profile/RedeemCodeModal';
import TdeeCalculatorModal from '../components/profile/TdeeCalculatorModal';
import EditProfileModal from '../components/profile/EditProfileModal';
import SettingsModal from '../components/profile/SettingsModal';

const parseLocalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateCheckInStreak = (historyList) => {
  if (!historyList || !Array.isArray(historyList) || historyList.length === 0) return 0;
  const uniqueDates = Array.from(new Set(historyList)).filter(Boolean).sort();
  if (uniqueDates.length === 0) return 0;

  const todayStr = getLocalDateString();
  const todayDate = parseLocalDate(todayStr);
  const latestDateStr = uniqueDates[uniqueDates.length - 1];
  const latestDate = parseLocalDate(latestDateStr);
  const diffDays = Math.round((todayDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 2) return 0;

  let streak = 1;
  for (let i = uniqueDates.length - 1; i > 0; i--) {
    const curr = parseLocalDate(uniqueDates[i]);
    const prev = parseLocalDate(uniqueDates[i - 1]);
    const gap = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (gap <= 2) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

// Toast notification
const Toast = ({ visible, type, message }) => {
  if (!visible) return null;
  const isError = type === 'error';
  return (
    <View style={{
      position: 'absolute', top: 50, left: 24, right: 24, zIndex: 999,
      backgroundColor: isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(204, 255, 0, 0.95)',
      padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
    }}>
      {isError ? <XCircle color="#FFF" size={24} /> : <CheckCircle color="#000" size={24} />}
      <AppText weight="bold" style={{ color: isError ? '#FFF' : '#000', flex: 1 }}>{message}</AppText>
    </View>
  );
};

const SkeletonBox = ({ width, height, borderRadius = 8, style }) => (
  <View style={[{ width, height, borderRadius, backgroundColor: theme.colors.border, overflow: 'hidden' }, style]}>
    <View style={{ width: '100%', height: '100%', backgroundColor: theme.colors.inputBg, opacity: 0.5 }} />
  </View>
);

export default function ProfileScreen({ session, dbReady, onGoToHistory }) {
  const {
    profile, loading, sessions, updateProfile, injuryRisk, deloadSuggestion,
    stats, weightLogs, measurements, updateMeasurements, nutritionGoals, updateNutritionGoals
  } = useProfileData(session, dbReady);
  const { showNotification } = useDynamicIsland();
  const themeContext = useTheme();
  const { darkMode, proMode } = themeContext;
  const languageContext = useTranslation();
  const { t } = languageContext;

  const [toast, setToast] = useState({ visible: false, type: '', message: '' });
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [tdeeModalVisible, setTdeeModalVisible] = useState(false);
  const [shareVolumeModalVisible, setShareVolumeModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', weight: '', height: '', chest: '', biceps: '', waist: '' });
  const [weightUnit, setWeightUnit] = useState('metric');
  const [notifications, setNotifications] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);
  const [healthKitConnected, setHealthKitConnected] = useState(false);

  // Daily Check-in States
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [checkInHistory, setCheckInHistory] = useState([]);
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false);

  // Premium status
  const [isPremium, setIsPremium] = useState(false);
  const [premiumUntilDate, setPremiumUntilDate] = useState('');

  const showToast = (type, message) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: '', message: '' }), 3000);
  };

  const loadCheckInStatus = async () => {
    try {
      if (!session?.user?.id) return;
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const today = getLocalDateString();
      const historyStr = await AsyncStorage.getItem(`checkin_history_${session.user.id}`);
      const history = historyStr ? JSON.parse(historyStr) : [];
      setCheckInHistory(history);
      
      const isCheckedIn = history.includes(today);
      setCheckedInToday(isCheckedIn);
      if (!isCheckedIn) setShowCheckInPrompt(true);
      
      const streak = calculateCheckInStreak(history);
      setCheckInStreak(streak);
      await AsyncStorage.setItem(`checkin_streak_${session.user.id}`, String(streak));
    } catch (e) {}
  };

  const handleDailyCheckIn = async () => {
    try {
      if (!session?.user?.id) return;
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const today = getLocalDateString();
      const userId = session.user.id;
      
      if (checkInHistory.includes(today)) {
        Alert.alert("Sudah Check-In", "Anda sudah melakukan check-in hari ini! Kembali lagi besok.");
        return;
      }
      
      const newHistory = Array.from(new Set([...checkInHistory, today])).sort();
      await AsyncStorage.setItem(`checkin_history_${userId}`, JSON.stringify(newHistory));
      setCheckInHistory(newHistory);
      setCheckedInToday(true);
      
      const streak = calculateCheckInStreak(newHistory);
      setCheckInStreak(streak);
      await AsyncStorage.setItem(`checkin_streak_${userId}`, String(streak));
      
      showNotification({
        type: 'fire',
        title: 'Check-In Sukses! 🔥',
        subtitle: `Streak ${streak} Hari • Limit AI 15x Aktif!`,
        duration: 5000
      });
    } catch (e) {
      Alert.alert("Gagal", "Terjadi kesalahan saat melakukan check-in.");
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadCheckInStatus();
    }
  }, [session]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        weight: profile.body_weight ? profile.body_weight.toString() : '',
        height: profile.height ? profile.height.toString() : '',
        chest: measurements?.chest || '',
        biceps: measurements?.biceps || '',
        waist: measurements?.waist || '',
      });
      setIsPremium(profile.is_premium || false);
      if (profile.premium_until) {
        setPremiumUntilDate(new Date(profile.premium_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }));
      }
    }
  }, [profile, measurements]);

  const handleSaveProfile = async () => {
    const weightNum = parseFloat(editForm.weight);
    const heightNum = parseFloat(editForm.height);

    if (isNaN(weightNum) || isNaN(heightNum) || !editForm.name.trim()) {
      showToast('error', t('toast_please_fill_all_fiel'));
      return;
    }

    const { success, error } = await updateProfile({
      name: editForm.name.trim(),
      body_weight: weightNum,
      height: heightNum
    });

    if (success) {
      if (updateMeasurements) {
        updateMeasurements({
          chest: editForm.chest.trim(),
          biceps: editForm.biceps.trim(),
          waist: editForm.waist.trim()
        });
      }
      showToast('success', t('toast_profile_updated_succ'));
    } else {
      showToast('error', error || 'Failed to save profile.');
    }
  };

  const handlePickAvatar = async () => {
    setSettingsVisible(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast('error', t('toast_permission_to_access'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const { success, error } = await updateProfile({ avatar_url: base64Image });
      if (success) {
        showToast('success', t('toast_avatar_success'));
      } else {
        showToast('error', error || t('toast_avatar_fail'));
      }
    }
  };

  const handleHealthKitToggle = async () => {
    const nextVal = !healthKitConnected;
    setHealthKitConnected(nextVal);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(`health_kit_connected_${session?.user?.id}`, String(nextVal));
      showToast('success', nextVal ? 'Health Kit Connected' : 'Health Kit Disconnected');
    } catch (e) {}
  };

  const handleResetPassword = async () => {
    const email = profile.email || session?.user?.email;
    if (!email) { showToast('error', t('toast_pass_req')); return; }
    setSettingsVisible(false);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) showToast('error', error.message);
    else showToast('success', t('toast_pass_sent'));
  };

  const handleSignOut = async () => {
    const doLogout = async () => {
      setSettingsVisible(false);
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('@supabase.auth.token');
      } catch (e) {}
      await supabase.auth.signOut();
      const { DeviceEventEmitter } = require('react-native');
      DeviceEventEmitter.emit('offline_login', null);
    };

    if (Platform.OS === 'web') {
      await doLogout();
    } else {
      Alert.alert(t('alert_logout_title'), t('alert_logout_msg'), [
        { text: t('alert_cancel'), style: 'cancel' },
        { text: t('logout'), style: 'destructive', onPress: doLogout }
      ]);
    }
  };

  const handleExportData = async () => {
    try {
      const { data } = await safeSelect('workout_sessions', {
        columns: '*, workout_sets(weight_kg, reps, is_checked)',
        filters: { user_id: session.user.id, is_completed: true },
      });
      if (!data || data.length === 0) { showToast('error', t('export_empty')); return; }
      const json = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'gymvault_export.json'; a.click();
        URL.revokeObjectURL(url);
      } else {
        const FileSystem = require('expo-file-system');
        const Sharing = require('expo-sharing');
        const fileUri = FileSystem.documentDirectory + 'gymvault_export.json';
        await FileSystem.writeAsStringAsync(fileUri, json);
        await Sharing.shareAsync(fileUri);
      }
      showToast('success', t('export_success'));
    } catch (e) { showToast('error', e.message); }
  };

  const handleNotificationToggle = async () => {
    const next = !notifications;
    setNotifications(next);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('notifications_enabled', String(next));
      showToast('success', next ? t('toast_notifications_on') : t('toast_notifications_off'));
    } catch (err) {}
  };

  const getBmi = () => {
    if (!profile.body_weight || !profile.height) return '0.0';
    const hM = profile.height / 100;
    return (profile.body_weight / (hM * hM)).toFixed(1);
  };

  const cardColor = darkMode ? '#111111' : '#FFFFFF';
  const borderColor = darkMode ? '#222222' : '#E5E7EB';
  const textColor = darkMode ? '#FFFFFF' : '#000000';
  const textMuted = darkMode ? '#888888' : '#6B7280';
  const bgColor = darkMode ? '#000000' : '#F9FAFB';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <Toast visible={toast.visible} type={toast.type} message={toast.message} />

      <SmoothScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        
        {/* Profile Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.inputBg, overflow: 'hidden', borderWidth: 2, borderColor: '#CCFF00', justifyContent: 'center', alignItems: 'center' }}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <User color="#CCFF00" size={32} />
              )}
            </View>
            <View>
              <AppText weight="bold" style={{ fontSize: 20, color: textColor }}>{profile?.name || 'Athlete'}</AppText>
              <AppText style={{ fontSize: 13, color: textMuted }}>@{profile?.username || 'gymvault_user'}</AppText>
              {isPremium && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Crown color="#CCFF00" size={14} />
                  <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 11 }}>PRO LIFTER</AppText>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: cardColor, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: borderColor }}
          >
            <Settings color={textColor} size={20} />
          </TouchableOpacity>
        </View>

        {/* Body Metrics */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setEditModalVisible(true)}
            style={{ flex: 1, backgroundColor: cardColor, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: borderColor }}
          >
            <AppText style={{ color: textMuted, fontSize: 11, marginBottom: 4 }}>BERAT BADAN</AppText>
            <AppText weight="bold" style={{ color: textColor, fontSize: 18 }}>{profile?.body_weight || '--'} <AppText style={{ fontSize: 12, color: textMuted }}>kg</AppText></AppText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setEditModalVisible(true)}
            style={{ flex: 1, backgroundColor: cardColor, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: borderColor }}
          >
            <AppText style={{ color: textMuted, fontSize: 11, marginBottom: 4 }}>TINGGI BADAN</AppText>
            <AppText weight="bold" style={{ color: textColor, fontSize: 18 }}>{profile?.height || '--'} <AppText style={{ fontSize: 12, color: textMuted }}>cm</AppText></AppText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setTdeeModalVisible(true)}
            style={{ flex: 1, backgroundColor: cardColor, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#CCFF00' }}
          >
            <AppText style={{ color: '#CCFF00', fontSize: 11, marginBottom: 4 }}>BMI / TDEE</AppText>
            <AppText weight="bold" style={{ color: textColor, fontSize: 18 }}>{getBmi()}</AppText>
          </TouchableOpacity>
        </View>

        {/* ─── Daily Check-In Card ─── */}
        <DailyCheckInCard
          checkedInToday={checkedInToday}
          checkInStreak={checkInStreak}
          showCheckInPrompt={showCheckInPrompt}
          setShowCheckInPrompt={setShowCheckInPrompt}
          onCheckIn={handleDailyCheckIn}
          cardColor={cardColor}
          borderColor={borderColor}
          textColor={textColor}
          textMuted={textMuted}
        />

        {/* ─── Deload & Injury Risk ─── */}
        <View style={{ backgroundColor: darkMode ? 'rgba(204, 255, 0, 0.05)' : '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: deloadSuggestion.status === 'Danger' ? '#EF4444' : (darkMode ? 'rgba(204, 255, 0, 0.2)' : '#E5E7EB'), marginBottom: 16, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: deloadSuggestion.status === 'Danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(204, 255, 0, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            {deloadSuggestion.status === 'Danger' ? <AlertTriangle color="#EF4444" size={24} /> : <Zap color="#CCFF00" size={24} />}
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" style={{ color: textColor, fontSize: 16, marginBottom: 4 }}>{t('recovery_status')}</AppText>
            {loading ? <SkeletonBox width="80%" height={16} /> : (
              <AppText style={{ color: textMuted, fontSize: 13, lineHeight: 18 }}>{deloadSuggestion.text}</AppText>
            )}
          </View>
        </View>

        {/* ─── Lifetime Stats ─── */}
        <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 12 }}>{t('lifetime_stats')}</AppText>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
          <View style={{ flex: 1, backgroundColor: cardColor, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: borderColor }}>
            <Target color="#CCFF00" size={20} style={{ marginBottom: 12 }} />
            {loading ? <SkeletonBox width={40} height={24} style={{ marginBottom: 4 }} /> : (
              <AppText weight="bold" style={{ color: textColor, fontSize: 24, fontVariant: ['tabular-nums'], marginBottom: 2 }}>{stats.totalWorkouts || 0}</AppText>
            )}
            <AppText style={{ color: textMuted, fontSize: 12 }}>{t('total_sessions')}</AppText>
          </View>

          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setShareVolumeModalVisible(true)}
            style={{ flex: 1, backgroundColor: cardColor, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: borderColor }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <TrendingUp color="#CCFF00" size={20} />
              <View style={{ backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 10 }}>SHARE</AppText>
              </View>
            </View>
            {loading ? <SkeletonBox width={60} height={24} style={{ marginBottom: 4 }} /> : (
              <AppText weight="bold" style={{ color: textColor, fontSize: 24, fontVariant: ['tabular-nums'], marginBottom: 2 }}>{((stats.totalVolume || 0) / 1000).toFixed(1)}k</AppText>
            )}
            <AppText style={{ color: textMuted, fontSize: 12 }}>{t('volume')}</AppText>
          </TouchableOpacity>
        </View>

        {/* ─── Trophy Cabinet ─── */}
        <TrophyCabinet
          stats={stats}
          checkInStreak={checkInStreak}
          cardColor={cardColor}
          borderColor={borderColor}
          textColor={textColor}
          textMuted={textMuted}
          t={t}
        />

        {/* View History Button */}
        <TouchableOpacity
          style={{ backgroundColor: cardColor, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: borderColor, marginBottom: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2 }}
          onPress={onGoToHistory}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center' }}>
              <Clock color={textColor} size={22} />
            </View>
            <View>
              <AppText weight="bold" style={{ color: textColor, fontSize: 16 }}>{t('history_title')}</AppText>
              <AppText style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>{t('history_desc')}</AppText>
            </View>
          </View>
          <ChevronRight color={textMuted} size={20} />
        </TouchableOpacity>

      </SmoothScrollView>

      {/* ─── MODALS ─── */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        session={session}
        profile={profile}
        updateProfile={updateProfile}
        themeContext={themeContext}
        languageContext={languageContext}
        notifications={notifications}
        handleNotificationToggle={handleNotificationToggle}
        privateMode={privateMode}
        setPrivateMode={setPrivateMode}
        weightUnit={weightUnit}
        setWeightUnit={setWeightUnit}
        healthKitConnected={healthKitConnected}
        handleHealthKitToggle={handleHealthKitToggle}
        handlePickAvatar={handlePickAvatar}
        handleResetPassword={handleResetPassword}
        handleSignOut={handleSignOut}
        handleExportData={handleExportData}
        onOpenRedeemModal={() => setRedeemModalVisible(true)}
        onOpenEditModal={() => setEditModalVisible(true)}
        showToast={showToast}
        cardColor={cardColor}
        borderColor={borderColor}
        bgColor={bgColor}
        textColor={textColor}
        textMuted={textMuted}
      />

      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSaveProfile}
        t={t}
        cardColor={cardColor}
        borderColor={borderColor}
        textColor={textColor}
        textMuted={textMuted}
      />

      <TdeeCalculatorModal
        visible={tdeeModalVisible}
        onClose={() => setTdeeModalVisible(false)}
        profile={profile}
        nutritionGoals={nutritionGoals}
        updateNutritionGoals={updateNutritionGoals}
        showToast={showToast}
        cardColor={cardColor}
        borderColor={borderColor}
        textColor={textColor}
        textMuted={textMuted}
        darkMode={darkMode}
      />

      <RedeemCodeModal
        visible={redeemModalVisible}
        onClose={() => setRedeemModalVisible(false)}
        session={session}
        onSuccess={() => setIsPremium(true)}
        showToast={showToast}
        cardColor={cardColor}
        borderColor={borderColor}
        textColor={textColor}
        textMuted={textMuted}
      />

      <ShareVolumeModal
        visible={shareVolumeModalVisible}
        onClose={() => setShareVolumeModalVisible(false)}
        sessions={sessions}
        stats={stats}
        profile={profile}
      />

      <DummyAdBanner />
    </View>
  );
}
