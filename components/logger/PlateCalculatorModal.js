import React, { useState, useEffect } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { AppText, theme } from '../../theme';

export default function PlateCalculatorModal({ visible, onClose, initialWeight = '100' }) {
  const [plateTarget, setPlateTarget] = useState(String(initialWeight));

  useEffect(() => {
    if (visible && initialWeight) {
      setPlateTarget(String(initialWeight));
    }
  }, [visible, initialWeight]);

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 120, padding: 24 }}>
      <View style={{ width: '100%', backgroundColor: theme.colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <AppText weight="bold" style={{ fontSize: 20 }}>Plate Calculator</AppText>
          <Pressable onPress={onClose}>
            <X color={theme.colors.textMuted} size={24} />
          </Pressable>
        </View>
        <AppText style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 20 }}>Calculates plates needed per side (assumes 20kg barbell).</AppText>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.inputBg, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 24 }}>
          <TextInput
            style={{ flex: 1, color: theme.colors.text, fontSize: 24, fontFamily: 'Inter_700Bold', paddingVertical: 12 }}
            keyboardType="numeric"
            value={plateTarget}
            onChangeText={setPlateTarget}
            placeholder="Target KG"
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
          />
          <AppText weight="bold" style={{ color: theme.colors.textMuted, fontSize: 16 }}>KG</AppText>
        </View>

        <View style={{ backgroundColor: theme.colors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, shadowColor: theme.colors.primary, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 }}>
          <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 13, marginBottom: 16, letterSpacing: 1, textAlign: 'center' }}>PLATES PER SIDE</AppText>
          {(() => {
            const target = parseFloat(plateTarget) || 0;
            if (target < 20) return <AppText weight="bold" style={{ color: '#EF4444', textAlign: 'center', marginTop: 10 }}>Target must be &ge; 20kg (empty bar)</AppText>;
            
            let remaining = (target - 20) / 2;
            const standardPlates = [25, 20, 15, 10, 5, 2.5, 1.25];
            const needed = {};
            
            for (const p of standardPlates) {
              const count = Math.floor(remaining / p);
              if (count > 0) {
                needed[p] = count;
                remaining -= count * p;
              }
            }
            
            if (Object.keys(needed).length === 0) return <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 16, textAlign: 'center', marginTop: 10 }}>Empty Barbell Only</AppText>;

            return (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                {Object.entries(needed).map(([weight, count]) => {
                  const num = parseFloat(weight);
                  let size = 64;
                  let color = theme.colors.primary;
                  if (num >= 20) { size = 76; color = '#EF4444'; }
                  else if (num >= 15) { size = 70; color = '#F59E0B'; }
                  else if (num >= 10) { size = 64; color = '#10B981'; }
                  else if (num >= 5) { size = 56; color = theme.colors.text; }
                  else { size = 48; color = theme.colors.textMuted; }

                  return (
                    <View key={weight} style={{ alignItems: 'center' }}>
                      <View style={{ width: size, height: size, borderRadius: size/2, backgroundColor: theme.colors.inputBg, borderWidth: 3, borderColor: color, justifyContent: 'center', alignItems: 'center', shadowColor: color, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}>
                        <AppText weight="bold" style={{ color: theme.colors.text, fontSize: size > 60 ? 18 : 14 }}>{weight}</AppText>
                        <AppText style={{ color: theme.colors.textMuted, fontSize: 10 }}>kg</AppText>
                      </View>
                      <AppText weight="bold" style={{ color: color, fontSize: 12, marginTop: 4 }}>&times; {count}</AppText>
                    </View>
                  );
                })}
              </View>
            );
          })()}
        </View>

        <Pressable
          style={{ width: '100%', height: 48, borderRadius: 12, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', marginTop: 24 }}
          onPress={onClose}
        >
          <AppText weight="bold" style={{ color: theme.colors.text }}>Done</AppText>
        </Pressable>
      </View>
    </View>
  );
}
