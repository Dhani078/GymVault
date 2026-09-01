import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal, ActivityIndicator, Animated, Image, Linking, TextInput, ScrollView } from 'react-native';
import { X, CheckCircle, Award, MessageCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, styles, theme } from '../theme';
import { supabase } from '../supabaseClient';
import Reanimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import useRewardedAd from '../components/DummyRewardedAd';

const LaserScanner = () => {
  const laserY = useSharedValue(0);

  React.useEffect(() => {
    laserY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: laserY.value * 280 }], // Assuming height of image is around 300
    };
  });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Reanimated.View style={[{ width: '100%', height: 4, backgroundColor: '#D4F53C', shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 10 }, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(212,245,60,0.8)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Reanimated.View>
      <Reanimated.View style={[{ position: 'absolute', top: -50, width: '100%', height: 50, opacity: 0.3 }, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(212,245,60,0.4)']}
          style={{ width: '100%', height: '100%' }}
        />
      </Reanimated.View>
    </View>
  );
};

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
// URL Backend Vercel (Setup di .env EXPO_PUBLIC_API_URL atau gunakan domain vercel kamu)
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'https://gymvault-app.vercel.app';

export default function NutritionScannerModal({ visible, onClose, session }) {
  const [scannedImage, setScannedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingText, setLoadingText] = useState("ANALYZING MACROS...");
  const [nutritionResult, setNutritionResult] = useState(null);

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      const phrases = [
        "MENGANALISIS GAMBAR...",
        "MENGIDENTIFIKASI MAKANAN...",
        "MENGHITUNG KALORI...",
        "MEMECAH PROTEIN & KARBO...",
        "MENYIAPKAN DATA NUTRISI..."
      ];
      let i = 0;
      setLoadingText(phrases[0]);
      interval = setInterval(() => {
        i = (i + 1) % phrases.length;
        setLoadingText(phrases[i]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { isLoaded: isRewardedLoaded, showAd: showRewardedAd } = useRewardedAd();
  const [usageCount, setUsageCount] = useState(0);

  // States for portion adjustment & correction
  const [portionScale, setPortionScale] = useState(1);
  const [showOverrideSearch, setShowOverrideSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedInToday, setCheckedInToday] = useState(false);

  const resetState = () => {
    setScannedImage(null);
    setNutritionResult(null);
    setIsAnalyzing(false);
    setShowPaywall(false);
    setPortionScale(1);
    setShowOverrideSearch(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

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

      const usageData = await AsyncStorage.getItem(`ai_nutrition_daily_${userId}`);
      if (usageData) {
        const parsed = JSON.parse(usageData);
        if (parsed.date === today) {
          setUsageCount(parsed.count);
        } else {
          setUsageCount(0);
        }
      } else {
        setUsageCount(0);
      }
    } catch (e) {}
  };

  const analyzeImageWithGemini = async (base64Image) => {
    try {
      const { NUTRITION_DATASET } = require('../services/NutritionDataset');
      const knownNames = NUTRITION_DATASET.slice(0, 45).map(item => item.name).join(", ");

      // Memanggil fungsi serverless Vercel kita alih-alih API Google langsung
      const response = await fetch(`${BACKEND_URL}/api/analyze-nutrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image: base64Image,
          knownNames: knownNames
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      let parsedResult = data;

      try {
        const { matchNutritionDataset } = require('../services/NutritionDataset');
        const matched = matchNutritionDataset(parsedResult.food);
        if (matched) {
          parsedResult.food = matched.name;
          parsedResult.cal = matched.cal;
          parsedResult.p = matched.p;
          parsedResult.c = matched.c;
          parsedResult.f = matched.f;
        }
      } catch (e) {
        console.warn("Dataset matching error:", e);
      }
      return parsedResult;
    } catch (error) {
      console.warn("Serverless API Error / Network Error:", error.message);
      return { food: "Error Jaringan / Server", cal: 0, p: 0, c: 0, f: 0 };
    }
  };

  const handleScanFood = async () => {
    try {
      const maxUsage = checkedInToday ? 15 : 3;
      if (!isPremium && usageCount >= maxUsage) {
        const shown = showRewardedAd(async () => {
          await handleRewardEarned();
          handleScanFood();
        });
        if (!shown) {
          alert("Iklan Reward sedang dimuat, mohon tunggu sebentar lalu coba lagi.");
        }
        return;
      }

      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!cameraPerm.granted && !libraryPerm.granted) {
        alert("Akses kamera atau galeri dibutuhkan!");
        return;
      }

      let result;
      try {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
          base64: true, // we need base64 for the API
        });
      } catch (e) {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
          base64: true,
        });
      }

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        setScannedImage(result.assets[0].uri);
        setIsAnalyzing(true);
        setNutritionResult(null);

        const base64Data = result.assets[0].base64;

        // Panggil API aseli
        const apiResult = await analyzeImageWithGemini(base64Data);

        // Increment usage
        if (!isPremium) {
          const newCount = usageCount + 1;
          const today = getLocalDateString();
          const userId = session?.user?.id || 'guest';
          await AsyncStorage.setItem(`ai_nutrition_daily_${userId}`, JSON.stringify({ count: newCount, date: today }));
          setUsageCount(newCount);
        }

        setNutritionResult(apiResult);
        setIsAnalyzing(false);
      }
    } catch (e) {
      console.warn("Scan failed", e);
      setIsAnalyzing(false);
    }
  };

  const handleRewardEarned = async () => {
    const newCount = Math.max(0, usageCount - 1);
    setUsageCount(newCount);
    const today = getLocalDateString();
    const userId = session?.user?.id || 'guest';
    await AsyncStorage.setItem(`ai_nutrition_daily_${userId}`, JSON.stringify({ count: newCount, date: today }));
  };

  // Auto trigger scan when modal becomes visible if no image is present
  React.useEffect(() => {
    if (visible) {
      checkUsage().then(() => {
        const maxUsage = checkedInToday ? 15 : 3;
        if (!scannedImage && !isAnalyzing && !nutritionResult && (!isPremium && usageCount < maxUsage || isPremium)) {
          // Temporarily hold off on auto-scanning so the limit check is reliable. Wait, we must know usageCount inside the effect. 
          // Actually, let's just NOT auto-scan, let user see limit first.
        }
      });
    }
  }, [visible]);

  // Separate effect to trigger scan after usageCount is loaded
  React.useEffect(() => {
    if (visible && !scannedImage && !isAnalyzing && !nutritionResult && !showPaywall) {
      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        const maxUsage = checkedInToday ? 15 : 3;
        if (!isPremium && usageCount >= maxUsage) {
          setShowPaywall(true);
        } else {
          handleScanFood();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, usageCount, isPremium, checkedInToday]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>

        <TouchableOpacity style={{ position: 'absolute', top: 60, right: 24, zIndex: 10 }} onPress={handleClose}>
          <X color="#FFF" size={32} />
        </TouchableOpacity>

        <AppText weight="bold" style={{ color: '#FFF', fontSize: 24, marginBottom: 8, marginTop: 40, textAlign: 'center' }}>AI Nutrition Lens</AppText>
        <AppText style={{ color: '#888', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>Powered by Gemini Vision</AppText>

        {!isPremium && !showPaywall && (() => {
          const maxUsage = checkedInToday ? 15 : 3;
          return (
            <View style={{ backgroundColor: 'rgba(204, 255, 0, 0.1)', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(204, 255, 0, 0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <AppText style={{ color: '#D4F53C', fontSize: 14 }}>Sisa AI Nutrition Hari Ini:</AppText>
              <AppText weight="bold" style={{ color: '#D4F53C', fontSize: 16 }}>{Math.max(0, maxUsage - usageCount)} / {maxUsage}</AppText>
            </View>
          );
        })()}

        {showPaywall ? (
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Award color="#D4F53C" size={48} style={{ marginBottom: 16 }} />
            <AppText weight="bold" style={{ fontSize: 24, color: '#FFF', marginBottom: 8, textAlign: 'center' }}>Limit AI Habis</AppText>
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

            <TouchableOpacity onPress={handleClose}>
              <AppText style={{ color: '#888', marginTop: 8 }}>Tutup</AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: theme.colors.border, backgroundColor: '#111', marginBottom: 32, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: isAnalyzing ? 0.5 : 0, shadowRadius: 20 }}>
          {scannedImage && (
            <Animated.Image
              source={{ uri: scannedImage }}
              style={{ width: '100%', height: '100%', opacity: isAnalyzing ? 0.5 : 1 }}
            />
          )}

          {isAnalyzing && (
            <>
              <LaserScanner />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <ActivityIndicator color={theme.colors.primary} size="large" />
                <AppText weight="bold" style={{ color: theme.colors.primary, marginTop: 16, letterSpacing: 2 }}>{loadingText}</AppText>
              </View>
            </>
          )}
        </View>

        {nutritionResult && !isAnalyzing && (
          <Animated.View style={{ width: '100%', backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border }}>
            
            {/* Header: Detected Food Name & Correction button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <CheckCircle color={theme.colors.primary} size={28} />
              <View style={{ flex: 1 }}>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Detected Food</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 18 }}>{nutritionResult.food}</AppText>
                  <TouchableOpacity 
                    onPress={() => setShowOverrideSearch(!showOverrideSearch)}
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                  >
                    <AppText style={{ color: '#D4F53C', fontSize: 11 }}>✏️ Edit</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Overriding Search Input */}
            {showOverrideSearch && (
              <View style={{ marginBottom: 16, backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#333' }}>
                <AppText weight="bold" style={{ color: '#FFF', fontSize: 12, marginBottom: 8 }}>Search Known Kaggle Database (100% Accuracy):</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#444', fontSize: 14 }}
                  placeholder="e.g. Nasi, Dada Ayam, Telur..."
                  placeholderTextColor="#888"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.trim().length > 0 && (() => {
                  const { NUTRITION_DATASET } = require('../services/NutritionDataset');
                  const query = searchQuery.toLowerCase();
                  const matches = NUTRITION_DATASET.filter(item => 
                    item.name.toLowerCase().includes(query) || 
                    item.keywords.some(kw => kw.toLowerCase().includes(query))
                  ).slice(0, 3);

                  if (matches.length === 0) {
                    return <AppText style={{ color: '#888', fontSize: 12, marginTop: 8 }}>No matching foods found.</AppText>;
                  }

                  return (
                    <View style={{ marginTop: 8, gap: 6 }}>
                      {matches.map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => {
                            setNutritionResult({
                              food: item.name,
                              cal: item.cal,
                              p: item.p,
                              c: item.c,
                              f: item.f
                            });
                            setShowOverrideSearch(false);
                            setSearchQuery('');
                            setPortionScale(1);
                          }}
                          style={{ backgroundColor: 'rgba(212,245,60,0.1)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(212,245,60,0.2)' }}
                        >
                          <AppText weight="bold" style={{ color: '#D4F53C', fontSize: 13 }}>{item.name}</AppText>
                          <AppText style={{ color: '#888', fontSize: 11 }}>100% Acc: {item.cal} kcal • P: {item.p}g • C: {item.c}g • F: {item.f}g</AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })()}
              </View>
            )}

            {/* Macros Display (Instantly scaled by portionScale) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12, marginBottom: 16 }}>
              <View style={{ alignItems: 'center' }}>
                <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 24 }}>{Math.round(nutritionResult.cal * portionScale)}</AppText>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 11 }}>KCAL</AppText>
              </View>
              <View style={{ width: 1, backgroundColor: theme.colors.border }} />
              <View style={{ alignItems: 'center' }}>
                <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 18 }}>{(nutritionResult.p * portionScale).toFixed(1)}g</AppText>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 11 }}>Protein</AppText>
              </View>
              <View style={{ width: 1, backgroundColor: theme.colors.border }} />
              <View style={{ alignItems: 'center' }}>
                <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 18 }}>{(nutritionResult.c * portionScale).toFixed(1)}g</AppText>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 11 }}>Carbs</AppText>
              </View>
              <View style={{ width: 1, backgroundColor: theme.colors.border }} />
              <View style={{ alignItems: 'center' }}>
                <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 18 }}>{(nutritionResult.f * portionScale).toFixed(1)}g</AppText>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 11 }}>Fats</AppText>
              </View>
            </View>

            {/* Portion Adjuster Section */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 12 }}>Adjust Serving Size:</AppText>
                <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 13 }}>{portionScale.toFixed(2)}x Portion</AppText>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => setPortionScale(Math.max(0.1, portionScale - 0.25))}
                  style={{ flex: 1, backgroundColor: '#222', padding: 10, borderRadius: 8, alignItems: 'center' }}
                >
                  <AppText weight="bold" style={{ color: '#FFF', fontSize: 13 }}>- 0.25x</AppText>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setPortionScale(1.0)}
                  style={{ flex: 1, backgroundColor: portionScale === 1.0 ? '#D4F53C' : '#222', padding: 10, borderRadius: 8, alignItems: 'center' }}
                >
                  <AppText weight="bold" style={{ color: portionScale === 1.0 ? '#000' : '#FFF', fontSize: 13 }}>Reset (1x)</AppText>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setPortionScale(portionScale + 0.25)}
                  style={{ flex: 1, backgroundColor: '#222', padding: 10, borderRadius: 8, alignItems: 'center' }}
                >
                  <AppText weight="bold" style={{ color: '#FFF', fontSize: 13 }}>+ 0.25x</AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.btnSecondary, { flex: 1, backgroundColor: 'transparent' }]}
                onPress={handleScanFood}
              >
                <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 15 }}>Rescan</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnPrimary, { flex: 1, backgroundColor: theme.colors.primary }]}
                onPress={async () => {
                  if (!nutritionResult) return;
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session?.user?.id) {
                    alert("Gagal: Anda belum login!");
                    return;
                  }

                  const scaledCal = Math.round(nutritionResult.cal * portionScale);
                  const scaledP = parseFloat((nutritionResult.p * portionScale).toFixed(1));
                  const scaledC = parseFloat((nutritionResult.c * portionScale).toFixed(1));
                  const scaledF = parseFloat((nutritionResult.f * portionScale).toFixed(1));

                  const { error } = await supabase.from('nutrition_logs').insert({
                    user_id: session.user.id,
                    food_name: `${nutritionResult.food} (${portionScale.toFixed(1)}x)`,
                    calories: scaledCal,
                    protein: scaledP,
                    carbs: scaledC,
                    fats: scaledF
                  });

                  if (error) {
                    alert("Gagal menyimpan data: " + error.message);
                  } else {
                    alert("Sukses! Makanan tercatat di database.");
                    handleClose();
                  }
                }}
              >
                <AppText weight="bold" style={{ color: '#000', fontSize: 15 }}>Log Meal</AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        </>
      )}

      </View>
    </Modal>
  );
}
