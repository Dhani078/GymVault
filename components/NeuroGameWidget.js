import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Gamepad2, Timer, Zap, Trophy, RefreshCw } from 'lucide-react-native';
import { AppText, theme } from '../theme';
import * as Haptics from 'expo-haptics';

export default function NeuroGameWidget({ onResult, onCancel }) {
  const [reactionGameState, setReactionGameState] = useState('idle'); // 'idle', 'waiting', 'flash', 'result'
  const [reactionTrials, setReactionTrials] = useState([]);
  const [reactionStartTime, setReactionStartTime] = useState(0);
  const [reactionTimer, setReactionTimer] = useState(null);
  const [reactionMsg, setReactionMsg] = useState('Ketuk untuk memulai tes (3x percobaan)');
  const [reactionProgress, setReactionProgress] = useState(0);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (reactionTimer) clearTimeout(reactionTimer);
    };
  }, [reactionTimer]);

  const startReactionGame = () => {
    if (reactionTimer) clearTimeout(reactionTimer);
    setReactionTrials([]);
    setReactionProgress(0);
    setReactionMsg('Mempersiapkan tes...');
    runReactionTrial([], 0);
  };

  const runReactionTrial = (trials, currentProgress) => {
    setReactionGameState('waiting');
    setReactionMsg('Tunggu sampai warna berubah menjadi NEON...');
    
    const randomDelay = Math.random() * 2000 + 1500; // 1.5s to 3.5s
    const timer = setTimeout(() => {
      setReactionGameState('flash');
      setReactionStartTime(Date.now());
      setReactionMsg('KETUK SEKARANG!');
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }, randomDelay);
    
    setReactionTimer(timer);
  };

  const handleReactionTap = () => {
    if (reactionGameState === 'idle') {
      startReactionGame();
      return;
    }
    
    if (reactionGameState === 'waiting') {
      // Tapped too early
      if (reactionTimer) clearTimeout(reactionTimer);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      setReactionGameState('idle');
      setReactionMsg('Terlalu cepat! Silakan coba lagi.');
      return;
    }
    
    if (reactionGameState === 'flash') {
      const duration = Date.now() - reactionStartTime;
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      
      const newTrials = [...reactionTrials, duration];
      setReactionTrials(newTrials);
      const nextProgress = reactionProgress + 1;
      setReactionProgress(nextProgress);
      
      if (nextProgress < 3) {
        setReactionGameState('waiting');
        setReactionMsg(`Trial ${nextProgress} Sukses: ${duration}ms. Bersiap...`);
        const timer = setTimeout(() => {
          runReactionTrial(newTrials, nextProgress);
        }, 1200);
        setReactionTimer(timer);
      } else {
        setReactionGameState('result');
        const avg = Math.round(newTrials.reduce((a, b) => a + b, 0) / 3);
        let classification = '';
        if (avg < 250) classification = 'Sangat Prima 🔥 (Level 5)';
        else if (avg < 300) classification = 'Baik 👍 (Level 4)';
        else if (avg < 350) classification = 'Normal ☕ (Level 3)';
        else if (avg < 400) classification = 'Lelah Ringan ⚠️ (Level 2)';
        else classification = 'Lelah Parah 🚨 (Level 1)';
        
        setReactionMsg(`Rata-rata: ${avg}ms · ${classification}`);
      }
    }
  };

  const applyReactionResult = () => {
    if (reactionTrials.length === 0) return;
    const avg = Math.round(reactionTrials.reduce((a, b) => a + b, 0) / 3);
    let score = 3;
    if (avg < 250) score = 5;
    else if (avg < 300) score = 4;
    else if (avg < 350) score = 3;
    else if (avg < 400) score = 2;
    else score = 1;
    
    onResult(score);
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
          Uji Saraf Neuro-Tap 🎮
        </AppText>
        <TouchableOpacity 
          onPress={onCancel}
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
        >
          <AppText style={{ color: theme.colors.textMuted, fontSize: 11 }}>Batal</AppText>
        </TouchableOpacity>
      </View>
      <AppText style={{ fontSize: 13, color: theme.colors.textMuted, lineHeight: 18, marginBottom: 16 }}>
        Tes reaksi motorik mengukur status Neuromuskular Anda. Ketuk box secepat mungkin ketika warnanya berkedip NEON HIJAU!
      </AppText>

      {/* The main Tap Target Area */}
      <TouchableOpacity
        activeOpacity={reactionGameState === 'flash' ? 0.6 : 0.9}
        onPress={handleReactionTap}
        style={{
          width: '100%',
          height: 200,
          borderRadius: 20,
          backgroundColor: reactionGameState === 'flash' 
            ? '#CCFF00' 
            : (reactionGameState === 'waiting' 
              ? 'rgba(255, 69, 0, 0.12)' 
              : 'rgba(255, 255, 255, 0.04)'),
          borderWidth: 1,
          borderColor: reactionGameState === 'flash' 
            ? '#CCFF00' 
            : (reactionGameState === 'waiting' 
              ? '#FF4500' 
              : theme.colors.border),
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          marginBottom: 16
        }}
      >
        {reactionGameState === 'idle' && (
          <View style={{ alignItems: 'center' }}>
            <Gamepad2 color={theme.colors.textMuted} size={48} style={{ marginBottom: 12 }} />
            <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>Mulai Uji Saraf</AppText>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>Ketuk box ini untuk memulai tes (3x percobaan)</AppText>
          </View>
        )}
        {reactionGameState === 'waiting' && (
          <View style={{ alignItems: 'center' }}>
            <Timer color="#FF4500" size={32} style={{ marginBottom: 12 }} />
            <AppText weight="bold" style={{ color: '#FF4500', fontSize: 16 }}>SIAP-SIAP...</AppText>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }}>Jangan ketuk sebelum berubah warna!</AppText>
          </View>
        )}
        {reactionGameState === 'flash' && (
          <View style={{ alignItems: 'center' }}>
            <Zap color="#000" size={54} style={{ marginBottom: 8 }} />
            <AppText weight="bold" style={{ color: '#000', fontSize: 24 }}>KETUK SEKARANG!</AppText>
          </View>
        )}
        {reactionGameState === 'result' && (
          <View style={{ alignItems: 'center' }}>
            <Trophy color="#CCFF00" size={40} style={{ marginBottom: 10 }} />
            <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 18 }}>Hasil Uji Saraf</AppText>
            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
              {reactionTrials.map((t, i) => (
                <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 0.5, borderColor: theme.colors.border }}>
                  <AppText style={{ color: theme.colors.textMuted, fontSize: 11 }}>#{i+1}: <AppText weight="bold" style={{ color: theme.colors.text }}>{t}ms</AppText></AppText>
                </View>
              ))}
            </View>
            <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 15, marginTop: 2 }}>{reactionMsg}</AppText>
          </View>
        )}
      </TouchableOpacity>

      {/* Secondary game message text info */}
      {reactionGameState !== 'result' && (
        <View style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, borderWidth: 0.5, borderColor: theme.colors.border, alignItems: 'center', marginBottom: 16 }}>
          <AppText style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center' }}>{reactionMsg}</AppText>
        </View>
      )}

      {reactionGameState === 'result' && (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={startReactionGame}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.06)',
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 0.5,
              borderColor: theme.colors.border,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <RefreshCw color={theme.colors.text} size={14} />
            <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 14 }}>Ulangi Tes</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={applyReactionResult}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: '#CCFF00',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center'
            }}
          >
            <AppText weight="bold" style={{ color: '#000', fontSize: 14 }}>Terapkan Skor</AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
