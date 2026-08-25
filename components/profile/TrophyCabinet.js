import React from 'react';
import { ScrollView, View, Image } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { AppText, theme } from '../../theme';

const TROPHIES = [
  { id: 'first_blood', name: 'First Blood', desc: '1st Workout', icon: '1f3c5', check: (stats) => stats.totalWorkouts >= 1 },
  { id: 'consistency', name: 'Consistency King', desc: '10 Workouts', icon: '1f3c6', check: (stats) => stats.totalWorkouts >= 10 },
  { id: 'iron_addict', name: 'Iron Addict', desc: '50 Workouts', icon: '1f98d', check: (stats) => stats.totalWorkouts >= 50 },
  { id: 'elephant', name: 'The Elephant', desc: '10,000 kg Vol', icon: '1f418', check: (stats) => stats.totalVolume >= 10000 },
  { id: 'hulk', name: 'Titan Strength', desc: '50,000 kg Vol', icon: '1f5ff', check: (stats) => stats.totalVolume >= 50000 },
  { id: 'streak', name: 'Streak Master', desc: '7 Days Streak', icon: '1f525', check: (stats, streak) => streak >= 7 },
];

export default function TrophyCabinet({ stats = {}, checkInStreak = 0, cardColor, borderColor, textColor, textMuted, t }) {
  return (
    <View style={{ marginBottom: 32 }}>
      <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 12 }}>
        {t ? t('trophy_cabinet') : 'TROPHY CABINET'}
      </AppText>
      <ScrollView horizontal removeClippedSubviews={true} showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
        {TROPHIES.map((trophy, idx, arr) => {
          const achieved = trophy.check(stats, checkInStreak);
          return (
            <View
              key={trophy.id}
              style={{
                width: 130,
                backgroundColor: cardColor,
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: achieved ? '#CCFF00' : borderColor,
                alignItems: 'center',
                marginRight: idx === arr.length - 1 ? 48 : 16,
                opacity: achieved ? 1 : 0.4,
                shadowColor: achieved ? '#CCFF00' : '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: achieved ? 0.25 : 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <ExpoLinearGradient
                colors={achieved ? ['#2A3300', '#1A2000'] : [theme.colors.inputBg, theme.colors.inputBg]}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: achieved ? 'rgba(204,255,0,0.3)' : 'transparent',
                }}
              >
                <Image
                  source={{ uri: `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u${trophy.icon}.png` }}
                  style={{ width: 40, height: 40, transform: [{ scale: achieved ? 1.15 : 1 }] }}
                />
              </ExpoLinearGradient>
              <AppText weight="bold" style={{ color: textColor, fontSize: 13, textAlign: 'center', marginBottom: 4, lineHeight: 16 }}>
                {trophy.name}
              </AppText>
              <AppText style={{ color: textMuted, fontSize: 11, textAlign: 'center' }}>
                {trophy.desc}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
