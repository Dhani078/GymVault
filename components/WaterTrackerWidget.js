import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { Droplet, Check } from 'lucide-react-native';
import { AppText, theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function WaterTrackerWidget({ userProfile, refreshTrigger }) {
  const [waterMl, setWaterMl] = useState(0);
  const [showWaterInput, setShowWaterInput] = useState(false);
  const [customWaterMl, setCustomWaterMl] = useState('');

  const fetchWater = async () => {
    try {
      const waterData = await AsyncStorage.getItem('daily_water_ml');
      if (waterData) {
        const parsed = JSON.parse(waterData);
        if (parsed.date === getLocalDateString()) {
          setWaterMl(parsed.ml || 0);
        } else {
          setWaterMl(0);
        }
      }
    } catch (e) {
      console.warn('Error fetching water data', e);
    }
  };

  useEffect(() => {
    fetchWater();
  }, [refreshTrigger]);

  const addWater = async (amount) => {
    const newMl = Math.max(0, waterMl + amount);
    setWaterMl(newMl);
    const todayStr = getLocalDateString();
    await AsyncStorage.setItem('daily_water_ml', JSON.stringify({ date: todayStr, ml: newMl }));

    // Also update water_history
    const historyStr = await AsyncStorage.getItem('water_history');
    let history = {};
    if (historyStr) {
      try { history = JSON.parse(historyStr); } catch (e) {}
    }
    history[todayStr] = newMl;
    await AsyncStorage.setItem('water_history', JSON.stringify(history));

    DeviceEventEmitter.emit('activity_logged');
  };

  const dynamicWaterTarget = userProfile?.body_weight ? Math.round(userProfile.body_weight * 35) : 2000;
  const totalGlasses = Math.max(8, Math.ceil(dynamicWaterTarget / 250));

  return (
    <View style={{ backgroundColor: theme.colors.card, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Subtle water glow background */}
      <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(59, 130, 246, 0.08)' }} />
      
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(59, 130, 246, 0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <Droplet color="#3B82F6" size={22} fill="rgba(59, 130, 246, 0.2)" />
          </View>
          <View>
            <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>Hydration</AppText>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 2 }}>
              <AppText weight="bold" style={{ color: '#3B82F6' }}>{waterMl}</AppText> / {dynamicWaterTarget} ml
            </AppText>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {showWaterInput ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TextInput
                style={{ 
                  backgroundColor: theme.colors.inputBg, 
                  color: theme.colors.text, 
                  borderRadius: 12, 
                  paddingHorizontal: 8, 
                  paddingVertical: 6, 
                  width: 60, 
                  fontSize: 14, 
                  borderWidth: 1, 
                  borderColor: theme.colors.border,
                  textAlign: 'center',
                  fontFamily: 'Inter_700Bold'
                }}
                keyboardType="numeric"
                placeholder="ml"
                placeholderTextColor={theme.colors.textMuted}
                value={customWaterMl}
                onChangeText={setCustomWaterMl}
                autoFocus
              />
              <TouchableOpacity 
                onPress={async () => {
                  const val = Number(customWaterMl);
                  if (val > 0) await addWater(val);
                  setCustomWaterMl('');
                  setShowWaterInput(false);
                }}
                style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' }}
              >
                <Check color="#FFF" size={16} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowWaterInput(false)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center' }}>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 16 }}>×</AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={() => addWater(-250)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
                <AppText weight="bold" style={{ color: theme.colors.textMuted, fontSize: 16 }}>-</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => addWater(250)} style={{ width: 44, height: 36, borderRadius: 12, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}>
                <AppText weight="bold" style={{ color: '#FFF', fontSize: 16 }}>+250</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowWaterInput(true)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
                <AppText style={{ color: theme.colors.text, fontSize: 11 }}>✎</AppText>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      {/* Visual Dynamic-Glass representation */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 40, marginTop: 4 }}>
        {[...Array(totalGlasses)].map((_, i) => {
          const glassValue = (i + 1) * 250;
          const isFilled = waterMl >= glassValue;
          const isPartial = waterMl > (i * 250) && waterMl < glassValue;
          const partialPercent = isPartial ? ((waterMl - (i * 250)) / 250) * 100 : 0;
          
          return (
            <View key={i} style={{ 
              flex: 1, 
              height: isFilled || isPartial ? 36 : 24, 
              marginHorizontal: 2,
              backgroundColor: isFilled ? '#3B82F6' : theme.colors.inputBg, 
              borderRadius: 16, 
              borderWidth: 1, 
              borderColor: isFilled ? '#3B82F6' : 'rgba(59, 130, 246, 0.2)',
              overflow: 'hidden',
              justifyContent: 'flex-end',
              opacity: isFilled || isPartial ? 1 : 0.6
            }}>
              {isPartial && (
                <View style={{ width: '100%', height: `${partialPercent}%`, backgroundColor: '#60A5FA', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
