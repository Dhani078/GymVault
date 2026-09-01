import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Pressable, Image, ImageBackground, ActivityIndicator, Alert, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Plus, Minus, Check, ChevronLeft, ChevronRight, Clock, Trophy, Trash2, Dumbbell, AlertCircle, Save, X, Volume2, VolumeX, Mic, MicOff } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { AppText, theme, styles } from '../theme';
import { supabase, safeInsert, safeBatchInsert } from '../supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { useDynamicIsland } from '../contexts/DynamicIslandContext';
import { useTheme } from '../contexts/ThemeContext';
import SmoothScrollView from '../components/SmoothScrollView';
import DummyAdBanner from '../components/DummyAdBanner';
import useInterstitialAd from '../components/DummyInterstitialAd';

import * as Crypto from 'expo-crypto';
import { makeId } from '../utils/makeId';
import { getVolumeComparison } from '../utils/volumeComparison';
import { calculateProgressiveOverload, calculateRecommendedRestTime, getBiomechanicalCue, parseVoiceWorkoutCommand } from '../utils/fitnessMath';




export default function LoggerScreen({
  session, dbReady, workoutData, setWorkoutData, currentIndex, setCurrentIndex,
  workoutStartTime, onFinish, onGoToLibrary,
}) {
  const { t, language } = useTranslation();
  const { showNotification } = useDynamicIsland();
  const { proMode } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [plateTarget, setPlateTarget] = useState('100');

  // Rest Timer & PR
  const [restTime, setRestTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionMax1RM, setSessionMax1RM] = useState({});

  // Share Modal & Ads
  const [showShareModal, setShowShareModal] = useState(false);
  const { isLoaded: isInterstitialLoaded, showAd: showInterstitialAd } = useInterstitialAd();
  const viewShotRef = useRef();

  // Live Duration Stopwatch
  const [sessionDuration, setSessionDuration] = useState(0);

  // Voice Assistant State
  const [voiceGuideEnabled, setVoiceGuideEnabled] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micStatusMsg, setMicStatusMsg] = useState('');
  const recognitionRef = useRef(null);

  const [voiceMap, setVoiceMap] = useState({});

  const startListening = async () => {
    setMicStatusMsg('Memulai mikrofon...');
    if (Platform.OS === 'web') {
      const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (!SpeechRecognition) {
        setMicStatusMsg('Browser tidak mendukung Speech API.');
        Alert.alert("Browser Belum Mendukung Mic Otomatis", "Silakan gunakan Google Chrome / Microsoft Edge atau ketik perintah di kolom bawah.");
        return;
      }

      try {
        // Request browser microphone permission explicitly if available
        if (navigator?.mediaDevices?.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (permErr) {

          }
        }

        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch(e){}
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setMicStatusMsg('🔴 Mendengarkan suara Anda...');
        };

        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setVoiceInputText(currentTranscript);
          setMicStatusMsg(`Mendengar: "${currentTranscript}"`);

          if (event.results[0] && event.results[0].isFinal) {
            setIsListening(false);
            setMicStatusMsg('Memproses perintah...');
            setTimeout(() => {
              handleProcessVoiceCommand(currentTranscript);
            }, 300);
          }
        };

        recognition.onerror = (e) => {

          setIsListening(false);
          if (e.error === 'not-allowed') {
            setMicStatusMsg('Izin mikrofon ditolak. Izinkan mic di browser.');
          } else if (e.error === 'no-speech') {
            setMicStatusMsg('Tidak ada suara terdeteksi. Silakan coba lagi.');
          } else {
            setMicStatusMsg('Gagal mendengarkan: ' + (e.error || 'error'));
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {

        setIsListening(false);
        setMicStatusMsg('Gagal mengaktifkan mikrofon.');
      }
    } else {
      setIsListening(true);
      setMicStatusMsg('🔴 Mendengarkan...');
      setTimeout(() => {
        setIsListening(false);
        setMicStatusMsg('');
      }, 4000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e){}
    }
    setIsListening(false);
    setMicStatusMsg('');
  };

  const handleProcessVoiceCommand = (rawText) => {
    const textToParse = rawText || voiceInputText;
    const parsed = parseVoiceWorkoutCommand(textToParse);
    if (!parsed.success) {
      Alert.alert("Perintah Suara Belum Jelas ⚠️", parsed.message || 'Contoh: "Coach, catat 80 kilo 8 repetisi"');
      return;
    }

    const safeIdx = currentIndex < workoutData.length ? currentIndex : 0;
    const curEx = workoutData[safeIdx];
    if (!curEx) return;

    const nextUncompletedIdx = curEx.sets.findIndex(s => !s.completed);
    const targetSetIdx = nextUncompletedIdx >= 0 ? nextUncompletedIdx : curEx.sets.length - 1;

    setWorkoutData(prev => prev.map((ex, i) => {
      if (i !== safeIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, sIdx) => {
          if (sIdx === targetSetIdx) {
            return {
              ...s,
              kg: String(parsed.weightKg),
              reps: String(parsed.reps),
              completed: true
            };
          }
          return s;
        })
      };
    }));

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    // Auto-trigger dynamic rest time
    const recRest = calculateRecommendedRestTime(curEx.name, parsed.weightKg, parsed.reps, 8);
    setRestTime(recRest);
    setTimerActive(true);

    showNotification({
      type: 'fire',
      title: '🎙️ Set Dicatat via Suara!',
      subtitle: `${curEx.name} Set ${targetSetIdx + 1}: ${parsed.weightKg}kg × ${parsed.reps} reps`,
      duration: 3000
    });

    speakText(
      `Set ${targetSetIdx + 1} dicatat, ${parsed.weightKg} kilogram ${parsed.reps} repetisi. Istirahat ${recRest} detik dimulai!`,
      `Set ${targetSetIdx + 1} logged, ${parsed.weightKg} kg ${parsed.reps} reps. Rest timer started!`
    );

    setVoiceInputText('');
    setVoiceModalVisible(false);
  };

  useEffect(() => {
    const loadVoiceSetting = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const val = await AsyncStorage.getItem('voice_guide_enabled');
        if (val !== null) {
          setVoiceGuideEnabled(val === 'true');
        }

        // Preload High Quality Voices
        const voices = await Speech.getAvailableVoicesAsync();
        
        // Find best Indonesian Voice (Prefer Network/Cloud, then Enhanced, then Default)
        let bestId = voices.find(v => v.language.toLowerCase().includes('id') && (v.name.toLowerCase().includes('network') || v.name.toLowerCase().includes('siri'))) 
                  || voices.find(v => v.language.toLowerCase().includes('id') && v.quality === 'Enhanced') 
                  || voices.find(v => v.language.toLowerCase().includes('id'));
                  
        // Find best English Voice
        let bestEn = voices.find(v => v.language.toLowerCase().includes('en') && (v.name.toLowerCase().includes('network') || v.name.toLowerCase().includes('siri') || v.name.toLowerCase().includes('premium'))) 
                  || voices.find(v => v.language.toLowerCase().includes('en') && v.quality === 'Enhanced') 
                  || voices.find(v => v.language.toLowerCase().includes('en'));
                  
        setVoiceMap({ id: bestId?.identifier, en: bestEn?.identifier });
      } catch (e) {}
    };
    loadVoiceSetting();
  }, []);

  const audioRef = useRef(null);

  const playAudioFromBase64 = async (base64Data, mimeType) => {
    try {
      // Stop any previous audio
      if (audioRef.current) {
        try { audioRef.current.pause(); audioRef.current = null; } catch(_){}
      }

      if (Platform.OS === 'web') {
        // Web: Use browser Audio API directly — most reliable
        const audioUrl = `data:${mimeType};base64,${base64Data}`;
        const audio = new window.Audio(audioUrl);
        audioRef.current = audio;
        await audio.play();
      } else {
        // Native (iOS/Android): Write to temp file, then use expo-av
        const fileUri = FileSystem.cacheDirectory + 'gymvault_tts_' + Date.now() + '.wav';
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const { Audio } = require('expo-av');
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: fileUri });
        audioRef.current = newSound;
        await newSound.playAsync();
      }
      return true;
    } catch (e) {

      return false;
    }
  };

  const speakText = async (textId, textEn) => {
    if (!voiceGuideEnabled) return;
    const isId = language === 'id';
    const finalMsg = isId ? textId : textEn;
    
    // Use Gemini TTS for Ultra-Realistic Human Voice
    const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (geminiKey && geminiKey.length > 20) {
      try {
        // Try dedicated TTS model first, then general model
        const modelsToTry = [
          'gemini-2.5-flash-preview-tts',
          'gemini-2.5-flash',
        ];

        for (const modelName of modelsToTry) {
          try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: finalMsg }] }],
                generationConfig: {
                  response_modalities: ["AUDIO"],
                  speech_config: {
                    voice_config: {
                      prebuilt_voice_config: {
                        voice_name: "Kore"
                      }
                    }
                  }
                }
              }),
            });

            if (!response.ok) {
              const errText = await response.text();

              continue;
            }

            const data = await response.json();
            const audioPart = data?.candidates?.[0]?.content?.parts?.find(
              p => p.inlineData && p.inlineData.mimeType && p.inlineData.mimeType.startsWith('audio/')
            );

            if (audioPart) {
              const played = await playAudioFromBase64(audioPart.inlineData.data, audioPart.inlineData.mimeType);
              if (played) {

                return;
              }
            } else {

            }
          } catch (modelErr) {

            continue;
          }
        }
        

      } catch (e) {

      }
    }

    // Fallback: Standard Phone TTS
    try {
      const voiceId = isId ? voiceMap.id : voiceMap.en;
      Speech.stop();
      Speech.speak(finalMsg, {
        language: isId ? 'id-ID' : 'en-US',
        voice: voiceId,
        pitch: 1.0, 
        rate: 1.0,  
      });
    } catch (_) {}
  };

  const toggleVoiceGuide = async () => {
    try {
      const nextVal = !voiceGuideEnabled;
      setVoiceGuideEnabled(nextVal);
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('voice_guide_enabled', String(nextVal));
      
      if (nextVal) {
        Speech.stop();
        Speech.speak(t('toast_audio_guide_enabled_'), {
          language: language === 'id' ? 'id-ID' : 'en-US',
          pitch: 1.0,
          rate: 0.95
        });
      } else {
        Speech.stop();
      }
    } catch(e){}
  };

  // Speak when workout first starts
  const startedGreetedRef = useRef(false);
  useEffect(() => {
    if (workoutStartTime && !startedGreetedRef.current && voiceGuideEnabled && workoutData && workoutData.length > 0) {
      const initialEx = workoutData[0]?.name || '';
      speakText(
        `Latihan dimulai. Semangat untuk hari ini! Mulai dengan ${initialEx}.`,
        `Workout started. Let's do this! Begin with ${initialEx}.`
      );
      startedGreetedRef.current = true;
    }
  }, [workoutStartTime, voiceGuideEnabled, workoutData]);

  // Speak when active exercise changes
  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (workoutData && workoutData.length > 0 && prevIndexRef.current !== currentIndex && voiceGuideEnabled) {
      const currentEx = workoutData[currentIndex];
      if (currentEx) {
        speakText(
          `Latihan berikutnya: ${currentEx.name}. Terdiri dari ${currentEx.sets.length} set.`,
          `Next exercise: ${currentEx.name}. Consists of ${currentEx.sets.length} sets.`
        );
      }
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex, workoutData, voiceGuideEnabled]);

  // Speak when rest timer ends
  const prevTimerActiveRef = useRef(false);
  useEffect(() => {
    if (prevTimerActiveRef.current && !timerActive && restTime === 0 && voiceGuideEnabled) {
      speakText(
        "Waktu istirahat habis. Bersiap untuk set berikutnya!",
        "Rest time is over. Get ready for your next set!"
      );
    }
    prevTimerActiveRef.current = timerActive;
  }, [timerActive, restTime, voiceGuideEnabled]);

  const updateSetValueText = (setId, field, text) => {
    setWorkoutData(prev => prev.map((ex, i) => {
      if (i !== currentIndex) return ex;
      return { ...ex, sets: ex.sets.map(s => {
        if (s.id !== setId) return s;
        return { ...s, [field]: text };
      })};
    }));
  };

  const toggleSetType = (setId, currentType) => {
    const types = ['N', 'W', 'D', 'F']; // Normal, Warmup, Drop, Failure
    const nextType = types[(types.indexOf(currentType || 'N') + 1) % types.length];
    setWorkoutData(prev => prev.map((ex, i) => {
      if (i !== currentIndex) return ex;
      return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, type: nextType } : s) };
    }));
  };

  useEffect(() => {
    if (!workoutStartTime) return;
    const update = () => {
      const ms = Date.now() - new Date(workoutStartTime).getTime();
      setSessionDuration(Math.max(0, Math.floor(ms / 1000)));
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [workoutStartTime]);

  const fmtDuration = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let iv;
    if (timerActive && restTime > 0) {
      iv = setInterval(() => setRestTime(p => p - 1), 1000);
    } else if (restTime === 0) setTimerActive(false);
    return () => clearInterval(iv);
  }, [timerActive, restTime]);

  useEffect(() => {
    try {
      const LiveActivityManager = require('../services/LiveActivityManager').default;
      if (timerActive && restTime > 0) {
        const currentExName = workoutData[currentIndex]?.name || '';
        LiveActivityManager.startRestTimer({
          restTimeSeconds: restTime,
          exerciseName: currentExName
        });
      } else if (!timerActive && workoutStartTime) {
        const currentExName = workoutData[currentIndex]?.name || '';
        LiveActivityManager.startWorkoutActivity({
          startTime: workoutStartTime,
          exerciseName: currentExName
        });
      }
    } catch (err) {

    }
  }, [timerActive, workoutStartTime, currentIndex]);

  // Subscribe to action buttons clicked in the notification (Ongoing Activity)
  useEffect(() => {
    try {
      const LiveActivityManager = require('../services/LiveActivityManager').default;
      const unsubscribe = LiveActivityManager.subscribe((actionId) => {
        if (actionId === 'add_30s') {
          setRestTime(p => p + 30);
          setTimerActive(true);
        } else if (actionId === 'skip_rest') {
          setRestTime(0);
          setTimerActive(false);
        }
      });
      return () => unsubscribe();
    } catch (e) {

    }
  }, []);

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── CRUD ───

  const toggleSet = (setId) => {
    setWorkoutData(prev => prev.map((ex, i) => {
      if (i !== currentIndex) return ex;
      return { ...ex, sets: ex.sets.map(s => {
        if (s.id !== setId) return s;
        if (!s.completed) {
          const exName = workoutData[currentIndex]?.name || '';
          const optimalRest = calculateRecommendedRestTime(exName, s.kg, s.reps, s.rpe);
          setRestTime(optimalRest); 
          setTimerActive(true);
          Notifications.cancelAllScheduledNotificationsAsync().then(() => {
            Notifications.scheduleNotificationAsync({
              content: { title: "Rest is Over! 🏋️‍♂️", body: "Time for your next set. Let's get it!", sound: true },
              trigger: { seconds: optimalRest },
            });
          });
          
          const estimated1RM = Math.round(Number(s.kg) * (1 + Number(s.reps) / 30));
          let title = 'Set Complete! ✅';
          let subtitle = `${s.kg}kg × ${s.reps} reps · Istirahat ${optimalRest}s`;
          
          if (estimated1RM > (sessionMax1RM[exName] || 0) && estimated1RM > 0) {
            setSessionMax1RM(prev => ({ ...prev, [exName]: estimated1RM }));
            title = 'NEW PR! 🏆';
            subtitle = `Est. 1RM: ${estimated1RM}kg`;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showNotification({ type: 'fire', title, subtitle, duration: 3000 });
            speakText(
              `Luar biasa! Rekor pribadi baru untuk ${exName}, perkiraan satu repetisi maksimum ${estimated1RM} kilogram. Mulai istirahat.`,
              `Awesome! New personal record for ${exName}, estimated one rep max ${estimated1RM} kilograms. Starting rest.`
            );
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            showNotification({ type: 'success', title, subtitle, duration: 2500 });
            
            const currentEx = workoutData[currentIndex];
            const completedCount = currentEx.sets.filter(set => set.id === s.id ? true : set.completed).length;
            const totalCount = currentEx.sets.length;
            
            if (completedCount === totalCount) {
              speakText(
                `Semua set selesai untuk ${currentEx.name}. Kerja bagus!`,
                `All sets completed for ${currentEx.name}. Great job!`
              );
            } else {
              speakText(
                `Set ${completedCount} selesai. Mulai istirahat.`,
                `Set ${completedCount} completed. Starting rest.`
              );
            }
          }
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return { ...s, completed: !s.completed };
      })};
    }));
  };

  const adjust = (setId, field, amt) => {
    setWorkoutData(prev => prev.map((ex, i) => {
      if (i !== currentIndex) return ex;
      return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: Math.max(0, (Number(s[field]) || 0) + amt) } : s) };
    }));
  };

  const addSet = () => {
    setWorkoutData(prev => prev.map((ex, i) => {
      if (i !== currentIndex) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, { id: makeId(), kg: last?.kg || 0, reps: last?.reps || 0, completed: false }] };
    }));
  };

  const removeSet = (setId) => {
    setWorkoutData(prev => prev.map((ex, i) => {
      if (i !== currentIndex) return ex;
      if (ex.sets.length <= 1) return ex; // Keep at least 1 set
      return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
    }));
  };

  const removeExercise = () => {
    const name = workoutData[currentIndex]?.name || 'Exercise';
    const newData = workoutData.filter((_, i) => i !== currentIndex);
    setWorkoutData(newData);
    if (currentIndex >= newData.length && currentIndex > 0) {
      setCurrentIndex(newData.length - 1);
    } else if (currentIndex > 0) {
      // If we deleted the current index, the next one shifts left, so we should stay at the same index,
      // but ensure it's not out of bounds. The line above handles the out of bounds, so we're good.
    }
    
    showNotification({ 
      type: 'success', 
      title: 'Dihapus', 
      subtitle: `${name} dihapus dari latihan`, 
      duration: 2000 
    });
  };

  // ─── FINISH WORKOUT ───
  const handleFinish = async () => {
    if (!session?.user) { setSaveError('You must be logged in.'); return; }
    if (workoutData.length === 0) { setSaveError('No exercises.'); return; }

    let completedCount = 0;
    workoutData.forEach(ex => ex.sets.forEach(s => { if (s.completed) completedCount++; }));
    if (completedCount === 0) { setSaveError('Complete at least one set first.'); return; }

    setSaving(true);
    setSaveError(null);

    try {
      const sessionPayload = {
        user_id: session.user.id,
        started_at: workoutStartTime || new Date().toISOString(),
        is_completed: true,
        split_name: workoutData.map(e => e.name + (e.muscle_group ? ` [${e.muscle_group}]` : '')).join(', '),
      };

      const { data: sessionData, error: sessionErr } = await safeInsert('workout_sessions', sessionPayload);

      if (sessionErr || !sessionData) {
        const msg = sessionErr?.message || 'Failed to save.';
        
        // 📡 OFFLINE MODE SYNC
        if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('Failed to fetch')) {
           const AsyncStorage = require('@react-native-async-storage/async-storage').default;
           const queueStr = await AsyncStorage.getItem(`offline_workouts_${session.user.id}`);
           const queue = queueStr ? JSON.parse(queueStr) : [];
           queue.push({ sessionPayload, workoutData });
           await AsyncStorage.setItem(`offline_workouts_${session.user.id}`, JSON.stringify(queue));
           
           setSaving(false);
           showNotification({ type: 'success', title: 'Saved Offline 📡', subtitle: 'Will sync when connection returns.', duration: 4000 });
           
           let totalVolume = 0;
           workoutData.forEach(ex => ex.sets.forEach(s => {
             if (s.completed) totalVolume += (Number(s.kg) * Number(s.reps));
           }));
           speakText(
             `Latihan disimpan secara offline! Total volume latihan Anda adalah ${totalVolume} kilogram. Kerja luar biasa!`,
             `Workout saved offline! Your total training volume is ${totalVolume} kilograms. Amazing work!`
           );
           
           setShowShareModal(true);
           return;
        }

        if (msg.includes('does not exist')) setSaveError('Database not set up. Run setup_database.sql first.');
        else if (msg.includes('policy')) setSaveError('Permission denied. Check RLS policies.');
        else setSaveError(`Save failed: ${msg}`);
        setSaving(false);
        return;
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const setRows = [];
      workoutData.forEach((ex) => {
        const validExId = (ex.id && uuidRegex.test(ex.id)) ? ex.id : null;
        ex.sets.forEach((s, setIdx) => {
          if (s.completed) {
            setRows.push({ session_id: sessionData.id, exercise_id: validExId, weight_kg: s.kg, reps: s.reps, set_index: setIdx + 1, is_checked: true });
          }
        });
      });

      if (setRows.length > 0) {
        const { error: setsErr } = await safeBatchInsert('workout_sets', setRows);
        if (setsErr) console.warn('[Logger] Sets save partial failure:', setsErr.message);

        // Auto-save last weight & reps per exercise for zero-friction autofill
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          workoutData.forEach(ex => {
            const completedSets = ex.sets.filter(s => s.completed);
            const lastSet = completedSets[completedSets.length - 1] || ex.sets[ex.sets.length - 1];
            if (lastSet && (Number(lastSet.kg) > 0 || Number(lastSet.reps) > 0)) {
              const lastKey = `@gymvault_last_ex_${session?.user?.id || 'guest'}_${ex.name.toLowerCase().trim()}`;
              AsyncStorage.setItem(lastKey, JSON.stringify({ kg: lastSet.kg, reps: lastSet.reps }));
            }
          });
        } catch (e) {}
      }

      setSaving(false);
      showNotification({ type: 'fire', title: 'Workout Complete! 🔥', subtitle: `${workoutData.length} exercises · ${setRows.length} sets saved`, duration: 4000 });
      
      let totalVolume = 0;
      workoutData.forEach(ex => ex.sets.forEach(s => {
        if (s.completed) totalVolume += (Number(s.kg) * Number(s.reps));
      }));
      speakText(
        `Latihan selesai! Total volume latihan Anda adalah ${totalVolume} kilogram. Kerja luar biasa!`,
        `Workout complete! Your total training volume is ${totalVolume} kilograms. Amazing work!`
      );
      
      setShowShareModal(true);
    } catch (e) {

      setSaveError(`Error: ${e.message}`);
      setSaving(false);
    }
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim() || workoutData.length === 0) return;
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const existingStr = await AsyncStorage.getItem('customRoutines');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newRoutine = {
        id: Date.now().toString(),
        name: routineName.trim(),
        exercises: workoutData.map(ex => ({ name: ex.name, image: ex.image, numSets: ex.sets.length }))
      };
      const updatedRoutines = [...existing, newRoutine];
      await AsyncStorage.setItem('customRoutines', JSON.stringify(updatedRoutines));
      
      if (session?.user?.id && dbReady) {
        const { error } = await supabase
          .from('users_profile')
          .update({ custom_routines: updatedRoutines })
          .eq('id', session.user.id);
        if (error) console.warn("[Logger] Failed to sync routine to Supabase:", error.message);
      }

      setShowRoutineModal(false);
      setRoutineName('');
      showNotification({ type: 'success', title: 'Routine Saved!', subtitle: `"${newRoutine.name}" ready on Dashboard`, duration: 3000 });
    } catch (e) {

      Alert.alert("Error", "Failed to save routine.");
    }
  };

  // ─── EMPTY STATE ───
  if (workoutData.length === 0) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212,245,60,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <Dumbbell color={theme.colors.primary} size={36} />
        </View>
        <AppText weight="bold" style={{ fontSize: 22, marginBottom: 8 }}>Ready to Train?</AppText>
        <AppText style={{ color: theme.colors.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 22, fontSize: 14 }}>
          Pick exercises from the Library to build your session.
        </AppText>
        <Pressable style={[styles.btnPrimary, { width: '100%', flexDirection: 'row', gap: 8 }]} onPress={onGoToLibrary}>
          <Plus color={theme.colors.background} size={20} />
          <AppText weight="bold" style={styles.btnPrimaryText}>{t('add_exercise')}</AppText>
        </Pressable>
      </View>
    );
  }

  const safeIdx = Math.min(currentIndex, workoutData.length - 1);
  const curEx = workoutData[safeIdx];
  if (!curEx) return null;
  const activeSetIndex = curEx.sets.findIndex(s => !s.completed);

  let totalCompleted = 0, totalSets = 0;
  workoutData.forEach(ex => { totalSets += ex.sets.length; ex.sets.forEach(s => { if (s.completed) totalCompleted++; }); });
  const progress = totalSets > 0 ? totalCompleted / totalSets : 0;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      <SmoothScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

        {/* ═══ Compact Header ═══ */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" style={{ fontSize: 20 }}>{t('active_session')}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <AppText style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                {totalCompleted}/{totalSets} sets
              </AppText>
              <AppText style={{ color: theme.colors.border, fontSize: 12 }}>•</AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.inputBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border }}>
                <Clock color={theme.colors.primary} size={11} />
                <AppText weight="bold" tabular style={{ fontSize: 11, color: theme.colors.primary }}>{fmtDuration(sessionDuration)}</AppText>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable 
              onPress={() => setVoiceModalVisible(true)}
              style={{ 
                backgroundColor: 'rgba(56, 189, 248, 0.1)', 
                width: 36, 
                height: 36, 
                borderRadius: 10, 
                justifyContent: 'center', 
                alignItems: 'center', 
                marginRight: 8,
                borderWidth: 1,
                borderColor: 'rgba(56, 189, 248, 0.4)'
              }}
            >
              <Mic color="#38BDF8" size={18} />
            </Pressable>
            <Pressable 
              onPress={toggleVoiceGuide}
              style={{ 
                backgroundColor: voiceGuideEnabled ? 'rgba(204, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
                width: 36, 
                height: 36, 
                borderRadius: 10, 
                justifyContent: 'center', 
                alignItems: 'center', 
                marginRight: 8,
                borderWidth: 1,
                borderColor: voiceGuideEnabled ? 'rgba(204, 255, 0, 0.3)' : theme.colors.border
              }}
            >
              {voiceGuideEnabled ? (
                <Volume2 color={theme.colors.primary} size={18} />
              ) : (
                <VolumeX color={theme.colors.textMuted} size={18} />
              )}
            </Pressable>
            <Pressable style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', gap: 4, alignItems: 'center' }} onPress={onGoToLibrary}>
              <Plus color={theme.colors.background} size={16} />
              <AppText weight="bold" style={{ color: theme.colors.background, fontSize: 13 }}>Add</AppText>
            </Pressable>
          </View>
        </View>

        {/* ═══ Progress Bar ═══ */}
        <View style={{ height: 6, backgroundColor: theme.colors.inputBg, borderRadius: 3, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }}>
          <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: theme.colors.primary, borderRadius: 3 }} />
        </View>

        {/* ═══ Exercise Tabs (Horizontal Scroll) ═══ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginHorizontal: -20, paddingHorizontal: 20 }}>
          {workoutData.map((ex, i) => {
            const done = ex.sets.filter(s => s.completed).length;
            const total = ex.sets.length;
            const isActive = i === safeIdx;
            const allDone = done === total && total > 0;
            return (
              <Pressable key={ex.id} onPress={() => setCurrentIndex(i)} style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 8,
                backgroundColor: isActive ? 'rgba(212,245,60,0.06)' : allDone ? 'rgba(16,185,129,0.05)' : theme.colors.card,
                borderWidth: 1,
                borderColor: isActive ? theme.colors.primary : allDone ? 'rgba(16,185,129,0.25)' : theme.colors.border,
              }}>
                <View style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: isActive ? theme.colors.primary : allDone ? '#10B981' : theme.colors.textMuted
                }} />
                <AppText weight={isActive ? 'bold' : 'medium'} style={{
                  fontSize: 12,
                  color: isActive ? theme.colors.text : allDone ? '#10B981' : theme.colors.textMuted,
                }}>
                  {ex.name.length > 14 ? ex.name.slice(0, 14) + '…' : ex.name}
                </AppText>
                {total > 0 && (
                  <View style={{
                    backgroundColor: isActive ? 'rgba(212,245,60,0.12)' : allDone ? 'rgba(16,185,129,0.1)' : theme.colors.inputBg,
                    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, marginLeft: 2
                  }}>
                    <AppText weight="bold" style={{ fontSize: 9, color: isActive ? theme.colors.primary : allDone ? '#10B981' : theme.colors.textMuted }}>
                      {done}/{total}
                    </AppText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ═══ Exercise Card (Compact) ═══ */}
        <View style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }}>
          <ImageBackground source={{ uri: curEx.image }} style={{ width: '100%', height: 110, justifyContent: 'flex-end' }} imageStyle={{ opacity: 0.65 }} resizeMode="cover">
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', padding: 12, backgroundColor: 'rgba(0,0,0,0.75)' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AppText weight="bold" style={{ fontSize: 16, color: '#FFF' }}>{curEx.name}</AppText>
                  {proMode && (
                    <Pressable onPress={() => setShowPlateModal(true)} style={{ backgroundColor: 'rgba(212,245,60,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#D4F53C', zIndex: 10 }}>
                      <AppText weight="bold" style={{ color: '#D4F53C', fontSize: 10 }}>PLATES</AppText>
                    </Pressable>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                  <AppText style={{ fontSize: 11, color: '#AAA' }}>{curEx.sets.length} sets · {curEx.sets.filter(s => s.completed).length} done</AppText>
                  {(() => {
                    const bio = getBiomechanicalCue(curEx.name);
                    return (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <AppText weight="bold" style={{ color: '#D4F53C', fontSize: 9 }}>TEMPO {bio.tempo}</AppText>
                      </View>
                    );
                  })()}
                </View>
              </View>
              <Pressable onPress={removeExercise} hitSlop={15} style={{ padding: 6, zIndex: 10 }}>
                <Trash2 color="#EF4444" size={16} />
              </Pressable>
            </View>
          </ImageBackground>
        </View>

        {/* ═══ AI Smart Progressive Overload Card ═══ */}
        {(() => {
          const activeSet = curEx.sets.find(s => !s.completed) || curEx.sets[0];
          const overloadRec = calculateProgressiveOverload(curEx.name, curEx.sets, activeSet?.kg, activeSet?.reps, 65, activeSet?.rpe);
          if (!overloadRec || overloadRec.hasData === false) return null;

          const isBackoff = !!overloadRec.isBackoffSet;

          return (
            <View style={{
              backgroundColor: isBackoff ? 'rgba(245, 158, 11, 0.06)' : 'rgba(204, 255, 0, 0.04)',
              borderWidth: 1,
              borderColor: isBackoff ? 'rgba(245, 158, 11, 0.3)' : 'rgba(204, 255, 0, 0.2)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <View style={{ 
                    backgroundColor: isBackoff ? '#F59E0B' : '#D4F53C', 
                    paddingHorizontal: 6, 
                    paddingVertical: 2, 
                    borderRadius: 4 
                  }}>
                    <AppText weight="bold" style={{ color: '#000', fontSize: 9 }}>
                      {isBackoff ? 'BACK-OFF SET' : 'AI TARGET'}
                    </AppText>
                  </View>
                  <AppText weight="bold" style={{ color: isBackoff ? '#F59E0B' : '#D4F53C', fontSize: 13 }}>
                    {overloadRec.recommendedWeightKg} kg × {overloadRec.recommendedReps} reps
                  </AppText>
                </View>
                <AppText style={{ color: '#94A3B8', fontSize: 11, lineHeight: 15 }}>
                  {overloadRec.rationale}
                </AppText>
              </View>
              <Pressable
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch (e) {}
                  setWorkoutData(prev => prev.map((ex, i) => {
                    if (i !== safeIdx) return ex;
                    const nextUncompletedIdx = ex.sets.findIndex(s => !s.completed);
                    const targetIdx = nextUncompletedIdx >= 0 ? nextUncompletedIdx : 0;
                    return {
                      ...ex,
                      sets: ex.sets.map((s, sIdx) => {
                        if (sIdx === targetIdx) {
                          return {
                            ...s,
                            kg: String(overloadRec.recommendedWeightKg),
                            reps: String(overloadRec.recommendedReps)
                          };
                        }
                        return s;
                      })
                    };
                  }));
                  showNotification({
                    type: 'fire',
                    title: 'Target AI Terpasang! 🎯',
                    subtitle: `${overloadRec.recommendedWeightKg}kg × ${overloadRec.recommendedReps} reps siap dieksekusi`,
                    duration: 3000
                  });
                }}
                style={{
                  backgroundColor: isBackoff ? '#F59E0B' : '#D4F53C',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText weight="bold" style={{ color: '#000', fontSize: 11 }}>
                  Pasang Target
                </AppText>
              </Pressable>
            </View>
          );
        })()}

        {/* ═══ Quick Increment Chips (Fat Finger Friendly) ═══ */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginRight: 2 }}>Quick +KG:</AppText>
          {[1.25, 2.5, 5, 10].map(amt => (
            <Pressable
              key={amt}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const activeSet = curEx.sets[activeSetIndex] || curEx.sets[0];
                if (activeSet) adjust(activeSet.id, 'kg', amt);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: pressed ? 'rgba(212,245,60,0.2)' : 'rgba(212,245,60,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(212,245,60,0.25)',
              })}
            >
              <AppText weight="bold" style={{ fontSize: 11, color: theme.colors.primary }}>+{amt}kg</AppText>
            </Pressable>
          ))}
          <View style={{ flex: 1 }} />
          {[1, 2].map(amt => (
            <Pressable
              key={amt}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const activeSet = curEx.sets[activeSetIndex] || curEx.sets[0];
                if (activeSet) adjust(activeSet.id, 'reps', amt);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: pressed ? 'rgba(255,255,255,0.1)' : theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.border,
              })}
            >
              <AppText weight="bold" style={{ fontSize: 11, color: theme.colors.text }}>+{amt} rep</AppText>
            </Pressable>
          ))}
        </View>

        {/* ═══ Sets ═══ */}
        <View style={{ gap: 8 }}>
          {/* Table Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, marginBottom: 2 }}>
            <View style={{ width: 28, alignItems: 'center' }}>
              <AppText weight="bold" style={{ fontSize: 10, color: theme.colors.textMuted }}>SET</AppText>
            </View>
            <View style={{ flex: 1.1, alignItems: 'center' }}>
              <AppText weight="bold" style={{ fontSize: 10, color: theme.colors.textMuted }}>WEIGHT (KG)</AppText>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <AppText weight="bold" style={{ fontSize: 10, color: theme.colors.textMuted }}>REPS</AppText>
            </View>
            {proMode && (
              <View style={{ width: 44, alignItems: 'center' }}>
                <AppText weight="bold" style={{ fontSize: 10, color: theme.colors.textMuted }}>RPE</AppText>
              </View>
            )}
            <View style={{ width: 36, alignItems: 'center' }}>
              <AppText weight="bold" style={{ fontSize: 10, color: theme.colors.textMuted }}>DONE</AppText>
            </View>
            {curEx.sets.length > 1 && <View style={{ width: 20 }} />}
          </View>

          {curEx.sets.map((set, index) => {
            const isCurrentlyActive = index === activeSetIndex;
            return (
              <View key={set.id} style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                padding: 10, borderRadius: 12,
                backgroundColor: set.completed ? 'rgba(16,185,129,0.08)' : isCurrentlyActive ? 'rgba(212,245,60,0.04)' : theme.colors.card,
                borderWidth: 1,
                borderColor: set.completed ? 'rgba(16,185,129,0.2)' : isCurrentlyActive ? theme.colors.primary : theme.colors.border,
              }}>
                {/* Set Number */}
                <View style={{ width: 28, alignItems: 'center' }}>
                  {proMode ? (
                    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleSetType(set.id, set.type); }} style={{width: 24, height: 24, borderRadius: 12, backgroundColor: set.type === 'W' ? '#F59E0B' : set.type === 'D' ? '#EF4444' : set.type === 'F' ? '#8B5CF6' : 'transparent', justifyContent: 'center', alignItems: 'center'}}>
                      <AppText weight="bold" style={{ fontSize: 13, color: (set.type && set.type !== 'N') ? '#FFF' : (set.completed ? '#10B981' : isCurrentlyActive ? theme.colors.primary : theme.colors.textMuted) }}>{set.type === 'W' ? 'W' : set.type === 'D' ? 'D' : set.type === 'F' ? 'F' : index + 1}</AppText>
                    </Pressable>
                  ) : (
                    <AppText weight="bold" style={{ fontSize: 13, color: set.completed ? '#10B981' : isCurrentlyActive ? theme.colors.primary : theme.colors.textMuted }}>{index + 1}</AppText>
                  )}
                </View>

                 {/* KG Stepper — 44px Big Tap Target */}
                <View style={{ flex: 1.1, minWidth: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.inputBg, borderRadius: 10, height: 44, borderWidth: 1, borderColor: isCurrentlyActive ? theme.colors.primary : theme.colors.border, overflow: 'hidden' }}>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); adjust(set.id, 'kg', -2.5); }}
                    style={({ pressed }) => ({
                      width: 36, height: '100%', justifyContent: 'center', alignItems: 'center',
                      backgroundColor: pressed ? theme.colors.border : 'transparent'
                    })}
                    hitSlop={6}
                  >
                    <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.textMuted }}>-</AppText>
                  </Pressable>
                  
                  <TextInput
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    style={{ flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 16, fontFamily: 'Inter_700Bold', textAlign: 'center', paddingVertical: 0, paddingHorizontal: 0, includeFontPadding: false }}
                    value={String(set.kg)}
                    onChangeText={(txt) => updateSetValueText(set.id, 'kg', txt)}
                  />

                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); adjust(set.id, 'kg', 2.5); }}
                    style={({ pressed }) => ({
                      width: 36, height: '100%', justifyContent: 'center', alignItems: 'center',
                      backgroundColor: pressed ? theme.colors.border : 'transparent'
                    })}
                    hitSlop={6}
                  >
                    <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.primary }}>+</AppText>
                  </Pressable>
                </View>

                {/* Reps Stepper — 44px Big Tap Target */}
                <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.inputBg, borderRadius: 10, height: 44, borderWidth: 1, borderColor: isCurrentlyActive ? theme.colors.primary : theme.colors.border, overflow: 'hidden' }}>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); adjust(set.id, 'reps', -1); }}
                    style={({ pressed }) => ({
                      width: 36, height: '100%', justifyContent: 'center', alignItems: 'center',
                      backgroundColor: pressed ? theme.colors.border : 'transparent'
                    })}
                    hitSlop={6}
                  >
                    <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.textMuted }}>-</AppText>
                  </Pressable>
                  
                  <TextInput
                    keyboardType="number-pad"
                    selectTextOnFocus
                    style={{ flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 16, fontFamily: 'Inter_700Bold', textAlign: 'center', paddingVertical: 0, paddingHorizontal: 0, includeFontPadding: false }}
                    value={String(set.reps)}
                    onChangeText={(txt) => updateSetValueText(set.id, 'reps', txt)}
                  />

                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); adjust(set.id, 'reps', 1); }}
                    style={({ pressed }) => ({
                      width: 36, height: '100%', justifyContent: 'center', alignItems: 'center',
                      backgroundColor: pressed ? theme.colors.border : 'transparent'
                    })}
                    hitSlop={6}
                  >
                    <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.primary }}>+</AppText>
                  </Pressable>
                </View>

                {/* RPE Column (Pro Mode) */}
                {proMode && (
                  <View style={{ width: 44, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', backgroundColor: theme.colors.inputBg, borderRadius: 10, height: 44, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' }}>
                    <TextInput
                      keyboardType="number-pad"
                      selectTextOnFocus
                      placeholder="10"
                      placeholderTextColor={theme.colors.textMuted}
                      style={{ flex: 1, color: theme.colors.text, fontSize: 15, fontFamily: 'Inter_700Bold', textAlign: 'center', padding: 0 }}
                      value={String(set.rpe || '')}
                      onChangeText={(txt) => {
                        let val = parseInt(txt) || '';
                        if (val > 10) val = 10;
                        updateSetValueText(set.id, 'rpe', val);
                      }}
                    />
                  </View>
                )}

                {/* Check Button — Big Tap Target */}
                <Pressable onPress={() => toggleSet(set.id)} style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: set.completed ? '#10B981' : 'transparent',
                  borderWidth: 1.5,
                  borderColor: set.completed ? '#10B981' : theme.colors.border,
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  <Check size={20} color={set.completed ? '#FFF' : theme.colors.textMuted} strokeWidth={3} />
                </Pressable>

                {/* Delete Set (swipe-like) */}
                {curEx.sets.length > 1 && (
                  <Pressable onPress={() => removeSet(set.id)} hitSlop={6} style={{ padding: 4 }}>
                    <X size={12} color={theme.colors.textMuted} />
                  </Pressable>
                )}
              </View>
            );
          })}

          {/* Add Set Button */}
          <Pressable onPress={addSet} style={{
            width: '100%',
            flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
            paddingVertical: 12, borderRadius: 10,
            borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed',
            marginTop: 12,
          }}>
            <Plus size={14} color={theme.colors.textMuted} />
            <AppText weight="medium" style={{ color: theme.colors.textMuted, fontSize: 13 }}>Add Set</AppText>
          </Pressable>
        </View>

        {/* ═══ Navigation ═══ */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <Pressable
            style={{ flex: 1, height: 44, borderRadius: 10, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', opacity: safeIdx === 0 ? 0.3 : 1 }}
            onPress={() => safeIdx > 0 && setCurrentIndex(safeIdx - 1)} disabled={safeIdx === 0}
          >
            <ChevronLeft color={theme.colors.textMuted} size={18} />
            <AppText weight="bold" style={{ color: theme.colors.textMuted, fontSize: 14 }}>Prev</AppText>
          </Pressable>
          <Pressable
            style={{ flex: 1, height: 44, borderRadius: 10, backgroundColor: theme.colors.primary, flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', opacity: safeIdx >= workoutData.length - 1 ? 0.3 : 1 }}
            onPress={() => safeIdx < workoutData.length - 1 && setCurrentIndex(safeIdx + 1)} disabled={safeIdx >= workoutData.length - 1}
          >
            <AppText weight="bold" style={{ color: theme.colors.background, fontSize: 14 }}>Next</AppText>
            <ChevronRight color={theme.colors.background} size={18} />
          </Pressable>
        </View>

        {/* ═══ Error ═══ */}
        {saveError && (
          <View style={{ marginTop: 16, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#EF4444', borderRadius: 10, padding: 14, flexDirection: 'row', gap: 10 }}>
            <AlertCircle color="#EF4444" size={18} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <AppText weight="bold" style={{ fontSize: 13, color: '#EF4444', marginBottom: 2 }}>Save Failed</AppText>
              <AppText style={{ fontSize: 12, color: theme.colors.textMuted, lineHeight: 18 }}>{saveError}</AppText>
            </View>
            <Pressable onPress={() => setSaveError(null)} style={{ padding: 4 }}><X color={theme.colors.textMuted} size={16} /></Pressable>
          </View>
        )}

        {/* ═══ Action Buttons ═══ */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
          <Pressable
            style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setShowRoutineModal(true)}
          >
            <Save color={theme.colors.textMuted} size={16} />
            <AppText weight="bold" style={{ color: theme.colors.textMuted, fontSize: 13 }}>Save Routine</AppText>
          </Pressable>

          <Pressable
            style={{ flex: 2, height: 48, borderRadius: 12, backgroundColor: '#10B981', flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', opacity: saving ? 0.6 : 1 }}
            onPress={handleFinish} disabled={saving}
          >
            {saving ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Trophy color="#FFF" size={18} />
                <AppText weight="bold" style={{ color: '#FFF', fontSize: 15 }}>{t('finish_workout')} ({totalCompleted})</AppText>
              </>
            )}
          </Pressable>
        </View>

        {/* DB Warning */}
        {!dbReady && (
          <View style={{ marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: '#F59E0B' }}>
            <AppText style={{ fontSize: 11, color: '#F59E0B', textAlign: 'center' }}>⚠️ Database not detected. Run setup_database.sql first.</AppText>
          </View>
        )}
      </SmoothScrollView>

      {/* ═══ Rest Timer (Floating) ═══ */}
      {timerActive && restTime > 0 && (
        <View style={{
          position: 'absolute', bottom: 20, left: 20, right: 20,
          backgroundColor: theme.colors.card, borderRadius: 14,
          flexDirection: 'row', alignItems: 'center', padding: 14,
          borderWidth: 1.5, borderColor: 'rgba(212,245,60,0.3)',
          shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
        }}>
          <Clock color={theme.colors.primary} size={22} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 10, color: theme.colors.textMuted, letterSpacing: 1 }}>REST TIMER</AppText>
            <AppText weight="bold" tabular style={{ fontSize: 24, color: theme.colors.primary }}>{fmt(restTime)}</AppText>
          </View>
          <Pressable style={{ backgroundColor: theme.colors.inputBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border }} onPress={() => setRestTime(p => p + 30)}>
            <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 13 }}>+30s</AppText>
          </Pressable>
          <Pressable style={{ paddingHorizontal: 12, paddingVertical: 8, marginLeft: 6 }} onPress={() => { setTimerActive(false); Notifications.cancelAllScheduledNotificationsAsync(); }}>
            <AppText weight="bold" style={{ color: theme.colors.textMuted, fontSize: 13 }}>Skip</AppText>
          </Pressable>
        </View>
      )}

      {/* ═══ Save Routine Modal ═══ */}
      {showRoutineModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: theme.colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
            <AppText weight="bold" style={{ fontSize: 20, marginBottom: 8 }}>Save Routine</AppText>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 20 }}>Quick-load this workout next time from Dashboard.</AppText>
            <TextInput
              placeholder="e.g. Push Day"
              placeholderTextColor={theme.colors.textMuted}
              style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20, fontSize: 16 }}
              value={routineName}
              onChangeText={setRoutineName}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }} onPress={() => setShowRoutineModal(false)}>
                <AppText weight="bold" style={{ color: theme.colors.textMuted }}>Cancel</AppText>
              </Pressable>
              <Pressable style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }} onPress={handleSaveRoutine}>
                <AppText weight="bold" style={{ color: theme.colors.background }}>Save</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* ═══ Share / Summary Modal ═══ */}
      {showShareModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 150, padding: 24 }}>
          
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={{ width: '100%', backgroundColor: theme.colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Dumbbell color={theme.colors.primary} size={28} style={{ transform: [{ rotate: '-45deg' }], marginRight: 12 }} />
              <View>
                <AppText weight="bold" style={{ fontSize: 22, color: theme.colors.text }}>GymVault</AppText>
                <AppText style={{ fontSize: 11, color: theme.colors.primary, letterSpacing: 2 }}>WORKOUT COMPLETE</AppText>
              </View>
            </View>
            
            <AppText weight="bold" style={{ fontSize: 28, color: theme.colors.text, marginBottom: 8 }}>{workoutData.map(e => e.name).slice(0, 3).join(', ')}{workoutData.length > 3 ? '...' : ''}</AppText>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
              <View style={{ backgroundColor: theme.colors.inputBg, padding: 16, borderRadius: 16, flex: 1, minWidth: '45%' }}>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 4 }}>VOLUME</AppText>
                <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 24 }}>{workoutData.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? Number(s.kg) * Number(s.reps) : 0), 0), 0)}<AppText style={{fontSize: 14}}>kg</AppText></AppText>
              </View>
              <View style={{ backgroundColor: theme.colors.inputBg, padding: 16, borderRadius: 16, flex: 1, minWidth: '45%' }}>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 4 }}>SETS</AppText>
                <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 24 }}>{totalCompleted}</AppText>
              </View>
            </View>

            {/* Comparison Text Card */}
            <View style={{ 
              backgroundColor: 'rgba(212,245,60,0.06)', 
              borderWidth: 1, 
              borderColor: 'rgba(212,245,60,0.15)',
              borderRadius: 16, 
              padding: 16, 
              marginTop: 16,
              alignItems: 'center'
            }}>
              <AppText style={{ color: theme.colors.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 6 }}>INSTAGRAM STORY FLEX</AppText>
              <AppText weight="bold" style={{ color: '#FFF', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                🔥 Total angkatan saya hari ini: {workoutData.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? Number(s.kg) * Number(s.reps) : 0), 0), 0)} kg!
              </AppText>
              <AppText style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                {getVolumeComparison(workoutData.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? Number(s.kg) * Number(s.reps) : 0), 0), 0))}
              </AppText>
            </View>
            
            <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
              <AppText style={{ color: theme.colors.textMuted, fontSize: 10, textAlign: 'center' }}>
                {(() => {
                  const d = new Date();
                  const daysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return `${daysLong[d.getDay()]}, ${monthsShort[d.getMonth()]} ${d.getDate()}`;
                })()}
              </AppText>
            </View>
          </ViewShot>

          <View style={{ flexDirection: 'row', gap: 16, marginTop: 32, width: '100%' }}>
            <Pressable style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }} onPress={() => {
              setShowShareModal(false);
              const shown = showInterstitialAd(() => {
                // Callback ini dipanggil setelah user menutup iklan interstitial
                if (onFinish) onFinish();
              });
              if (!shown) {
                // Iklan belum siap, langsung finish tanpa iklan
                if (onFinish) onFinish();
              }
            }}>
              <AppText weight="bold" style={{ color: theme.colors.text }}>Done</AppText>
            </Pressable>
            <Pressable style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: theme.colors.primary, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' }} onPress={async () => {
              try {
                const uri = await viewShotRef.current.capture();
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(uri);
                } else {
                  Alert.alert("Sharing not available", "Your device does not support sharing.");
                }
              } catch (e) { Alert.alert("Error", e.message); }
            }}>
              <AppText weight="bold" style={{ color: theme.colors.background }}>Share Story</AppText>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══ Plate Calculator Modal ═══ */}
      {showPlateModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 120, padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: theme.colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <AppText weight="bold" style={{ fontSize: 20 }}>Plate Calculator</AppText>
              <Pressable onPress={() => setShowPlateModal(false)}>
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
                          </View>
                          <View style={{ marginTop: 6, backgroundColor: theme.colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                            <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 10 }}>{count}x</AppText>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
            </View>
          </View>
        </View>
      )}

      {/* ═══ Hands-Free Voice Logger Modal ═══ */}
      {voiceModalVisible && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 100 }}>
          <View style={{ width: '100%', maxWidth: 360, backgroundColor: '#0F172A', borderRadius: 20, borderWidth: 1, borderColor: '#38BDF8', padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Mic color="#38BDF8" size={22} />
                <AppText weight="bold" style={{ fontSize: 16, color: '#38BDF8' }}>Voice Hands-Free Logger</AppText>
              </View>
              <Pressable onPress={() => { setVoiceModalVisible(false); setVoiceInputText(''); }} style={{ padding: 4 }}>
                <X color={theme.colors.textMuted} size={18} />
              </Pressable>
            </View>

            <AppText style={{ fontSize: 12, color: '#94A3B8', marginBottom: 14, lineHeight: 17 }}>
              Katakan atau ketik beban dan repetisi set Anda saat tangan sibuk:
            </AppText>

            {/* Live Microphone Recording Card (Whole Card is Clickable) */}
            <Pressable
              onPress={isListening ? stopListening : startListening}
              style={({ pressed }) => ({
                alignItems: 'center',
                marginVertical: 14,
                backgroundColor: isListening ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.08)',
                paddingVertical: 16,
                paddingHorizontal: 12,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: isListening ? '#EF4444' : 'rgba(56, 189, 248, 0.4)',
                opacity: pressed ? 0.8 : 1,
                cursor: 'pointer'
              })}
            >
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: isListening ? '#EF4444' : '#38BDF8',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: isListening ? '#EF4444' : '#38BDF8',
                  shadowOpacity: 0.6,
                  shadowRadius: 16,
                  elevation: 8,
                  borderWidth: 4,
                  borderColor: isListening ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)',
                  marginBottom: 10
                }}
              >
                {isListening ? (
                  <MicOff color="#FFF" size={34} />
                ) : (
                  <Mic color="#000" size={34} />
                )}
              </View>

              <AppText weight="bold" style={{ color: isListening ? '#EF4444' : '#38BDF8', fontSize: 14, textAlign: 'center' }}>
                {isListening ? '🔴 Sedang Mendengarkan Suara...' : '🎙️ Tekan Di Sini & Mulai Bicara'}
              </AppText>
              
              <AppText style={{ color: '#94A3B8', fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                {isListening ? 'Katakan: "Coach, catat 80 kilo 8 repetisi"' : 'Katakan: "80 kilo 8 repetisi" atau "75kg 10 rep"'}
              </AppText>

              {micStatusMsg ? (
                <View style={{ marginTop: 8, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <AppText style={{ color: '#F59E0B', fontSize: 10, textAlign: 'center' }}>{micStatusMsg}</AppText>
                </View>
              ) : null}
            </Pressable>

            <TextInput
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: isListening ? '#EF4444' : 'rgba(56,189,248,0.3)',
                borderRadius: 12,
                padding: 12,
                color: '#FFF',
                fontSize: 14,
                marginBottom: 12
              }}
              value={voiceInputText}
              onChangeText={setVoiceInputText}
              placeholder='Transkrip suara otomatis muncul di sini...'
              placeholderTextColor="#64748B"
              onSubmitEditing={() => handleProcessVoiceCommand(voiceInputText)}
            />

            {/* Quick Voice Chips */}
            <AppText style={{ fontSize: 10, color: '#64748B', marginBottom: 6 }}>ATAU PILIH CONTOH CEPAT:</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {[
                '80 kilo 8 repetisi',
                '60 kg 10 reps',
                '40 kilo 12 kali',
                '25 kg 15 reps'
              ].map((chip, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleProcessVoiceCommand(chip)}
                  style={{
                    backgroundColor: 'rgba(56,189,248,0.12)',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(56,189,248,0.25)'
                  }}
                >
                  <AppText weight="bold" style={{ fontSize: 11, color: '#38BDF8' }}>{chip}</AppText>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => handleProcessVoiceCommand(voiceInputText)}
              style={{
                backgroundColor: '#38BDF8',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AppText weight="bold" style={{ color: '#000', fontSize: 13 }}>
                ✔ Konfirmasi & Catat Set
              </AppText>
            </Pressable>
          </View>
        </View>
      )}

      <DummyAdBanner />
    </KeyboardAvoidingView>
  );
}
