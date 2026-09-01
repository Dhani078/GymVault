import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MessageCircle, X, Send, User } from 'lucide-react-native';
import { AppText, styles, theme } from '../theme';
import AICoachLogo from '../components/AICoachLogo';
import { GEMINI_MODELS_CASCADE } from '../services/geminiService';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SUGGESTIONS = [
  { label: '💧 +250ml', text: 'Saya minum air 250ml' },
  { label: '💧 +500ml', text: 'Saya minum air 500ml' },
  { label: '🥗 Dada Ayam', text: 'Saya makan dada ayam 200 kalori protein 30g' },
  { label: '🏋️ Bench Press', text: 'Saya latihan Bench Press 3 set 10 reps beban 60kg' },
  { label: '🏋️ Squat', text: 'Saya latihan Squat 3 set 8 reps beban 80kg' },
];

export default function AIChatBubble() {
  const [modalVisible, setModalVisible] = useState(false);
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', text: 'Halo! Saya AI Coach GymVault Anda. Ada yang ingin ditanyakan seputar latihan, nutrisi, atau cara pakai aplikasi ini?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("AI Coach sedang berpikir...");
  const flatListRef = useRef(null);

  const sendMessageRef = useRef();
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  useEffect(() => {
    let interval;
    if (isLoading) {
      const phrases = [
        "Berpikir...",
        "Menganalisis kalimat lu...",
        "Mencari info gym terbaik...",
        "Memproses data log...",
        "Menulis jawaban asik..."
      ];
      let i = 0;
      setLoadingText(phrases[0]);
      interval = setInterval(() => {
        i = (i + 1) % phrases.length;
        setLoadingText(phrases[i]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const { DeviceEventEmitter } = require('react-native');
    const sub = DeviceEventEmitter.addListener('open_ai_coach_chat', (data) => {
      setModalVisible(true);
      if (data && data.message) {
        setTimeout(() => {
          sendMessageRef.current?.(data.message);
        }, 150);
      }
    });
    return () => sub.remove();
  }, []);

  const processAICoachLog = async (log) => {
    if (!log || !log.type) return null;

    try {
      const { supabase } = require('../supabaseClient');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const { DeviceEventEmitter } = require('react-native');

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (log.type === 'water') {
        const mlToAdd = Number(log.data?.ml) || 0;
        if (mlToAdd <= 0) return null;

        const todayStr = getLocalDateString();
        const waterData = await AsyncStorage.getItem('daily_water_ml');
        let currentMl = 0;

        if (waterData) {
          try {
            const parsed = JSON.parse(waterData);
            if (parsed.date === todayStr) {
              currentMl = parsed.ml || 0;
            }
          } catch (e) {}
        }

        const newMl = currentMl + mlToAdd;
        await AsyncStorage.setItem('daily_water_ml', JSON.stringify({ date: todayStr, ml: newMl }));

        // Also update water_history for long-term history tracking
        const historyStr = await AsyncStorage.getItem('water_history');
        let history = {};
        if (historyStr) {
          try { history = JSON.parse(historyStr); } catch (e) {}
        }
        history[todayStr] = newMl;
        await AsyncStorage.setItem('water_history', JSON.stringify(history));

        DeviceEventEmitter.emit('activity_logged');
        return { type: 'water', ml: mlToAdd };
      } 
      
      else if (log.type === 'nutrition') {
        if (!userId) return null;

        let foodName = log.data?.food || 'Makanan';
        let cal = Number(log.data?.cal) || 0;
        let p = Number(log.data?.p) || 0;
        let c = Number(log.data?.c) || 0;
        let f = Number(log.data?.f) || 0;

        try {
          const { matchNutritionDataset } = require('../services/NutritionDataset');
          const matched = matchNutritionDataset(foodName);
          if (matched) {
            foodName = matched.name;
            cal = matched.cal;
            p = matched.p;
            c = matched.c;
            f = matched.f;
          }
        } catch (e) {

        }

        const { data: inserted } = await supabase.from('nutrition_logs').insert({
          user_id: userId,
          food_name: foodName,
          calories: cal,
          protein: p,
          carbs: c,
          fats: f
        }).select('id').single();

        DeviceEventEmitter.emit('activity_logged');
        return { type: 'nutrition', id: inserted?.id, food: foodName, cal: cal, protein: p };
      } 
      
      else if (log.type === 'workout') {
        const splitName = log.data?.split || 'Latihan AI Coach';
        const exercises = log.data?.exercises || [];
        if (exercises.length === 0) return null;

        // If the AI flagged this to go straight to live logger
        if (log.data?.save_to_history === false) {
          setTimeout(() => {
            DeviceEventEmitter.emit('start_live_workout', {
              split_name: splitName,
              exercises: exercises
            });
            setModalVisible(false);
          }, 800);

          return { type: 'workout_live', split: splitName, exercises: exercises };
        }

        if (!userId) return null;

        const { data: sessionData, error: sessionErr } = await supabase.from('workout_sessions').insert({
          user_id: userId,
          started_at: new Date().toISOString(),
          is_completed: true,
          split_name: splitName
        }).select('id').single();

        if (sessionErr || !sessionData) return null;
        const sessionId = sessionData.id;

        for (const ex of exercises) {
          let { data: exData } = await supabase
            .from('exercises')
            .select('id')
            .eq('name', ex.name)
            .maybeSingle();

          let exerciseId = exData?.id;

          if (!exerciseId) {
            const { data: newEx, error: newExErr } = await supabase.from('exercises').insert({
              name: ex.name,
              muscle_group: ex.muscle_group || 'Custom',
              equipment_type: 'Other'
            }).select('id').single();

            if (!newExErr && newEx) {
              exerciseId = newEx.id;
            }
          }

          if (exerciseId && ex.sets && ex.sets.length > 0) {
            const setRows = ex.sets.map((s, idx) => ({
              session_id: sessionId,
              exercise_id: exerciseId,
              set_index: idx + 1,
              weight_kg: Number(s.weight) || 0,
              reps: Number(s.reps) || 0,
              is_checked: true
            }));

            await supabase.from('workout_sets').insert(setRows);
          }
        }

        DeviceEventEmitter.emit('activity_logged');
        return { type: 'workout', id: sessionId, split: splitName, exercises: exercises };
      }
    } catch (e) {

    }
    return null;
  };

  const handleUndo = async (messageId, log) => {
    if (!log) return;

    try {
      const { supabase } = require('../supabaseClient');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const { DeviceEventEmitter } = require('react-native');

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (log.type === 'water') {
        const mlToSubtract = Number(log.ml) || 0;
        const todayStr = getLocalDateString();
        const waterData = await AsyncStorage.getItem('daily_water_ml');

        let newMl = 0;
        if (waterData) {
          try {
            const parsed = JSON.parse(waterData);
            if (parsed.date === todayStr) {
              newMl = Math.max(0, (parsed.ml || 0) - mlToSubtract);
              await AsyncStorage.setItem('daily_water_ml', JSON.stringify({ date: todayStr, ml: newMl }));
            }
          } catch (e) {}
        }

        const historyStr = await AsyncStorage.getItem('water_history');
        if (historyStr) {
          try {
            const history = JSON.parse(historyStr);
            if (newMl <= 0) {
              delete history[todayStr];
            } else {
              history[todayStr] = newMl;
            }
            await AsyncStorage.setItem('water_history', JSON.stringify(history));
          } catch (e) {}
        }
      } 
      
      else if (log.type === 'nutrition') {
        if (log.id) {
          await supabase.from('nutrition_logs').delete().eq('id', log.id);
        } else if (userId) {
          const queueStr = await AsyncStorage.getItem(`offline_nutrition_${userId}`);
          if (queueStr) {
            let queue = JSON.parse(queueStr);
            const idx = queue.findIndex(x => x.food_name === log.food && x.calories === log.cal);
            if (idx > -1) {
              queue.splice(idx, 1);
              await AsyncStorage.setItem(`offline_nutrition_${userId}`, JSON.stringify(queue));
            }
          }
        }
      } 
      
      else if (log.type === 'workout') {
        if (log.id) {
          await supabase.from('workout_sessions').delete().eq('id', log.id);
        } else if (userId) {
          const queueStr = await AsyncStorage.getItem(`offline_workouts_${userId}`);
          if (queueStr) {
            let queue = JSON.parse(queueStr);
            const idx = queue.findIndex(x => x.sessionPayload?.split_name === log.split);
            if (idx > -1) {
              queue.splice(idx, 1);
              await AsyncStorage.setItem(`offline_workouts_${userId}`, JSON.stringify(queue));
            }
          }
        }
      }

      DeviceEventEmitter.emit('activity_logged');

      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, log: null, isUndone: true };
        }
        return m;
      }));

    } catch (e) {

    }
  };

  const processOfflineMessage = async (text) => {
    const cleanText = text.toLowerCase();
    const todayStr = getLocalDateString();
    const { DeviceEventEmitter } = require('react-native');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const { supabase } = require('../supabaseClient');
    
    let userId = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
    } catch (e) {}

    // 1. WATER DETECTOR
    if (cleanText.includes('minum') || cleanText.includes('air') || cleanText.includes('water') || cleanText.includes('💧')) {
      const mlMatch = cleanText.match(/(\d+)\s*(ml|l|liter)?/);
      let ml = 250;
      if (mlMatch) {
        let val = Number(mlMatch[1]);
        if (cleanText.includes('liter') || (mlMatch[2] && (mlMatch[2] === 'l' || mlMatch[2] === 'liter'))) {
          if (val < 10) val = val * 1000;
        }
        ml = val;
      }

      const waterData = await AsyncStorage.getItem('daily_water_ml');
      let currentMl = 0;
      if (waterData) {
        try {
          const parsed = JSON.parse(waterData);
          if (parsed.date === todayStr) {
            currentMl = parsed.ml || 0;
          }
        } catch (e) {}
      }
      const newMl = currentMl + ml;
      await AsyncStorage.setItem('daily_water_ml', JSON.stringify({ date: todayStr, ml: newMl }));

      const historyStr = await AsyncStorage.getItem('water_history');
      let history = {};
      if (historyStr) {
        try { history = JSON.parse(historyStr); } catch (e) {}
      }
      history[todayStr] = newMl;
      await AsyncStorage.setItem('water_history', JSON.stringify(history));

      DeviceEventEmitter.emit('activity_logged');

      return {
        reply: `Yo Bro! Air minum sebanyak ${ml}ml udah gua catet secara offline di perangkat lu. Total hari ini: ${newMl}ml. Mantap, keep hydrating! 💧`,
        log: { type: 'water', ml: ml }
      };
    }

    // 2. NUTRITION DETECTOR
    if (cleanText.includes('makan') || cleanText.includes('nutrisi') || cleanText.includes('kalori') || cleanText.includes('protein')) {
      let foodName = 'Makanan';
      if (cleanText.includes('makan')) {
        const idx = cleanText.indexOf('makan');
        const afterMakan = text.substring(idx + 5).trim();
        if (afterMakan) {
          foodName = afterMakan.split(' ')[0] + (afterMakan.split(' ')[1] ? ' ' + afterMakan.split(' ')[1] : '');
        }
      }

      const calMatch = cleanText.match(/(\d+)\s*(kalori|cal|kcal)/);
      let cal = 300;
      if (calMatch) cal = Number(calMatch[1]);

      const protMatch = cleanText.match(/(\d+)\s*(g|gr|gram)?\s*protein/i) || cleanText.match(/protein\s*(\d+)/i);
      let p = 20;
      if (protMatch) p = Number(protMatch[1]);

      if (userId) {
        const nutQueueStr = await AsyncStorage.getItem(`offline_nutrition_${userId}`);
        const nutQueue = nutQueueStr ? JSON.parse(nutQueueStr) : [];
        nutQueue.push({ food_name: foodName, calories: cal, protein: p, carbs: 30, fats: 8, created_at: new Date().toISOString() });
        await AsyncStorage.setItem(`offline_nutrition_${userId}`, JSON.stringify(nutQueue));
      }

      return {
        reply: `Yo Bro! Makanan "${foodName}" (${cal} kalori, ${p}g protein) udah gua catet di antrean offline. Begitu koneksi internet lu balik, langsung disinkronisasi ke cloud! 🥗`,
        log: { type: 'nutrition', food: foodName, cal: cal, protein: p }
      };
    }

    // 3. WORKOUT DETECTOR
    if (cleanText.includes('latihan') || cleanText.includes('workout') || cleanText.includes('set') || cleanText.includes('reps')) {
      let splitName = 'Latihan Mandiri';
      if (cleanText.includes('bench press') || cleanText.includes('chest')) splitName = 'Chest Day';
      else if (cleanText.includes('squat') || cleanText.includes('leg')) splitName = 'Leg Day';
      else if (cleanText.includes('deadlift') || cleanText.includes('back')) splitName = 'Back Day';

      let exerciseName = 'Latihan Beban';
      const exercisesList = ['bench press', 'squat', 'deadlift', 'overhead press', 'bicep curl', 'tricep pushdown', 'pull up', 'push up', 'lateral raise'];
      for (const ex of exercisesList) {
        if (cleanText.includes(ex)) {
          exerciseName = ex.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          break;
        }
      }

      const repsMatch = cleanText.match(/(\d+)\s*(reps|rep|kali)/);
      const setsMatch = cleanText.match(/(\d+)\s*(set)/);
      const weightMatch = cleanText.match(/(\d+)\s*(kg|kilogram|beban)/);

      let reps = repsMatch ? Number(repsMatch[1]) : 10;
      let sets = setsMatch ? Number(setsMatch[1]) : 3;
      let kg = weightMatch ? Number(weightMatch[1]) : 20;

      if (userId) {
        const sessionPayload = {
          user_id: userId,
          started_at: new Date().toISOString(),
          is_completed: true,
          split_name: splitName
        };
        const workoutData = [{
          name: exerciseName,
          sets: Array.from({ length: sets }, (_, i) => ({ completed: true, kg: kg, reps: reps }))
        }];

        const queueStr = await AsyncStorage.getItem(`offline_workouts_${userId}`);
        const queue = queueStr ? JSON.parse(queueStr) : [];
        queue.push({ sessionPayload, workoutData });
        await AsyncStorage.setItem(`offline_workouts_${userId}`, JSON.stringify(queue));

        DeviceEventEmitter.emit('activity_logged');
      }

      return {
        reply: `Yo Bro! Latihan ${exerciseName} (${sets} set x ${reps} reps, ${kg}kg) berhasil dicatat secara offline di Logger! Data ini akan otomatis sinkron ke profil lu pas online nanti. 🔥`,
        log: { type: 'workout', split: splitName, exercises: [{ name: exerciseName, sets: Array.from({ length: sets }, () => ({ weight: kg, reps: reps })) }] }
      };
    }

    return null;
  };

  const sendMessage = async (overrideText = null) => {
    const actualOverrideText = (overrideText && typeof overrideText === 'string') ? overrideText : null;
    const textToSend = actualOverrideText || inputText.trim();
    if (!textToSend) return;
    
    const userMsg = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!actualOverrideText) setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history for Gemini API, ensuring we start with a 'user' turn and alternate roles strictly
      const rawHistory = [];
      messages.forEach(m => {
        // Skip initial greeting message or any assistant message at the very start
        if (rawHistory.length === 0 && m.role === 'assistant') {
          return;
        }
        rawHistory.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.text
        });
      });
      rawHistory.push({ role: 'user', text: textToSend });

      // Sanitize rawHistory to strictly alternate
      const history = [];
      rawHistory.forEach(item => {
        if (history.length === 0) {
          if (item.role === 'user') {
            history.push({ role: 'user', parts: [{ text: item.text }] });
          }
        } else {
          const lastItem = history[history.length - 1];
          if (lastItem.role === item.role) {
            // Merge adjacent turns of same role
            lastItem.parts[0].text += "\n" + item.text;
          } else {
            history.push({ role: item.role, parts: [{ text: item.text }] });
          }
        }
      });

      let aiText = '';
      let modelSuccess = '';

      for (const modelName of GEMINI_MODELS_CASCADE) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: "Anda adalah AI Coach GymVault, asisten kebugaran dan nutrisi profesional yang asik, friendly, dan menggunakan gaya bahasa 'gym bros' ala Indonesia (seperti kata 'Bro', 'Sis', dll). Tugas Anda adalah menjawab pertanyaan pengguna HANYA seputar fitness/gym/nutrisi serta memproses log aktivitas harian pengguna. Anda WAJIB mengembalikan jawaban HANYA dalam format JSON valid (tanpa pembungkus markdown ```json). Format JSON:\n{\n  \"reply\": \"Jawaban asik dan friendly Anda di sini (tanpa simbol markdown seperti **)\",\n  \"log\": {\n    \"type\": \"water\" | \"nutrition\" | \"workout\" | null,\n    \"data\": {\n       \"ml\": 500,\n       \"food\": \"Nama makanan\", \"cal\": 500, \"p\": 30, \"c\": 50, \"f\": 10,\n       \"split\": \"Nama workout split\",\n       \"save_to_history\": true | false,\n       \"exercises\": [\n         {\"name\": \"Barbell Bench Press\", \"muscle_group\": \"Chest\" | \"Back\" | \"Shoulders\" | \"Arms\" | \"Quads\" | \"Hamstrings\" | \"Core\", \"sets\": [{\"reps\": 10, \"weight\": 60}]}\n       ]\n    }\n  }\n}\nDeteksi kata kunci pencatatan:\n- Air (water): jika user minum (ml/liter).\n- Makanan (nutrition): jika user makan (kalori, p, c, f). Jika protein/karbo/lemak tidak disebut, estimasikan nilainya secara logis.\n- Workout: jika user menyebutkan gerakan latihan (set, rep, beban). Cari tahu dan kelompokkan muscle_group untuk tiap gerakan latihan dengan tepat dari opsi: Chest, Back, Shoulders, Arms, Quads, Hamstrings, Core.\n  * Jika user menyatakan SUDAH selesai melakukan latihan (contoh: 'saya sudah main...', 'latihan hari ini selesai...', 'tadi abis latihan...'), set \"save_to_history\": true.\n  * Jika user menyatakan INGIN melakukan latihan sekarang/hari ini (contoh: 'saya mau main...', 'hari ini mau push day...', 'tambah ke logger...'), set \"save_to_history\": false." }]
              },
              contents: history
            })
          });

          const data = await response.json();
          if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            aiText = data.candidates[0].content.parts[0].text;
            modelSuccess = modelName;

            break;
          }
        } catch (err) {

        }
      }

      if (!aiText) {
        throw new Error("All Gemini cascade models failed to respond.");
      }
      
      let replyText = aiText;
      let logData = null;
      try {
        let cleanJsonStr = aiText.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
        const jsonStart = cleanJsonStr.indexOf('{');
        const jsonEnd = cleanJsonStr.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
           cleanJsonStr = cleanJsonStr.substring(jsonStart, jsonEnd + 1);
        }

        const parsed = JSON.parse(cleanJsonStr);
        replyText = parsed.reply || aiText;
        logData = parsed.log;
      } catch (err) {

      }

      let loggedInfo = null;
      if (logData) {
        loggedInfo = await processAICoachLog(logData);
      }

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        text: replyText,
        log: loggedInfo
      }]);
    } catch (error) {

      
      // Attempt offline pattern matching
      let offlineResult = null;
      try {
        offlineResult = await processOfflineMessage(textToSend);
      } catch (offErr) {

      }

      if (offlineResult) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          text: offlineResult.reply,
          log: offlineResult.log
        }]);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          text: `Yo Bro! Koneksi internet lu lagi keputus nih (atau API sedang sibuk).\n\nTapi tenang, lu tetep bisa mencatat log harian secara offline lewat chat ini:\n💧 Air (misal: "minum 500ml")\n🥗 Nutrisi (misal: "makan dada ayam 200 kalori")\n🏋️ Latihan (misal: "Bench Press 3 set 10 reps 60kg")\n\nNanti datanya bakal langsung disinkronisasi pas internet lu udah aktif lagi! 🔥` 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    
    // Pecah teks berdasarkan baris baru agar rapi
    const textBlocks = item.text.split('\n').filter(t => t.trim() !== '');

    const renderLogCard = () => {
      if (item.isUndone) {
        return (
          <View style={{ marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText style={{ color: '#EF4444', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>❌ Pencatatan dibatalkan</AppText>
          </View>
        );
      }
      if (!item.log) return null;

      let icon = "💧";
      let title = "";
      let subtitle = "";
      let cardBg = 'rgba(59, 130, 246, 0.05)';
      let cardBorder = 'rgba(59, 130, 246, 0.15)';
      let accentColor = '#3B82F6';

      if (item.log.type === 'water') {
        icon = "💧";
        title = `Air Minum`;
        subtitle = `+${item.log.ml} ml`;
        cardBg = 'rgba(59, 130, 246, 0.04)';
        cardBorder = 'rgba(59, 130, 246, 0.15)';
        accentColor = '#3B82F6';
      } else if (item.log.type === 'nutrition') {
        icon = "🥗";
        title = item.log.food || 'Makanan';
        subtitle = `${item.log.cal} kcal${item.log.protein ? ` • ${item.log.protein}g protein` : ''}`;
        cardBg = 'rgba(16, 185, 129, 0.04)';
        cardBorder = 'rgba(16, 185, 129, 0.15)';
        accentColor = '#10B981';
      } else if (item.log.type === 'workout') {
        icon = "🏋️";
        title = item.log.split || 'Latihan Beban';
        subtitle = item.log.exercises ? `${item.log.exercises.length} gerakan` : '';
        cardBg = 'rgba(204, 255, 0, 0.04)';
        cardBorder = 'rgba(204, 255, 0, 0.15)';
        accentColor = theme.colors.primary;
      } else if (item.log.type === 'workout_live') {
        icon = "⚡";
        title = item.log.split || 'Latihan';
        subtitle = 'Mencatat live...';
        cardBg = 'rgba(245, 158, 11, 0.04)';
        cardBorder = 'rgba(245, 158, 11, 0.15)';
        accentColor = '#F59E0B';
      }

      const isWorkout = item.log.type === 'workout';
      const isWorkoutLive = item.log.type === 'workout_live';
      const canUndo = ['water', 'nutrition', 'workout'].includes(item.log.type);

      return (
        <View style={{ 
          marginTop: 10, 
          padding: 12, 
          borderRadius: 14, 
          backgroundColor: cardBg, 
          borderWidth: 1, 
          borderColor: cardBorder,
        }}>
          {/* Header Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' }}>
                <AppText style={{ fontSize: 15 }}>{icon}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="bold" numberOfLines={1} style={{ color: theme.colors.text, fontSize: 13 }}>
                  {title}
                </AppText>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 1 }}>
                  {subtitle}
                </AppText>
              </View>
            </View>

            {canUndo && (
              <TouchableOpacity 
                onPress={() => handleUndo(item.id, item.log)}
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.15)'
                }}
              >
                <AppText weight="bold" style={{ color: '#EF4444', fontSize: 10 }}>Batalkan</AppText>
              </TouchableOpacity>
            )}

            {isWorkoutLive && (
              <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.15)' }}>
                <AppText weight="bold" style={{ color: '#F59E0B', fontSize: 10 }}>Live Logger</AppText>
              </View>
            )}
          </View>
          
          {/* Exercise list for Workout log */}
          {isWorkout && item.log.exercises && item.log.exercises.length > 0 && (
            <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 8, gap: 2 }}>
              {item.log.exercises.slice(0, 3).map((ex, idx) => (
                <AppText key={idx} style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                  • {ex.name} ({ex.sets?.length || 0} set)
                </AppText>
              ))}
              {item.log.exercises.length > 3 && (
                <AppText style={{ color: theme.colors.textMuted, fontSize: 10, fontStyle: 'italic', marginLeft: 6 }}>
                  dan {item.log.exercises.length - 3} gerakan lainnya
                </AppText>
              )}
            </View>
          )}

          {/* Kirim ke Logger Button for Workout log */}
          {isWorkout && item.log.exercises && item.log.exercises.length > 0 && (
            <TouchableOpacity
              onPress={async () => {
                if (item.log.id) {
                  const { supabase } = require('../supabaseClient');
                  await supabase.from('workout_sessions').delete().eq('id', item.log.id);
                }
                
                const { DeviceEventEmitter } = require('react-native');
                DeviceEventEmitter.emit('start_live_workout', {
                  split_name: item.log.split,
                  exercises: item.log.exercises
                });

                setMessages(prev => prev.map(m => {
                  if (m.id === item.id) {
                    return { ...m, text: m.text + '\n\n🚀 Workout berhasil dikirim ke Logger!', log: null };
                  }
                  return m;
                }));
                
                setModalVisible(false);
              }}
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: 8,
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                marginTop: 10
              }}
            >
              <AppText weight="bold" style={{ color: '#000000', fontSize: 11 }}>Kirim ke Logger 🏋️</AppText>
            </TouchableOpacity>
          )}
        </View>
      );
    };

    return (
      <Animated.View style={{ flexDirection: isUser ? 'row-reverse' : 'row', marginBottom: 20, alignItems: 'flex-end' }}>
        {isUser ? (
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', marginHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border }}>
            <User color={theme.colors.text} size={18} />
          </View>
        ) : (
          <View style={{ marginHorizontal: 12 }}>
            <AICoachLogo size={36} />
          </View>
        )}
        <View style={{ 
          maxWidth: '75%', 
          backgroundColor: isUser ? theme.colors.primary : theme.colors.card, 
          paddingVertical: 12, 
          paddingHorizontal: 16, 
          borderRadius: 20, 
          borderBottomRightRadius: isUser ? 4 : 20, 
          borderBottomLeftRadius: isUser ? 20 : 4, 
          borderWidth: isUser ? 0 : 1, 
          borderColor: theme.colors.border,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
        }}>
          {textBlocks.map((block, index) => (
            <AppText key={index} weight={isUser ? "bold" : "normal"} style={{ 
              color: isUser ? '#000' : theme.colors.text, 
              fontSize: 15, 
              lineHeight: 24,
              marginBottom: index === textBlocks.length - 1 ? 0 : 8
            }}>
              {block.replace(/\*\*/g, '')} 
            </AppText>
          ))}
          {!isUser && renderLogCard()}
        </View>
      </Animated.View>
    );
  };

  const renderListFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={{ flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' }}>
        <View style={{ marginHorizontal: 12 }}>
          <AICoachLogo size={36} />
        </View>
        <View style={{ 
          maxWidth: '75%', 
          backgroundColor: theme.colors.card, 
          paddingVertical: 12, 
          paddingHorizontal: 16, 
          borderRadius: 20, 
          borderBottomLeftRadius: 4, 
          borderWidth: 1, 
          borderColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
        }}>
          <ActivityIndicator color={theme.colors.primary} size="small" />
          <AppText style={{ color: theme.colors.textMuted, fontSize: 13 }}>{loadingText}</AppText>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Floating Bubble */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: theme.colors.card,
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 8,
          zIndex: 100
        }}
        onPress={() => setModalVisible(true)}
      >
        <AICoachLogo size={42} />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: theme.colors.background, height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }}>
              
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <AICoachLogo size={40} />
                  <View>
                    <AppText weight="bold" style={{ fontSize: 20, color: theme.colors.text }}>AI Coach</AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary }} />
                      <AppText style={{ color: theme.colors.primary, fontSize: 13, fontWeight: 'bold' }}>Online & Ready</AppText>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 8 }}>
                  <X color={theme.colors.text} size={28} />
                </TouchableOpacity>
              </View>

              <FlashList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                ListFooterComponent={renderListFooter}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                estimatedItemSize={100}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />

              {/* Suggestion Quick Buttons */}
              <View style={{ paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
                  {SUGGESTIONS.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => sendMessage(item.text)}
                      disabled={isLoading}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 16,
                        backgroundColor: theme.colors.card,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <AppText style={{ color: theme.colors.text, fontSize: 13, fontFamily: 'Inter_500Medium' }}>{item.label}</AppText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Input Area */}
              <View style={{ flexDirection: 'row', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center' }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: theme.colors.inputBg, color: theme.colors.text, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border, fontFamily: 'Inter_500Medium', fontSize: 15, maxHeight: 120 }}
                  placeholder="Tanya soal gym atau nutrisi..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />
                <TouchableOpacity 
                  disabled={!inputText.trim() || isLoading}
                  onPress={() => sendMessage()}
                  style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', marginLeft: 12, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: inputText.trim() ? 0.3 : 0, shadowRadius: 4, elevation: 4 }}
                >
                  {isLoading ? <ActivityIndicator color="#000" size="small" /> : <Send color={inputText.trim() ? "#000" : theme.colors.textMuted} size={22} style={{ marginLeft: -2 }} />}
                </TouchableOpacity>
              </View>
              
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}
