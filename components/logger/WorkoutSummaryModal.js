import React, { useRef } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { AppText, theme } from '../../theme';
import { getVolumeComparison } from '../../utils/volumeComparison';

export default function WorkoutSummaryModal({
  visible,
  workoutData = [],
  totalCompleted = 0,
  onClose,
  onFinish,
  showInterstitialAd
}) {
  const viewShotRef = useRef(null);

  if (!visible) return null;

  const totalVolume = Math.round(workoutData.reduce((acc, ex) => (
    acc + (ex.sets || []).reduce((sAcc, s) => {
      const w = Number(s.kg) || 0;
      const r = Number(s.reps) || 0;
      return sAcc + (s.completed ? w * r : 0);
    }, 0)
  ), 0));

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
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Sharing not available", "Your device does not support sharing.");
      }
    } catch (e) {
      Alert.alert("Error", e.message || 'Failed to share summary.');
    }
  };

  const exerciseNames = workoutData.map(e => e.name).filter(Boolean);
  const exerciseSummary = exerciseNames.slice(0, 3).join(', ') + (exerciseNames.length > 3 ? '...' : '');

  const currentDateText = (() => {
    const d = new Date();
    const daysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${daysLong[d.getDay()]}, ${monthsShort[d.getMonth()]} ${d.getDate()}`;
  })();

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 150, padding: 24 }}>
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={{ width: '100%', backgroundColor: theme.colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <Dumbbell color={theme.colors.primary} size={28} style={{ transform: [{ rotate: '-45deg' }], marginRight: 12 }} />
          <View>
            <AppText weight="bold" style={{ fontSize: 22, color: theme.colors.text }}>GymVault</AppText>
            <AppText style={{ fontSize: 11, color: theme.colors.primary, letterSpacing: 2 }}>WORKOUT COMPLETE</AppText>
          </View>
        </View>
        
        <AppText weight="bold" style={{ fontSize: 28, color: theme.colors.text, marginBottom: 8 }}>
          {exerciseSummary || 'Workout Session'}
        </AppText>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
          <View style={{ backgroundColor: theme.colors.inputBg, padding: 16, borderRadius: 16, flex: 1, minWidth: '45%' }}>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 4 }}>VOLUME</AppText>
            <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 24 }}>
              {totalVolume}<AppText style={{ fontSize: 14 }}>kg</AppText>
            </AppText>
          </View>
          <View style={{ backgroundColor: theme.colors.inputBg, padding: 16, borderRadius: 16, flex: 1, minWidth: '45%' }}>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 4 }}>SETS</AppText>
            <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 24 }}>{totalCompleted}</AppText>
          </View>
        </View>

        {/* Comparison Text Card */}
        <View style={{ 
          backgroundColor: 'rgba(212,245,60,0.06)', 
          borderWidth: 1, 
          borderColor: 'rgba(212,245,60,0.15)',
          borderRadius: 16, 
          padding: 16, 
          marginTop: 16,
          alignItems: 'center'
        }}>
          <AppText style={{ color: theme.colors.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 6 }}>INSTAGRAM STORY FLEX</AppText>
          <AppText weight="bold" style={{ color: '#FFF', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            🔥 Total angkatan saya hari ini: {totalVolume} kg!
          </AppText>
          <AppText style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
            {getVolumeComparison(totalVolume)}
          </AppText>
        </View>
        
        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
          <AppText style={{ color: theme.colors.textMuted, fontSize: 10, textAlign: 'center' }}>
            {currentDateText}
          </AppText>
        </View>
      </ViewShot>

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 32, width: '100%' }}>
        <Pressable
          style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}
          onPress={handleDone}
        >
          <AppText weight="bold" style={{ color: theme.colors.text }}>Done</AppText>
        </Pressable>
        <Pressable
          style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: theme.colors.primary, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' }}
          onPress={handleShare}
        >
          <AppText weight="bold" style={{ color: theme.colors.background }}>Share Story</AppText>
        </Pressable>
      </View>
    </View>
  );
}
