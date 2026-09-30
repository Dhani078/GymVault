import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable, ScrollView, Modal, Alert, Platform, Image, Dimensions } from 'react-native';
import { 
  Dumbbell, Flame, Trophy, Crown, Sparkles, Share2, Download, Copy, 
  Check, X, Clock, Zap, CheckCircle2, Award, Shield, BarChart3
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { AppText, theme } from '../../theme';
import { getVolumeComparison } from '../../utils/volumeComparison';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── 7 LUXURY TEMPLATE THEMES FOR IG & TIKTOK ───
const TEMPLATES = [
  {
    id: 'cyber_neon',
    name: 'Cyber Neon',
    tag: 'Signature',
    bgColors: ['#0A0A0C', '#000000', '#111403'],
    primaryColor: '#D4F53C',
    accentColor: '#A3E635',
    textColor: '#FFFFFF',
    textMuted: '#94A3B8',
    cardBg: 'rgba(212,245,60,0.06)',
    borderColor: '#D4F53C',
    hudBorder: 'rgba(212,245,60,0.3)',
    badgeBg: 'rgba(212,245,60,0.15)',
    styleType: 'cyber'
  },
  {
    id: 'savage_beast',
    name: 'Savage Beast',
    tag: 'TikTok Viral',
    bgColors: ['#1C0707', '#0A0000', '#2E0808'],
    primaryColor: '#EF4444',
    accentColor: '#F97316',
    textColor: '#FFFFFF',
    textMuted: '#FCA5A5',
    cardBg: 'rgba(239,68,68,0.08)',
    borderColor: '#EF4444',
    hudBorder: 'rgba(239,68,68,0.35)',
    badgeBg: 'rgba(239,68,68,0.2)',
    styleType: 'beast'
  },
  {
    id: 'editorial_luxury',
    name: 'Editorial Platinum',
    tag: 'IG Aesthetic',
    bgColors: ['#0B0F19', '#030712', '#0F172A'],
    primaryColor: '#F59E0B',
    accentColor: '#FBBF24',
    textColor: '#F8FAFC',
    textMuted: '#94A3B8',
    cardBg: 'rgba(245,158,11,0.06)',
    borderColor: '#F59E0B',
    hudBorder: 'rgba(245,158,11,0.25)',
    badgeBg: 'rgba(245,158,11,0.15)',
    styleType: 'editorial'
  },
  {
    id: 'acid_y2k',
    name: 'Y2K Streetwear',
    tag: 'Brutalist',
    bgColors: ['#000000', '#0D1117', '#000000'],
    primaryColor: '#CCFF00',
    accentColor: '#00F0FF',
    textColor: '#FFFFFF',
    textMuted: '#A1A1AA',
    cardBg: '#121214',
    borderColor: '#CCFF00',
    hudBorder: '#333333',
    badgeBg: '#CCFF00',
    badgeTextColor: '#000000',
    styleType: 'y2k'
  },
  {
    id: 'retro_sunset',
    name: 'Synthwave 80s',
    tag: 'Vibrant',
    bgColors: ['#3B0764', '#1E1B4B', '#020617'],
    primaryColor: '#EC4899',
    accentColor: '#06B6D4',
    textColor: '#FFFFFF',
    textMuted: '#E2E8F0',
    cardBg: 'rgba(236,72,153,0.1)',
    borderColor: '#EC4899',
    hudBorder: 'rgba(6,182,212,0.4)',
    badgeBg: 'rgba(236,72,153,0.25)',
    styleType: 'synthwave'
  },
  {
    id: 'strava_pro',
    name: 'Athletic Pro',
    tag: 'Performance',
    bgColors: ['#18181B', '#09090B', '#111113'],
    primaryColor: '#FF5722',
    accentColor: '#FF8A65',
    textColor: '#FFFFFF',
    textMuted: '#A1A1AA',
    cardBg: 'rgba(255,87,34,0.08)',
    borderColor: '#FF5722',
    hudBorder: 'rgba(255,87,34,0.3)',
    badgeBg: 'rgba(255,87,34,0.2)',
    styleType: 'strava'
  },
  {
    id: 'anime_shonen',
    name: 'Shonen Overload',
    tag: 'Power 9000+',
    bgColors: ['#1E1B4B', '#0F172A', '#172554'],
    primaryColor: '#38BDF8',
    accentColor: '#A855F7',
    textColor: '#FFFFFF',
    textMuted: '#BAE6FD',
    cardBg: 'rgba(56,189,248,0.1)',
    borderColor: '#38BDF8',
    hudBorder: 'rgba(168,85,247,0.4)',
    badgeBg: 'rgba(56,189,248,0.25)',
    styleType: 'anime'
  }
];

// ─── STICKER / MOOD CHOICES ───
const MOOD_STICKERS = [
  '🔥 PR Smashed',
  '🦍 Beast Mode',
  '💀 Leg Day Survivor',
  '⚡ Discipline > Motivation',
  '🏆 100% Failure',
  '🚀 Consistency Win'
];

export default function WorkoutSummaryModal({
  visible,
  workoutData = [],
  totalCompleted = 0,
  workoutStartTime = null,
  session = null,
  newPRs = [],
  onClose,
  onFinish,
  showInterstitialAd
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('cyber_neon');
  const [selectedRatio, setSelectedRatio] = useState('story'); // 'story' (9:16) | 'post' (4:5) | 'square' (1:1)
  const [selectedSticker, setSelectedSticker] = useState('🔥 PR Smashed');
  const [userName, setUserName] = useState('Athlete');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  const viewShotRef = useRef(null);

  useEffect(() => {
    if (visible) {
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Athlete';
        setUserName(name);
      }
      if (newPRs && newPRs.length > 0) {
        setSelectedSticker('🔥 PR Smashed');
      }
    }
  }, [visible, session, newPRs]);

  if (!visible) return null;

  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];

  // Calculate training volume
  const totalVolume = Math.round(workoutData.reduce((acc, ex) => (
    acc + (ex.sets || []).reduce((sAcc, s) => {
      const w = Number(s.kg) || 0;
      const r = Number(s.reps) || 0;
      return sAcc + (s.completed ? w * r : 0);
    }, 0)
  ), 0));

  // Calculate workout duration in minutes
  const workoutDurationMinutes = (() => {
    if (!workoutStartTime) return 45;
    try {
      const start = new Date(workoutStartTime).getTime();
      const now = Date.now();
      const diffMins = Math.max(1, Math.round((now - start) / (1000 * 60)));
      return diffMins > 240 ? 60 : diffMins; // cap if runaway timer
    } catch (e) {
      return 45;
    }
  })();

  const exerciseNames = workoutData.map(e => e.name).filter(Boolean);
  const mainSplitName = exerciseNames.slice(0, 3).join(' • ') + (exerciseNames.length > 3 ? ' +' : '');

  const funComparison = getVolumeComparison(totalVolume) || 'Setara mengangkat beban luar biasa!';

  const formattedDate = (() => {
    const d = new Date();
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  })();

  const handleDone = () => {
    if (typeof onClose === 'function') onClose();
    const finishAction = () => {
      if (typeof onFinish === 'function') onFinish();
    };
    if (typeof showInterstitialAd === 'function') {
      const shown = showInterstitialAd(finishAction);
      if (!shown) finishAction();
    } else {
      finishAction();
    }
  };

  const handleShare = async () => {
    try {
      if (!viewShotRef.current?.capture) return;
      const uri = await viewShotRef.current.capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Bagikan Latihan GymVault ke Instagram / TikTok',
          UTI: 'public.png'
        });
      } else {
        Alert.alert("Perangkat Tidak Mendukung Sharing", "Silakan gunakan tombol Simpan Gambar.");
      }
    } catch (e) {
      Alert.alert("Gagal Share", e.message || 'Terjadi kesalahan saat membagikan story.');
    }
  };

  const handleSaveToGallery = async () => {
    setSavingImage(true);
    try {
      if (!viewShotRef.current?.capture) return;
      const uri = await viewShotRef.current.capture();

      if (Platform.OS === 'web') {
        // Direct browser download
        const a = document.createElement('a');
        a.href = uri;
        a.download = `gymvault_workout_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        Alert.alert("Berhasil Diunduh! 📸", "Gambar story latihan Anda telah tersimpan di folder Downloads.");
      } else {
        // Native photo library save
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert("Tersimpan di Galeri! 📸", "Story latihan GymVault siap Anda upload ke Instagram & TikTok!");
        } else {
          Alert.alert("Izin Ditolak", "GymVault butuh izin akses galeri untuk menyimpan foto.");
        }
      }
    } catch (e) {
      Alert.alert("Gagal Menyimpan", e.message || "Terjadi kesalahan sistem.");
    } finally {
      setSavingImage(false);
    }
  };

  const handleCopyCaption = () => {
    const prLines = newPRs && newPRs.length > 0
      ? `\n🏆 REKOR PR RESMI:\n${newPRs.map(p => `• ${p.exercise_name}: ${p.new1RM}kg Est. 1RM (${p.weight_kg}kg × ${p.reps} reps${p.diff1RM > 0 ? ` · +${p.diff1RM}kg` : ''})`).join('\n')}\n`
      : '';

    const captionText = 
`🔥 WORKOUT COMPLETED WITH @GymVault
🏋️ Sesi: ${mainSplitName || 'Strength Training'}
📊 Total Volume: ${totalVolume.toLocaleString('id-ID')} kg
⚡ Sets Diselesaikan: ${totalCompleted} Sets
⏱️ Durasi: ${workoutDurationMinutes} Menit
🦍 Rekor: ${funComparison}${prLines}
Mood: ${selectedSticker}

#GymVault #WorkoutMotivation #GymLife #FitnessIndonesia #GymStory #NoExcuses`;

    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(captionText);
    } else {
      const { Clipboard } = require('react-native');
      Clipboard?.setString?.(captionText);
    }

    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 3000);
  };

  // Card dimensions based on aspect ratio
  const getCardAspectRatio = () => {
    if (selectedRatio === 'story') return 9 / 16;
    if (selectedRatio === 'post') return 4 / 5;
    return 1;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' }}>
        
        {/* Top Header Bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 48, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#222' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sparkles color="#D4F53C" size={20} />
            <AppText weight="bold" style={{ color: '#FFF', fontSize: 17, letterSpacing: 0.5 }}>Share Story GymVault</AppText>
          </View>
          <Pressable onPress={handleDone} style={{ padding: 6, backgroundColor: '#1A1A1E', borderRadius: 20 }}>
            <X color="#AAA" size={20} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* ═══ 1. ASPECT RATIO SELECTOR ═══ */}
          <View style={{ flexDirection: 'row', backgroundColor: '#141418', borderRadius: 14, padding: 4, marginBottom: 16, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: '#2A2A30' }}>
            {[
              { id: 'story', label: '📱 Story / TikTok (9:16)' },
              { id: 'post', label: '📸 Feed (4:5)' },
              { id: 'square', label: '⏹️ Square (1:1)' }
            ].map(r => (
              <Pressable
                key={r.id}
                onPress={() => setSelectedRatio(r.id)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: selectedRatio === r.id ? '#D4F53C' : 'transparent'
                }}
              >
                <AppText weight="bold" style={{ fontSize: 11, color: selectedRatio === r.id ? '#000' : '#888' }}>
                  {r.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          {/* ═══ 2. TEMPLATE SELECTOR (HORIZONTALLY SCROLLABLE) ═══ */}
          <View style={{ width: '100%', maxWidth: 380, marginBottom: 16 }}>
            <AppText weight="bold" style={{ color: '#888', fontSize: 11, letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 }}>
              PILIH TEMPLATE SOCIAL ({TEMPLATES.length} GAYA DESAIN):
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
              {TEMPLATES.map(tmpl => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <Pressable
                    key={tmpl.id}
                    onPress={() => setSelectedTemplateId(tmpl.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      backgroundColor: isSelected ? 'rgba(212,245,60,0.15)' : '#18181C',
                      borderWidth: 1.5,
                      borderColor: isSelected ? tmpl.primaryColor : '#2A2A32'
                    }}
                  >
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tmpl.primaryColor }} />
                    <View>
                      <AppText weight="bold" style={{ color: isSelected ? '#FFF' : '#AAA', fontSize: 12 }}>
                        {tmpl.name}
                      </AppText>
                      <AppText style={{ color: tmpl.primaryColor, fontSize: 9 }}>{tmpl.tag}</AppText>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ═══ 3. STICKER / VIBE PICKER ═══ */}
          <View style={{ width: '100%', maxWidth: 380, marginBottom: 20 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
              {MOOD_STICKERS.map(st => (
                <Pressable
                  key={st}
                  onPress={() => setSelectedSticker(st)}
                  style={{
                    backgroundColor: selectedSticker === st ? 'rgba(255,255,255,0.12)' : '#121216',
                    borderWidth: 1,
                    borderColor: selectedSticker === st ? '#D4F53C' : '#222',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20
                  }}
                >
                  <AppText weight="bold" style={{ color: selectedSticker === st ? '#D4F53C' : '#888', fontSize: 11 }}>
                    {st}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ═══ 4. THE CAPTURED VIEWSHOT STORY CARD ═══ */}
          <View style={{ width: '100%', maxWidth: 360, alignItems: 'center' }}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0 }}
              style={{
                width: '100%',
                aspectRatio: getCardAspectRatio(),
                borderRadius: 24,
                overflow: 'hidden',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
                elevation: 10
              }}
            >
              <LinearGradient
                colors={currentTemplate.bgColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  padding: 22,
                  justifyContent: 'space-between',
                  borderWidth: 1.5,
                  borderColor: currentTemplate.hudBorder,
                  borderRadius: 24,
                  position: 'relative'
                }}
              >
                {/* Background Cyber Grid Accent */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: currentTemplate.primaryColor }} />

                {/* ── CARD HEADER ── */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ 
                      width: 38, height: 38, borderRadius: 19, 
                      backgroundColor: currentTemplate.badgeBg, 
                      justifyContent: 'center', alignItems: 'center',
                      borderWidth: 1, borderColor: currentTemplate.hudBorder 
                    }}>
                      <Dumbbell color={currentTemplate.primaryColor} size={20} />
                    </View>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <AppText weight="bold" style={{ color: currentTemplate.textColor, fontSize: 16, letterSpacing: 0.5 }}>
                          GymVault
                        </AppText>
                        <View style={{ backgroundColor: currentTemplate.primaryColor, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}>
                          <AppText weight="bold" style={{ color: '#000', fontSize: 8 }}>PRO</AppText>
                        </View>
                      </View>
                      <AppText style={{ color: currentTemplate.textMuted, fontSize: 10, letterSpacing: 1.5 }}>
                        SESSION RECAP • {currentTemplate.styleType.toUpperCase()}
                      </AppText>
                    </View>
                  </View>

                  {/* Mood Sticker Badge */}
                  <View style={{ 
                    backgroundColor: currentTemplate.badgeBg, 
                    borderWidth: 1, 
                    borderColor: currentTemplate.hudBorder, 
                    paddingHorizontal: 10, 
                    paddingVertical: 5, 
                    borderRadius: 14 
                  }}>
                    <AppText weight="bold" style={{ color: currentTemplate.primaryColor, fontSize: 11 }}>
                      {selectedSticker}
                    </AppText>
                  </View>
                </View>

                {/* ── ATHLETE & WORKOUT TITLE ── */}
                <View style={{ marginVertical: 8 }}>
                  <AppText style={{ color: currentTemplate.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                    ATHLETE: {userName}
                  </AppText>
                  <AppText weight="bold" style={{ color: currentTemplate.textColor, fontSize: 24, lineHeight: 28 }}>
                    {mainSplitName || 'Total Body Overload'}
                  </AppText>
                </View>

                {/* ── BIG HERO STATS (VOLUME & SETS) ── */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {/* Total Volume */}
                  <View style={{ 
                    flex: 1.2, 
                    backgroundColor: currentTemplate.cardBg, 
                    padding: 16, 
                    borderRadius: 18, 
                    borderWidth: 1, 
                    borderColor: currentTemplate.hudBorder 
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Flame color={currentTemplate.primaryColor} size={14} />
                      <AppText style={{ color: currentTemplate.textMuted, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        TOTAL VOLUME
                      </AppText>
                    </View>
                    <AppText weight="bold" style={{ color: currentTemplate.primaryColor, fontSize: 28, fontVariant: ['tabular-nums'] }}>
                      {totalVolume.toLocaleString('id-ID')}
                      <AppText style={{ fontSize: 14, color: currentTemplate.textColor }}> kg</AppText>
                    </AppText>
                  </View>

                  {/* Sets & Time */}
                  <View style={{ flex: 0.8, gap: 8 }}>
                    <View style={{ 
                      flex: 1, 
                      backgroundColor: currentTemplate.cardBg, 
                      paddingHorizontal: 14, 
                      paddingVertical: 10, 
                      borderRadius: 14, 
                      borderWidth: 1, 
                      borderColor: currentTemplate.hudBorder,
                      justifyContent: 'center'
                    }}>
                      <AppText style={{ color: currentTemplate.textMuted, fontSize: 9, letterSpacing: 1 }}>SETS COMPLETE</AppText>
                      <AppText weight="bold" style={{ color: currentTemplate.textColor, fontSize: 18 }}>
                        {totalCompleted} <AppText style={{ fontSize: 11, color: currentTemplate.textMuted }}>sets</AppText>
                      </AppText>
                    </View>

                    <View style={{ 
                      flex: 1, 
                      backgroundColor: currentTemplate.cardBg, 
                      paddingHorizontal: 14, 
                      paddingVertical: 10, 
                      borderRadius: 14, 
                      borderWidth: 1, 
                      borderColor: currentTemplate.hudBorder,
                      justifyContent: 'center'
                    }}>
                      <AppText style={{ color: currentTemplate.textMuted, fontSize: 9, letterSpacing: 1 }}>DURATION</AppText>
                      <AppText weight="bold" style={{ color: currentTemplate.accentColor, fontSize: 18 }}>
                        {workoutDurationMinutes} <AppText style={{ fontSize: 11, color: currentTemplate.textMuted }}>mins</AppText>
                      </AppText>
                    </View>
                  </View>
                </View>

                {/* ── VERIFIED NEW PR HIGHLIGHT BANNER ── */}
                {newPRs && newPRs.length > 0 && (
                  <View style={{ 
                    backgroundColor: currentTemplate.badgeBg, 
                    borderRadius: 14, 
                    paddingHorizontal: 12, 
                    paddingVertical: 8, 
                    borderWidth: 1.5, 
                    borderColor: currentTemplate.primaryColor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Trophy color={currentTemplate.primaryColor} size={15} />
                      <View style={{ flex: 1 }}>
                        <AppText weight="bold" numberOfLines={1} style={{ color: currentTemplate.textColor, fontSize: 11 }}>
                          PR: {newPRs[0].exercise_name}
                        </AppText>
                        <AppText style={{ color: currentTemplate.textMuted, fontSize: 9 }}>
                          {newPRs.length > 1 ? `+${newPRs.length - 1} latihan lain juga rekor baru!` : 'Rekor latihan resmi terverifikasi'}
                        </AppText>
                      </View>
                    </View>
                    <View style={{ backgroundColor: currentTemplate.primaryColor, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <AppText weight="bold" style={{ color: '#000', fontSize: 11 }}>
                        {newPRs[0].new1RM} kg 1RM
                      </AppText>
                    </View>
                  </View>
                )}

                {/* ── EXERCISES PREVIEW LIST (3-4 EXERCISES) ── */}
                <View style={{ 
                  backgroundColor: 'rgba(0,0,0,0.4)', 
                  borderRadius: 16, 
                  padding: 12, 
                  borderWidth: 1, 
                  borderColor: currentTemplate.hudBorder 
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <AppText weight="bold" style={{ color: currentTemplate.textMuted, fontSize: 10, letterSpacing: 1 }}>
                      COMPLETED DRILLS
                    </AppText>
                    <AppText style={{ color: currentTemplate.primaryColor, fontSize: 10 }}>
                      {workoutData.length} Latihan
                    </AppText>
                  </View>

                  {workoutData.slice(0, 3).map((ex, i) => {
                    const doneSets = (ex.sets || []).filter(s => s.completed);
                    const bestKg = Math.max(0, ...doneSets.map(s => Number(s.kg) || 0));
                    const isPrEx = (newPRs || []).some(p => p.normName === ex.name?.toLowerCase()?.trim() || p.exercise_name?.toLowerCase()?.trim() === ex.name?.toLowerCase()?.trim());
                    return (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          {isPrEx ? <Trophy color={currentTemplate.primaryColor} size={12} /> : <CheckCircle2 color={currentTemplate.primaryColor} size={12} />}
                          <AppText numberOfLines={1} weight="bold" style={{ color: currentTemplate.textColor, fontSize: 11, flex: 1 }}>
                            {ex.name} {isPrEx ? '🔥' : ''}
                          </AppText>
                        </View>
                        <AppText style={{ color: isPrEx ? currentTemplate.primaryColor : currentTemplate.accentColor, fontSize: 11, fontWeight: isPrEx ? 'bold' : 'normal' }}>
                          {doneSets.length} sets {bestKg > 0 ? `• max ${bestKg}kg` : ''}
                        </AppText>
                      </View>
                    );
                  })}
                </View>

                {/* ── RELATABLE VOLUME COMPARISON BANNER ── */}
                <View style={{ 
                  backgroundColor: currentTemplate.badgeBg, 
                  padding: 10, 
                  borderRadius: 14, 
                  borderWidth: 1, 
                  borderColor: currentTemplate.hudBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Trophy color={currentTemplate.primaryColor} size={18} />
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold" style={{ color: currentTemplate.textColor, fontSize: 11 }}>
                      {funComparison}
                    </AppText>
                  </View>
                </View>

                {/* ── CARD FOOTER ── */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
                  <AppText style={{ color: currentTemplate.textMuted, fontSize: 9 }}>
                    {formattedDate} • WIB
                  </AppText>
                  <AppText weight="bold" style={{ color: currentTemplate.primaryColor, fontSize: 10, letterSpacing: 1 }}>
                    GYMVAULT APP
                  </AppText>
                </View>

              </LinearGradient>
            </ViewShot>
          </View>

          {/* ═══ 5. ACTION BUTTONS (SHARE, SAVE, COPY CAPTION) ═══ */}
          <View style={{ width: '100%', maxWidth: 360, marginTop: 24, gap: 10 }}>
            {/* Primary Share to Instagram / TikTok Button */}
            <Pressable
              onPress={handleShare}
              style={{
                backgroundColor: currentTemplate.primaryColor,
                paddingVertical: 16,
                borderRadius: 16,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                shadowColor: currentTemplate.primaryColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 4
              }}
            >
              <Share2 color="#000" size={18} />
              <AppText weight="bold" style={{ color: '#000', fontSize: 15 }}>
                Share Story (Instagram / TikTok)
              </AppText>
            </Pressable>

            {/* Row: Download Image & Copy Caption */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={handleSaveToGallery}
                disabled={savingImage}
                style={{
                  flex: 1,
                  backgroundColor: '#1E1E24',
                  borderWidth: 1,
                  borderColor: '#333',
                  paddingVertical: 14,
                  borderRadius: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Download color="#FFF" size={16} />
                <AppText weight="bold" style={{ color: '#FFF', fontSize: 13 }}>
                  {savingImage ? 'Menyimpan...' : 'Simpan Foto'}
                </AppText>
              </Pressable>

              <Pressable
                onPress={handleCopyCaption}
                style={{
                  flex: 1,
                  backgroundColor: copiedCaption ? 'rgba(212,245,60,0.2)' : '#1E1E24',
                  borderWidth: 1,
                  borderColor: copiedCaption ? '#D4F53C' : '#333',
                  paddingVertical: 14,
                  borderRadius: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {copiedCaption ? <Check color="#D4F53C" size={16} /> : <Copy color="#FFF" size={16} />}
                <AppText weight="bold" style={{ color: copiedCaption ? '#D4F53C' : '#FFF', fontSize: 13 }}>
                  {copiedCaption ? 'Tersalin! ✅' : 'Salin Caption'}
                </AppText>
              </Pressable>
            </View>

            {/* Finish Workout Done Button */}
            <Pressable
              onPress={handleDone}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderColor: '#222',
                paddingVertical: 14,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 6
              }}
            >
              <AppText weight="bold" style={{ color: '#888', fontSize: 14 }}>
                Selesai & Tutup Sesi
              </AppText>
            </Pressable>
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
}
