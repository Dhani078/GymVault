import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal, ActivityIndicator, ScrollView, TextInput, Alert, StyleSheet, Animated } from 'react-native';
import { X, Sparkles, Flame, Check, RefreshCw, Apple, MessageSquare, ChevronDown } from 'lucide-react-native';
import { AppText, theme, styles } from '../theme';
import { supabase } from '../supabaseClient';
const GEMINI_API_KEY = (() => {
  const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim() !== '' && envKey !== 'undefined' && envKey !== 'null') {
    return envKey;
  }
  return "AIzaSyDVkBIsm2qZx6YwRS62l3qPKtuXqP6d9jU";
})();

export default function AIMealPlanModal({ visible, onClose, session, userProfile, onApplyTarget }) {
  const [calories, setCalories] = useState('2000');
  const [goal, setGoal] = useState('fat_loss'); // 'fat_loss' | 'muscle_gain' | 'healthy'
  const [diet, setDiet] = useState('balanced'); // 'balanced' | 'high_protein' | 'keto' | 'vegan'
  const [mealsCount, setMealsCount] = useState(3); // 3 | 4
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Menghubungkan ke Gemini AI...");
  const [mealPlan, setMealPlan] = useState(null);

  useEffect(() => {
    let interval;
    if (loading) {
      const phrases = [
        "Menganalisis Profil & BB/TB...",
        "Menghitung Target Kalori & TDEE...",
        "Meracik Resep Menu Harian...",
        "Menyeimbangkan Rasio Makro...",
        "Menyelesaikan Rencana Makanan..."
      ];
      let i = 0;
      setLoadingText(phrases[0]);
      interval = setInterval(() => {
        i = (i + 1) % phrases.length;
        setLoadingText(phrases[i]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const generateMealPlan = async () => {
    const calNum = Number(calories);
    if (isNaN(calNum) || calNum < 1000 || calNum > 5000) {
      Alert.alert("Input Salah ⚠️", "Jumlah kalori harus antara 1000 sampai 5000 kcal.");
      return;
    }

    setLoading(true);
    try {
      let physicalStats = "";
      if (userProfile?.body_weight && userProfile?.height) {
        physicalStats = `\n- Profil Pengguna: Berat ${userProfile.body_weight} kg, Tinggi ${userProfile.height} cm (Gunakan ini sebagai acuan validasi TDEE)`;
      }

      const prompt = `Hasilkan rencana menu makanan harian (meal plan) kustom berdasarkan parameter berikut:${physicalStats}
- Target Kalori: ${calNum} kcal
- Target Goal: ${goal === 'fat_loss' ? 'Fat Loss' : goal === 'muscle_gain' ? 'Muscle Gain (Bulking)' : 'Healthy Maintenance'}
- Preferensi Diet: ${diet === 'balanced' ? 'Balanced Diet' : diet === 'high_protein' ? 'High Protein' : diet === 'keto' ? 'Keto/Low Carb' : 'Vegan/Vegetarian'}
- Jumlah Makan: ${mealsCount} kali sehari

Kembalikan format JSON murni TANPA pembungkus markdown (markdown code block seperti \`\`\`json) apa pun dengan struktur berikut:
{
  "total_calories": ${calNum},
  "total_protein": 130,
  "total_carbs": 180,
  "total_fats": 55,
  "meals": [
    {
      "time": "Sarapan",
      "name": "Nama menu makanan kustom yang lezat",
      "portion": "Ukuran porsi (misal: 150g dada ayam, 1 piring nasi merah)",
      "calories": 500,
      "protein": 35,
      "carbs": 50,
      "fats": 10,
      "brief_tip": "Tips singkat persiapan (maksimal 15 kata)."
    }
  ]
}
Sangat penting: semua penjelasan nama makanan dan tips harus dalam Bahasa Indonesia yang ramah dan profesional.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      const resJson = await response.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        throw new Error("No response content from Gemini.");
      }

      // Cleanup markdown if present
      let cleanText = rawText.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanText);
      setMealPlan(parsed);
    } catch (e) {
      console.warn("AI Generation failed:", e);
      Alert.alert("Gagal Membuat Menu ⚠️", "Sistem sedang sibuk. Silakan coba beberapa saat lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!mealPlan) return;
    onApplyTarget(mealPlan.total_calories, mealPlan.total_protein);
    Alert.alert(
      "Berhasil Diterapkan! 🎯",
      `Target kalori harian Anda diset ke ${mealPlan.total_calories} kcal dan protein ke ${mealPlan.total_protein}g.`,
      [{ text: "OK", onPress: onClose }]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={localStyles.modalContainer}>
        <View style={localStyles.modalContent}>
          
          {/* Header */}
          <View style={localStyles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Apple color={theme.colors.primary} size={24} />
              <AppText weight="bold" style={{ fontSize: 20 }}>Rencana Menu AI</AppText>
            </View>
            <TouchableOpacity onPress={onClose} style={localStyles.closeBtn}>
              <X color={theme.colors.text} size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            
            {/* Input Form if not generated yet */}
            {!mealPlan ? (
              <View>
                <AppText style={localStyles.subText}>
                  Rancang menu makanan harian sesuai kebutuhan kalori, target tubuh, dan preferensi diet Anda secara presisi dengan AI.
                </AppText>

                {/* Kalori Input */}
                <View style={localStyles.inputGroup}>
                  <AppText weight="bold" style={localStyles.inputLabel}>Target Kalori Harian (kcal)</AppText>
                  <TextInput
                    style={localStyles.textInput}
                    keyboardType="numeric"
                    value={calories}
                    onChangeText={setCalories}
                    placeholder="Contoh: 2000"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>

                {/* Target Goals */}
                <View style={localStyles.inputGroup}>
                  <AppText weight="bold" style={localStyles.inputLabel}>Target Fitness</AppText>
                  <View style={localStyles.gridOptions}>
                    {[
                      { key: 'fat_loss', label: 'Bakar Lemak 🔥' },
                      { key: 'muscle_gain', label: 'Besarkan Otot 💪' },
                      { key: 'healthy', label: 'Hidup Sehat 🥗' },
                    ].map(opt => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => setGoal(opt.key)}
                        style={[
                          localStyles.optionCard,
                          goal === opt.key && localStyles.optionCardActive
                        ]}
                      >
                        <AppText weight="bold" style={[
                          localStyles.optionText,
                          goal === opt.key && { color: theme.colors.background }
                        ]}>
                          {opt.label}
                        </AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Diet Preference */}
                <View style={localStyles.inputGroup}>
                  <AppText weight="bold" style={localStyles.inputLabel}>Preferensi Diet</AppText>
                  <View style={localStyles.gridOptions}>
                    {[
                      { key: 'balanced', label: 'Seimbang' },
                      { key: 'high_protein', label: 'Tinggi Protein' },
                      { key: 'keto', label: 'Low Carb/Keto' },
                      { key: 'vegan', label: 'Vegan/Vegetar' },
                    ].map(opt => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => setDiet(opt.key)}
                        style={[
                          localStyles.optionCard,
                          diet === opt.key && localStyles.optionCardActive
                        ]}
                      >
                        <AppText weight="bold" style={[
                          localStyles.optionText,
                          diet === opt.key && { color: theme.colors.background }
                        ]}>
                          {opt.label}
                        </AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Meals Count */}
                <View style={localStyles.inputGroup}>
                  <AppText weight="bold" style={localStyles.inputLabel}>Frekuensi Makan</AppText>
                  <View style={localStyles.gridOptions}>
                    {[
                      { key: 3, label: '3 Kali (Pagi, Siang, Malam)' },
                      { key: 4, label: '4 Kali (+ Camilan Sehat)' },
                    ].map(opt => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => setMealsCount(opt.key)}
                        style={[
                          localStyles.optionCard,
                          mealsCount === opt.key && localStyles.optionCardActive,
                          { flex: 1 }
                        ]}
                      >
                        <AppText weight="bold" style={[
                          localStyles.optionText,
                          mealsCount === opt.key && { color: theme.colors.background }
                        ]}>
                          {opt.label}
                        </AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={localStyles.generateBtn}
                  onPress={generateMealPlan}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator color={theme.colors.background} style={{ marginRight: 8 }} size="small" />
                      <AppText weight="bold" style={[localStyles.generateBtnText, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>
                        {loadingText}
                      </AppText>
                    </>
                  ) : (
                    <>
                      <Sparkles color={theme.colors.background} size={18} />
                      <AppText weight="bold" style={localStyles.generateBtnText}>Hasilkan Rencana Makanan</AppText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* Result Overview */}
                <View style={localStyles.resultHeader}>
                  <Sparkles color={theme.colors.primary} size={22} />
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold" style={{ fontSize: 16 }}>Rencana Makanan Anda</AppText>
                    <AppText style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                      Estimasi Harian: {mealPlan.total_calories} kcal · P: {mealPlan.total_protein}g · C: {mealPlan.total_carbs}g · F: {mealPlan.total_fats}g
                    </AppText>
                  </View>
                </View>

                {/* Meal Cards */}
                {mealPlan.meals.map((item, idx) => (
                  <View key={idx} style={localStyles.mealCard}>
                    <View style={localStyles.mealCardHeader}>
                      <View style={localStyles.timeBadge}>
                        <AppText weight="bold" style={localStyles.timeBadgeText}>{item.time}</AppText>
                      </View>
                      <AppText weight="bold" style={localStyles.mealCalories}>{item.calories} kcal</AppText>
                    </View>

                    <AppText weight="bold" style={localStyles.mealName}>{item.name}</AppText>
                    <AppText style={localStyles.mealPortion}>{item.portion}</AppText>

                    {/* Macro Breakdown mini badges */}
                    <View style={localStyles.macroRow}>
                      <AppText style={localStyles.macroItem}>P: <AppText weight="bold" style={{ color: theme.colors.text }}>{item.protein}g</AppText></AppText>
                      <AppText style={localStyles.macroItem}>C: <AppText weight="bold" style={{ color: theme.colors.text }}>{item.carbs}g</AppText></AppText>
                      <AppText style={localStyles.macroItem}>F: <AppText weight="bold" style={{ color: theme.colors.text }}>{item.fats}g</AppText></AppText>
                    </View>

                    {item.brief_tip && (
                      <View style={localStyles.tipBox}>
                        <AppText style={localStyles.tipText}>💡 {item.brief_tip}</AppText>
                      </View>
                    )}
                  </View>
                ))}

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <TouchableOpacity
                    onPress={() => setMealPlan(null)}
                    style={[localStyles.secondaryActionBtn, { flex: 1 }]}
                  >
                    <RefreshCw color={theme.colors.text} size={16} />
                    <AppText weight="bold" style={{ fontSize: 14 }}>Rancang Ulang</AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleApply}
                    style={[localStyles.primaryActionBtn, { flex: 1.5 }]}
                  >
                    <Check color={theme.colors.background} size={16} />
                    <AppText weight="bold" style={{ color: theme.colors.background, fontSize: 14 }}>Terapkan Target</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: '90%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  closeBtn: {
    padding: 8,
    backgroundColor: theme.colors.inputBg,
    borderRadius: 20
  },
  subText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: 24
  },
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 10
  },
  textInput: {
    backgroundColor: theme.colors.inputBg,
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: 'Inter_500Medium'
  },
  gridOptions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap'
  },
  optionCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: theme.colors.inputBg,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionCardActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  optionText: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center'
  },
  generateBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  generateBtnText: {
    color: theme.colors.background,
    fontSize: 15
  },
  resultHeader: {
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.15)',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 20
  },
  mealCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  timeBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: theme.colors.border
  },
  timeBadgeText: {
    fontSize: 11,
    color: theme.colors.primary
  },
  mealCalories: {
    fontSize: 13,
    color: theme.colors.text,
    fontVariant: ['tabular-nums']
  },
  mealName: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 4
  },
  mealPortion: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 12
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  macroItem: {
    fontSize: 12,
    color: theme.colors.textMuted
  },
  tipBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: theme.colors.border
  },
  tipText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16
  },
  primaryActionBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  secondaryActionBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  }
});
