import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, ActivityIndicator, Alert, Image, Linking } from 'react-native';
import { X, Zap, MessageCircle, Award } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, theme, styles } from '../theme';
import AICoachLogo from './AICoachLogo';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export default function AIRoutineModal({ visible, onClose, onStartRoutine, cnsScore, isHome, equipmentInventory, session }) {
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState('Intermediate'); 
  const [focus, setFocus] = useState('Full Body');

  const [usageCount, setUsageCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);

  useEffect(() => {
    if (visible) {
      checkUsage();
    }
  }, [visible]);

  const checkUsage = async () => {
    try {
      const userId = session?.user?.id || 'guest';
      const premUntil = await AsyncStorage.getItem(`premium_until_${userId}`);
      const isPrem = await AsyncStorage.getItem(`is_premium_${userId}`);
      
      let premStatus = false;
      if (premUntil && new Date(premUntil) > new Date()) {
        premStatus = true;
      } else if (isPrem === 'true') {
        premStatus = true;
      }
      setIsPremium(premStatus);

      // Check daily check-in to determine if limit is 15
      const today = getLocalDateString();
      const historyStr = await AsyncStorage.getItem(`checkin_history_${userId}`);
      const history = historyStr ? JSON.parse(historyStr) : [];
      setCheckedInToday(history.includes(today));

      const usageData = await AsyncStorage.getItem(`ai_routine_daily_${userId}`);
      if (usageData) {
        const parsed = usageData ? JSON.parse(usageData) : null;
        if (parsed && parsed.date === today) {
          setUsageCount(parsed.count);
        } else {
          setUsageCount(0); // Reset for new day
        }
      } else {
        setUsageCount(0);
      }
    } catch (e) {}
  };

  const handleGenerate = async () => {
    const maxUsage = checkedInToday ? 15 : 3;
    if (!isPremium && usageCount >= maxUsage) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    try {
      const prompt = `You are an expert AI personal trainer.
Create a workout routine returning ONLY a valid JSON object. No markdown, no backticks.
The user is doing a ${isHome ? 'Home Workout' : 'Gym Workout'}.
Available Equipment: ${isHome ? equipmentInventory.join(', ') : 'Full Gym Equipment'}.
Difficulty: ${level}.
Focus Area: ${focus}.
CNS Fatigue (1=Tired, 5=Fresh): ${cnsScore}. 
Adjust volume/intensity based on CNS. The routine MUST focus on the requested Focus Area (e.g., if Push, include Chest/Shoulders/Triceps).
Format strictly:
{
  "name": "Generated Routine Name",
  "exercises": [
    { "name": "Exercise Name", "numSets": 3, "image": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=300&auto=format&fit=crop" }
  ]
}
Ensure exercise names are popular (e.g., Squat, Push Up). Limit to 4-6 exercises.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      let text = data.candidates[0].content.parts[0].text.trim();
      text = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        text = text.substring(jsonStart, jsonEnd + 1);
      }

      const routine = JSON.parse(text);
      if (!routine.exercises || !Array.isArray(routine.exercises)) {
        throw new Error("Invalid AI response format");
      }
      
      // Increment Usage
      if (!isPremium) {
        const newCount = usageCount + 1;
        const today = getLocalDateString();
        const userId = session?.user?.id || 'guest';
        await AsyncStorage.setItem(`ai_routine_daily_${userId}`, JSON.stringify({ count: newCount, date: today }));
        setUsageCount(newCount);
      }

      onClose();
      onStartRoutine(routine);

    } catch (e) {
      console.warn("AI Gen error", e);
      Alert.alert("Error", `Gagal memproses AI: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AICoachLogo size={32} />
              <AppText weight="bold" style={{ fontSize: 20 }}>AI Routine Generator</AppText>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X color="#666" size={24} />
            </TouchableOpacity>
          </View>

          {!isPremium && !showPaywall && (() => {
            const maxUsage = checkedInToday ? 15 : 3;
            return (
              <View style={{ backgroundColor: 'rgba(204, 255, 0, 0.1)', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(204, 255, 0, 0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText style={{ color: '#CCFF00', fontSize: 14 }}>Sisa AI Routine Hari Ini:</AppText>
                <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 16 }}>{Math.max(0, maxUsage - usageCount)} / {maxUsage}</AppText>
              </View>
            );
          })()}

          {showPaywall ? (
            <View style={{ alignItems: 'center' }}>
              <Award color="#CCFF00" size={48} style={{ marginBottom: 16 }} />
              <AppText weight="bold" style={{ fontSize: 24, marginBottom: 8, textAlign: 'center' }}>Limit AI Habis</AppText>
              <AppText style={{ color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Biaya server AI cukup mahal. Dukung developer Rp 10.000 via DANA (QRIS) untuk membuka fitur ini tanpa batas selama 1 Bulan!
              </AppText>

              {/* QRIS Image Placeholder (User must place image in assets) */}
              <View style={{ width: 200, height: 200, backgroundColor: '#FFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden' }}>
                <Image 
                  source={require('../assets/qris.jpg')} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                  defaultSource={{uri: 'https://via.placeholder.com/200?text=Scan+QRIS'}}
                  onError={(e) => console.log('Place your qris.jpg in assets/ folder')}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={{ backgroundColor: '#25D366', width: '100%', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}
                onPress={() => {
                  Linking.openURL('whatsapp://send?phone=6282148564979&text=Halo%20min%20Dhani,%20saya%20sudah%20transfer%20Rp10.000%20untuk%20GymVault%20Premium.%20Berikut%20buktinya...');
                }}
              >
                <MessageCircle color="#FFF" size={20} style={{ marginRight: 8 }} />
                <AppText weight="bold" style={{ color: '#FFF', fontSize: 16 }}>Kirim Bukti via WhatsApp</AppText>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowPaywall(false)}>
                <AppText style={{ color: '#888', marginTop: 8 }}>Kembali</AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <AppText style={{ color: theme.colors.textMuted, marginBottom: 20, lineHeight: 20 }}>
                Biarkan AI meracik latihan yang pas untuk tubuhmu hari ini berdasarkan skor kelelahan (CNS) dan alat yang kamu punya.
                {!isPremium && (() => {
                  const maxUsage = checkedInToday ? 15 : 3;
                  return <AppText style={{ color: '#CCFF00', fontSize: 12 }}> (Sisa: {maxUsage - usageCount}/{maxUsage})</AppText>;
                })()}
              </AppText>

              <AppText weight="bold" style={{ marginBottom: 12, fontSize: 16 }}>Pilih Tingkat Kesulitan:</AppText>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {['Beginner', 'Intermediate', 'Expert'].map(lvl => (
                  <TouchableOpacity
                    key={lvl}
                    onPress={() => setLevel(lvl)}
                    disabled={loading}
                    style={{
                      flex: 1, paddingVertical: 12, borderRadius: 12,
                      backgroundColor: level === lvl ? 'rgba(204,255,0,0.1)' : theme.colors.inputBg,
                      borderWidth: 1, borderColor: level === lvl ? theme.colors.primary : theme.colors.border,
                      alignItems: 'center'
                    }}
                  >
                    <AppText weight="bold" style={{ color: level === lvl ? theme.colors.primary : theme.colors.textMuted, fontSize: 12 }}>{lvl}</AppText>
                  </TouchableOpacity>
                ))}
              </View>

              <AppText weight="bold" style={{ marginBottom: 12, fontSize: 16 }}>Fokus Otot (Split):</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                {['Full Body', 'Push', 'Pull', 'Legs'].map(foc => (
                  <TouchableOpacity
                    key={foc}
                    onPress={() => setFocus(foc)}
                    disabled={loading}
                    style={{
                      width: '48%', paddingVertical: 12, borderRadius: 12,
                      backgroundColor: focus === foc ? 'rgba(204,255,0,0.1)' : theme.colors.inputBg,
                      borderWidth: 1, borderColor: focus === foc ? theme.colors.primary : theme.colors.border,
                      alignItems: 'center'
                    }}
                  >
                    <AppText weight="bold" style={{ color: focus === foc ? theme.colors.primary : theme.colors.textMuted, fontSize: 13 }}>{foc}</AppText>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.btnPrimary, { paddingVertical: 18, flexDirection: 'row', gap: 8 }]}
                onPress={handleGenerate}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#000" /> : (
                  <>
                    <Zap color="#000" size={20} />
                    <AppText weight="bold" style={[styles.btnPrimaryText, { fontSize: 16 }]}>Generate & Start</AppText>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}
