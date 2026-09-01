import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Flame, CheckCircle2 } from 'lucide-react-native';
import { AppText, theme } from '../theme';
import { supabase, safeInsert } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SkiaProgressRing from './SkiaProgressRing';
import AIMealPlanModal from '../screens/AIMealPlanModal';
import { useDynamicIsland } from '../contexts/DynamicIslandContext';

import { generateWithGeminiCascade } from '../services/geminiService';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export default function NutritionWidget({ session, userProfile, refreshTrigger }) {
  const { showNotification } = useDynamicIsland();
  
  const [nutritionStats, setNutritionStats] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [macroTarget, setMacroTarget] = useState({ target_calories: 0, target_protein: 0 });
  const [todayMeals, setTodayMeals] = useState([]);
  
  const [manualNutModal, setManualNutModal] = useState(false);
  const [mealPlannerVisible, setMealPlannerVisible] = useState(false);
  const [manualNutForm, setManualNutForm] = useState({ food: '', cal: '', p: '', c: '', f: '' });
  
  const [aiFoodInput, setAiFoodInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingText, setAiLoadingText] = useState("AI Berpikir...");
  const [loading, setLoading] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      syncOfflineNutrition();
      fetchNutritionData();
    }
  }, [session, refreshTrigger]);

  const syncOfflineNutrition = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const userId = session.user.id;
      const nutQueueStr = await AsyncStorage.getItem(`offline_nutrition_${userId}`);
      if (nutQueueStr) {
        const nutQueue = JSON.parse(nutQueueStr);
        if (nutQueue.length > 0) {
          let successCount = 0;
          for (const item of nutQueue) {
            const { error } = await safeInsert('nutrition_logs', {
              user_id: userId,
              food_name: item.food_name,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs || 0,
              fats: item.fats || 0,
              created_at: item.created_at || new Date().toISOString()
            });
            if (!error) successCount++;
          }
          await AsyncStorage.removeItem(`offline_nutrition_${userId}`);
          if (successCount > 0) {
            showNotification({
              type: 'success',
              title: 'Nutrisi Sinkron! 🥗',
              subtitle: `Berhasil mengunggah ${successCount} riwayat makan offline.`,
              duration: 4000
            });
          }
        }
      }
    } catch (nutErr) {

    } finally {
      setIsSyncing(false);
    }
  };

  const fetchNutritionData = async () => {
    if (!session?.user?.id) return;
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: numLogs } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', todayStart.toISOString());
      
      if (numLogs) {
        let cal = 0, p = 0, c = 0, f = 0;
        numLogs.forEach(l => {
          cal += Number(l.calories) || 0;
          p += Number(l.protein) || 0;
          c += Number(l.carbs) || 0;
          f += Number(l.fats) || 0;
        });
        setNutritionStats({ calories: cal, protein: p, carbs: c, fats: f });
        setTodayMeals(numLogs);
      } else {
        setTodayMeals([]);
      }

      const macroData = await AsyncStorage.getItem(`nutrition_goals_${session.user.id}`);
      if (macroData) {
        setMacroTarget(JSON.parse(macroData));
      } else {
        setMacroTarget({ target_calories: 0, target_protein: 0 });
      }
    } catch (e) {

    }
  };

  const handleAIFoodParse = async () => {
    if (!aiFoodInput.trim()) return;
    setAiLoading(true);
    try {
      const prompt = `Anda adalah asisten nutrisi kelas dunia. Ekstrak data makanan berikut: "${aiFoodInput}" ke format JSON: {"food": "Nama Makanan", "cal": 123, "p": 12, "c": 34, "f": 5}. Jika protein, karbo, atau lemak tidak disebutkan, buat estimasi kasar secara logis berdasarkan database gizi umum. Kembalikan HANYA JSON valid tanpa markdown.`;
      
      const { text: aiText, modelUsed } = await generateWithGeminiCascade({
        prompt,
        responseMimeType: 'application/json'
      });


      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      setManualNutForm({
        food: parsed.food || '',
        cal: String(parsed.cal || '0'),
        p: String(parsed.p || '0'),
        c: String(parsed.c || '0'),
        f: String(parsed.f || '0')
      });
      setAiFoodInput('');
      
      showNotification({
        type: 'success',
        title: 'AI Parse Success 🥗',
        subtitle: `Form terisi otomatis (${modelUsed}): ${parsed.food || 'Makanan'}`,
        duration: 2500,
      });
    } catch (e) {

      Alert.alert("Gagal memproses", "AI gagal mendeteksi makanan. Coba ketik dengan format lebih jelas (cth: dada ayam bakar 200 kalori).");
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogManualNutrition = async () => {
    if (!manualNutForm.food || !manualNutForm.cal) {
      alert("Please enter food name and calories.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('nutrition_logs').insert({
      user_id: session.user.id,
      food_name: manualNutForm.food,
      calories: parseFloat(manualNutForm.cal) || 0,
      protein: parseFloat(manualNutForm.p) || 0,
      carbs: parseFloat(manualNutForm.c) || 0,
      fats: parseFloat(manualNutForm.f) || 0
    });
    setLoading(false);
    if (!error) {
      setManualNutModal(false);
      setManualNutForm({ food: '', cal: '', p: '', c: '', f: '' });
      fetchNutritionData();
    } else {
      alert("Failed to save meal: " + error.message);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    setLoading(true);
    const { error } = await supabase.from('nutrition_logs').delete().eq('id', mealId);
    setLoading(false);
    if (error) {
      alert("Failed to delete meal: " + error.message);
    } else {
      fetchNutritionData();
    }
  };

  const applyMacroTarget = async (calories, protein) => {
    try {
      const target = { target_calories: calories, target_protein: protein };
      await AsyncStorage.setItem(`nutrition_goals_${session.user.id}`, JSON.stringify(target));
      setMacroTarget(target);
      const { error } = await supabase
        .from('profiles')
        .update({ nutrition_goals: target })
        .eq('id', session.user.id);
      if (error) console.warn("[NutritionWidget] Failed to sync nutrition target to Supabase:", error.message);
    } catch (err) {

    }
  };

  useEffect(() => {
    let interval;
    if (aiLoading) {
      const phrases = [
        "Menganalisis nutrisi...",
        "Menghitung porsi...",
        "Mengekstrak makro...",
        "Menyelesaikan log..."
      ];
      let i = 0;
      setAiLoadingText(phrases[0]);
      interval = setInterval(() => {
        i = (i + 1) % phrases.length;
        setAiLoadingText(phrases[i]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [aiLoading]);

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 16 }}>
        <AppText weight="bold" style={{ fontSize: 18 }}>Daily Nutrition</AppText>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => setMealPlannerVisible(true)} 
            style={{ 
              backgroundColor: 'rgba(245, 158, 11, 0.12)', 
              paddingHorizontal: 10, 
              paddingVertical: 6, 
              borderRadius: 8, 
              borderWidth: 1, 
              borderColor: 'rgba(245, 158, 11, 0.35)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}
          >
            <AppText weight="bold" style={{ color: '#F59E0B', fontSize: 12 }}>🍳 AI Chef & Plan</AppText>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setManualNutModal(true)}
            style={{ 
              backgroundColor: 'rgba(204, 255, 0, 0.1)', 
              paddingHorizontal: 10, 
              paddingVertical: 6, 
              borderRadius: 8, 
              borderWidth: 1, 
              borderColor: 'rgba(204, 255, 0, 0.3)' 
            }}
          >
            <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 12 }}>+ Log Meal</AppText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ backgroundColor: theme.colors.card, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 4 }}>
              Calories Consumed {macroTarget?.target_calories > 0 ? `(Target: ${macroTarget.target_calories} kcal)` : ''}
            </AppText>
            <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 24, fontVariant: ['tabular-nums'] }}>
              {nutritionStats.calories}
              {macroTarget?.target_calories > 0 && <AppText style={{ fontSize: 16, color: theme.colors.textMuted }}> / {macroTarget.target_calories}</AppText>}
              <AppText style={{ fontSize: 14, color: theme.colors.textMuted }}> kcal</AppText>
            </AppText>
            {macroTarget?.target_calories > 0 && (
              <AppText style={{ color: nutritionStats.calories > macroTarget.target_calories ? '#EF4444' : '#D4F53C', fontSize: 11, marginTop: 4 }}>
                {nutritionStats.calories > macroTarget.target_calories 
                  ? `Over ${nutritionStats.calories - macroTarget.target_calories} kcal` 
                  : `${macroTarget.target_calories - nutritionStats.calories} kcal remaining`}
              </AppText>
            )}
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(212,245,60,0.06)', justifyContent: 'center', alignItems: 'center' }}>
            <Flame color={theme.colors.primary} size={20} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 16, marginTop: 16 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <SkiaProgressRing 
              progress={nutritionStats.protein / (macroTarget?.target_protein || 150)} 
              size={68} strokeWidth={6} primaryColor="#D4F53C" secondaryColor="rgba(212,245,60,0.15)"
            />
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text }}>{nutritionStats.protein}g</AppText>
              <AppText style={{ fontSize: 9, color: theme.colors.textMuted }}>PRO</AppText>
            </View>
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <SkiaProgressRing 
              progress={nutritionStats.carbs / 250} 
              size={68} strokeWidth={6} primaryColor="#00F0FF" secondaryColor="rgba(0,240,255,0.15)"
            />
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text }}>{nutritionStats.carbs}g</AppText>
              <AppText style={{ fontSize: 9, color: theme.colors.textMuted }}>CARB</AppText>
            </View>
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <SkiaProgressRing 
              progress={nutritionStats.fats / 70} 
              size={68} strokeWidth={6} primaryColor="#FF9F0A" secondaryColor="rgba(255,159,10,0.15)"
            />
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text }}>{nutritionStats.fats}g</AppText>
              <AppText style={{ fontSize: 9, color: theme.colors.textMuted }}>FAT</AppText>
            </View>
          </View>
        </View>
      </View>

      {todayMeals.length > 0 && (
        <View style={{ marginBottom: 20, gap: 8 }}>
          {todayMeals.map(meal => (
            <View key={meal.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.card, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border }}>
              <View>
                <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 14 }}>{meal.food_name}</AppText>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 12 }}>{meal.calories} kcal · P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g</AppText>
              </View>
              <TouchableOpacity onPress={() => handleDeleteMeal(meal.id)} style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <AppText weight="bold" style={{ color: '#EF4444', fontSize: 11 }}>Delete</AppText>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal visible={manualNutModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <AppText weight="bold" style={{ fontSize: 20 }}>Manual Meal Entry</AppText>
              <TouchableOpacity onPress={() => setManualNutModal(false)}>
                <CheckCircle2 color={theme.colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,245,60,0.2)' }}>
              <AppText weight="bold" style={{ fontSize: 13, color: theme.colors.primary, marginBottom: 6 }}>✨ AI Fast Log (Tulis Bebas)</AppText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={{ 
                    flex: 1, 
                    backgroundColor: theme.colors.inputBg, 
                    color: theme.colors.text, 
                    borderRadius: 10, 
                    paddingHorizontal: 12, 
                    paddingVertical: 10, 
                    fontSize: 14, 
                    borderWidth: 1, 
                    borderColor: theme.colors.border 
                  }}
                  placeholder="cth: dada ayam bakar 200g plus nasi"
                  placeholderTextColor={theme.colors.textMuted}
                  value={aiFoodInput}
                  onChangeText={setAiFoodInput}
                />
                <TouchableOpacity 
                  disabled={aiLoading}
                  onPress={handleAIFoodParse}
                  style={{ 
                    backgroundColor: theme.colors.primary, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    paddingHorizontal: 16, 
                    borderRadius: 10,
                    flexDirection: 'row'
                  }}
                >
                  {aiLoading ? (
                    <>
                      <ActivityIndicator size="small" color="#000" style={{ marginRight: 6 }} />
                      <AppText weight="bold" style={{ color: '#000', fontSize: 11, maxWidth: 90 }} numberOfLines={1}>{aiLoadingText}</AppText>
                    </>
                  ) : (
                    <AppText weight="bold" style={{ color: '#000', fontSize: 13 }}>Gunakan AI</AppText>
                  )}
                </TouchableOpacity>
              </View>
              <AppText style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 6, lineHeight: 14 }}>
                AI akan otomatis mengestimasi kalori & makro nutrisi lalu mengisi form di bawah.
              </AppText>
            </View>
            
            <AppText style={{ color: theme.colors.textMuted, marginBottom: 8, fontSize: 12 }}>Food Name</AppText>
            <TextInput
              style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border }}
              placeholder="e.g. Nasi Goreng"
              placeholderTextColor={theme.colors.textMuted}
              value={manualNutForm.food}
              onChangeText={t => setManualNutForm(prev => ({...prev, food: t}))}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <AppText style={{ color: theme.colors.textMuted, marginBottom: 8, fontSize: 12 }}>Calories (kcal)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border }}
                  keyboardType="numeric" placeholder="0" placeholderTextColor={theme.colors.textMuted}
                  value={manualNutForm.cal} onChangeText={t => setManualNutForm(prev => ({...prev, cal: t}))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ color: theme.colors.textMuted, marginBottom: 8, fontSize: 12 }}>Protein (g)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border }}
                  keyboardType="numeric" placeholder="0" placeholderTextColor={theme.colors.textMuted}
                  value={manualNutForm.p} onChangeText={t => setManualNutForm(prev => ({...prev, p: t}))}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
              <View style={{ flex: 1 }}>
                <AppText style={{ color: theme.colors.textMuted, marginBottom: 8, fontSize: 12 }}>Carbs (g)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border }}
                  keyboardType="numeric" placeholder="0" placeholderTextColor={theme.colors.textMuted}
                  value={manualNutForm.c} onChangeText={t => setManualNutForm(prev => ({...prev, c: t}))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ color: theme.colors.textMuted, marginBottom: 8, fontSize: 12 }}>Fats (g)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border }}
                  keyboardType="numeric" placeholder="0" placeholderTextColor={theme.colors.textMuted}
                  value={manualNutForm.f} onChangeText={t => setManualNutForm(prev => ({...prev, f: t}))}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: theme.colors.primary, padding: 18, borderRadius: 16, alignItems: 'center' }}
              onPress={handleLogManualNutrition}
            >
              {loading ? <ActivityIndicator color="#000" /> : <AppText weight="bold" style={{ color: '#000', fontSize: 16 }}>Save Meal</AppText>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AIMealPlanModal 
        visible={mealPlannerVisible}
        onClose={() => setMealPlannerVisible(false)}
        session={session}
        userProfile={userProfile}
        onApplyTarget={applyMacroTarget}
      />
    </>
  );
}
