import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { AppText, theme } from '../../theme';

export default function TdeeCalculatorModal({
  visible,
  onClose,
  profile = {},
  nutritionGoals = {},
  updateNutritionGoals,
  showToast,
  cardColor,
  borderColor,
  textColor,
  textMuted,
  darkMode
}) {
  const [tdeeForm, setTdeeForm] = useState({ gender: 'male', age: '25', activity: '1.55', goal: 'maintain' });

  const handleCalculateAndSave = () => {
    const w = parseFloat(profile?.body_weight) || 70;
    const h = parseFloat(profile?.height) || 170;
    const a = parseFloat(tdeeForm.age) || 25;
    
    // Mifflin-St Jeor Formula
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr += (tdeeForm.gender === 'male' ? 5 : -161);
    
    let tdee = bmr * parseFloat(tdeeForm.activity);
    if (tdeeForm.goal === 'cut') tdee -= 500;
    if (tdeeForm.goal === 'bulk') tdee += 500;
    
    const targetCalories = Math.round(tdee);
    const targetProtein = Math.round(w * 2.2); // ~2.2g per kg bodyweight
    
    if (updateNutritionGoals) {
      updateNutritionGoals({ target_calories: targetCalories, target_protein: targetProtein });
      if (showToast) showToast('success', `Target diset: ${targetCalories} kcal, ${targetProtein}g Protein`);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: cardColor, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, height: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <AppText weight="bold" style={{ color: textColor, fontSize: 20 }}>TDEE Calculator</AppText>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: darkMode ? '#333' : '#F3F4F6', borderRadius: 20 }}>
              <X color={textColor} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <AppText style={{ color: textMuted, marginBottom: 24 }}>
              Hitung kebutuhan kalori harian Anda berdasarkan berat {profile?.body_weight || 0} kg dan tinggi {profile?.height || 0} cm.
            </AppText>

            {/* Gender */}
            <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Gender</AppText>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => setTdeeForm({ ...tdeeForm, gender: 'male' })}
                style={{ flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: tdeeForm.gender === 'male' ? '#CCFF00' : borderColor, backgroundColor: tdeeForm.gender === 'male' ? 'rgba(204,255,0,0.1)' : 'transparent', alignItems: 'center' }}
              >
                <AppText weight="bold" style={{ color: tdeeForm.gender === 'male' ? '#CCFF00' : textColor }}>Pria</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTdeeForm({ ...tdeeForm, gender: 'female' })}
                style={{ flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: tdeeForm.gender === 'female' ? '#CCFF00' : borderColor, backgroundColor: tdeeForm.gender === 'female' ? 'rgba(204,255,0,0.1)' : 'transparent', alignItems: 'center' }}
              >
                <AppText weight="bold" style={{ color: tdeeForm.gender === 'female' ? '#CCFF00' : textColor }}>Wanita</AppText>
              </TouchableOpacity>
            </View>

            {/* Age */}
            <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Umur (Tahun)</AppText>
            <TextInput
              style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 16, marginBottom: 20, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: borderColor }}
              value={tdeeForm.age}
              onChangeText={v => setTdeeForm({ ...tdeeForm, age: v })}
              keyboardType="numeric"
            />

            {/* Activity Level */}
            <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Level Aktivitas (Olahraga)</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[
                { value: '1.2', label: 'Jarang (Sedentary)' },
                { value: '1.375', label: '1-3x Seminggu' },
                { value: '1.55', label: '3-5x Seminggu' },
                { value: '1.725', label: '6-7x Seminggu' }
              ].map(act => (
                <TouchableOpacity
                  key={act.value}
                  onPress={() => setTdeeForm({ ...tdeeForm, activity: act.value })}
                  style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: tdeeForm.activity === act.value ? '#CCFF00' : borderColor, backgroundColor: tdeeForm.activity === act.value ? 'rgba(204,255,0,0.1)' : 'transparent', marginBottom: 8 }}
                >
                  <AppText style={{ color: tdeeForm.activity === act.value ? '#CCFF00' : textColor }}>{act.label}</AppText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Goal */}
            <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Tujuan (Goal)</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
              {[
                { value: 'cut', label: 'Cutting (-500 kcal)' },
                { value: 'maintain', label: 'Maintain (TDEE)' },
                { value: 'bulk', label: 'Bulking (+500 kcal)' }
              ].map(g => (
                <TouchableOpacity
                  key={g.value}
                  onPress={() => setTdeeForm({ ...tdeeForm, goal: g.value })}
                  style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: tdeeForm.goal === g.value ? '#CCFF00' : borderColor, backgroundColor: tdeeForm.goal === g.value ? 'rgba(204,255,0,0.1)' : 'transparent', marginBottom: 8 }}
                >
                  <AppText style={{ color: tdeeForm.goal === g.value ? '#CCFF00' : textColor }}>{g.label}</AppText>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#CCFF00', padding: 16, borderRadius: 16, marginTop: 16, marginBottom: 32, alignItems: 'center', shadowColor: '#CCFF00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
              onPress={handleCalculateAndSave}
            >
              <AppText weight="bold" style={{ color: '#000', fontSize: 16, textAlign: 'center' }}>Hitung & Simpan Target</AppText>
            </TouchableOpacity>
            
            {nutritionGoals?.target_calories > 0 && (
               <View style={{ marginTop: 24, padding: 16, backgroundColor: 'rgba(204,255,0,0.05)', borderRadius: 12, borderWidth: 1, borderColor: '#CCFF00' }}>
                 <AppText style={{ color: '#CCFF00', textAlign: 'center', marginBottom: 8 }}>Target Saat Ini</AppText>
                 <AppText weight="bold" style={{ color: textColor, fontSize: 24, textAlign: 'center' }}>{nutritionGoals.target_calories} kcal</AppText>
                 <AppText style={{ color: textMuted, textAlign: 'center' }}>Protein: {nutritionGoals.target_protein}g</AppText>
               </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
