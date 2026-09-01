import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from '../theme';
import { Target, Activity, Zap, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');

  const nextStep = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 2) {
      setStep(step + 1);
    } else {
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
      onComplete();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E0F', padding: 24, justifyContent: 'center' }}>
      <AppText weight="bold" style={{ fontSize: 32, color: '#FFF', marginBottom: 16 }}>
        {step === 1 ? "What's your main goal?" : "What's your experience level?"}
      </AppText>
      
      {step === 1 && (
        <View style={{ gap: 16 }}>
          {[
            { id: 'bulk', label: 'Build Muscle (Bulk)', icon: Zap },
            { id: 'cut', label: 'Lose Fat (Cut)', icon: Activity },
            { id: 'maintain', label: 'General Fitness', icon: Target }
          ].map(opt => (
            <Pressable
              key={opt.id}
              style={{
                padding: 24, borderRadius: 16, borderWidth: 2,
                borderColor: goal === opt.id ? '#D4F53C' : '#222',
                backgroundColor: goal === opt.id ? 'rgba(212,245,60,0.1)' : '#111',
                flexDirection: 'row', alignItems: 'center'
              }}
              onPress={() => {
                setGoal(opt.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <opt.icon color={goal === opt.id ? '#D4F53C' : '#888'} size={24} style={{ marginRight: 16 }} />
              <AppText weight="bold" style={{ color: goal === opt.id ? '#FFF' : '#888', fontSize: 18 }}>{opt.label}</AppText>
            </Pressable>
          ))}
        </View>
      )}

      {step === 2 && (
        <View style={{ gap: 16 }}>
          {[
            { id: 'beginner', label: 'Beginner', desc: 'Just starting out' },
            { id: 'intermediate', label: 'Intermediate', desc: '1-3 years of lifting' },
            { id: 'advanced', label: 'Advanced', desc: '3+ years of lifting' }
          ].map(opt => (
            <Pressable
              key={opt.id}
              style={{
                padding: 24, borderRadius: 16, borderWidth: 2,
                borderColor: level === opt.id ? '#D4F53C' : '#222',
                backgroundColor: level === opt.id ? 'rgba(212,245,60,0.1)' : '#111',
              }}
              onPress={() => {
                setLevel(opt.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <AppText weight="bold" style={{ color: level === opt.id ? '#FFF' : '#888', fontSize: 18 }}>{opt.label}</AppText>
              <AppText style={{ color: '#555', marginTop: 4 }}>{opt.desc}</AppText>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        style={{
          marginTop: 40, backgroundColor: (step === 1 ? goal : level) ? '#D4F53C' : '#333',
          padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
          opacity: (step === 1 ? goal : level) ? 1 : 0.5
        }}
        disabled={!(step === 1 ? goal : level)}
        onPress={nextStep}
      >
        <AppText weight="bold" style={{ color: '#000', fontSize: 18, marginRight: 8 }}>
          {step === 1 ? 'Continue' : 'Finish Setup'}
        </AppText>
        <ChevronRight color="#000" size={20} />
      </Pressable>
    </View>
  );
}
