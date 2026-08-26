import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, TextInput, Platform } from 'react-native';
import {
  Dumbbell, Activity, Cpu, ShieldCheck, Zap, Flame, Award, ChevronRight,
  TrendingUp, Sparkles, Smartphone, Check, ArrowRight, Star, Heart,
  Timer, BarChart2, Layers, QrCode, Crown, CheckCircle2, ChevronDown, ChevronUp,
  Scale, Calculator, Droplets, Target, Repeat, Sliders, BatteryCharging, Compass,
  Eye, Shield, Radio, PlayCircle, BarChart, FileText, CheckCircle, Utensils, Mic
} from 'lucide-react-native';
import { calculate1RM, calculatePlateBreakdown, calculateTDEE, calculateHeartRateZones } from '../utils/fitnessMath';

const { width } = Dimensions.get('window');

const MUSCLE_DATA = {
  chest: {
    name: 'Dada (Pectorals)',
    fatigue: 85,
    recoveryHours: 48,
    cnsStrain: 'Tinggi (Heavy Load)',
    exercises: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Cable Fly'],
    advice: 'Kelelahan optimal. Butuh 48 jam istirahat sebelum sesi push berikutnya.'
  },
  back: {
    name: 'Punggung (Lats & Traps)',
    fatigue: 92,
    recoveryHours: 54,
    cnsStrain: 'Sangat Tinggi (Deadlift Stress)',
    exercises: ['Conventional Deadlift', 'Lat Pulldown', 'Barbell Row'],
    advice: 'Otot lats mendekati batas adaptasi. Tingkatkan asupan protein dan hidrasi.'
  },
  legs: {
    name: 'Kaki (Quads & Glutes)',
    fatigue: 95,
    recoveryHours: 72,
    cnsStrain: 'Maksimal (High CNS)',
    exercises: ['Barbell Back Squat', 'Leg Press', 'Romanian Deadlift'],
    advice: 'Recovery penuh butuh 72 jam. Disarankan active recovery jalan santai.'
  },
  shoulders: {
    name: 'Bahu (Deltoids)',
    fatigue: 60,
    recoveryHours: 24,
    cnsStrain: 'Sedang',
    exercises: ['Overhead Press', 'Lateral Raises', 'Face Pulls'],
    advice: 'Kondisi siap untuk volume tambahan atau teknik superset.'
  },
  arms: {
    name: 'Lengan (Biceps & Triceps)',
    fatigue: 40,
    recoveryHours: 12,
    cnsStrain: 'Rendah',
    exercises: ['Incline Dumbbell Curl', 'Triceps Rope Pushdown'],
    advice: 'Otot hampir pulih 100%. Siap untuk pump workout intens.'
  }
};

const FOOD_PRESETS = [
  {
    id: 'nasi_padang',
    name: 'Nasi Padang Dada Ayam Bakar',
    calories: 620,
    protein: 48,
    carbs: 65,
    fats: 18,
    verdict: 'Tinggi protein murni, lemak terkontrol jika tanpa kuah gulai kental.'
  },
  {
    id: 'shake',
    name: 'Whey Protein Oat Banana Shake',
    calories: 450,
    protein: 42,
    carbs: 52,
    fats: 8,
    verdict: 'Post-workout ideal untuk sintesis protein otot cepat.'
  },
  {
    id: 'salmon',
    name: 'Salmon Bowl & Brown Rice',
    calories: 580,
    protein: 45,
    carbs: 50,
    fats: 22,
    verdict: 'Kaya asam lemak Omega-3 untuk percepatan pemulihan inflamasi sendi.'
  }
];

const SPLIT_PROGRAMS = {
  3: {
    name: 'Full Body 3x Seminggu',
    tagline: 'Maksimal Stimulus Frekuensi, Waktu Sangat Efisien',
    days: [
      { day: 'Senin', focus: 'Full Body A (Squat & Bench Focus)', vol: '18 Sets' },
      { day: 'Rabu', focus: 'Full Body B (Deadlift & Overhead Press)', vol: '16 Sets' },
      { day: 'Jumat', focus: 'Full Body C (Leg Press & Incline DB)', vol: '18 Sets' }
    ]
  },
  4: {
    name: 'Upper / Lower 4x Seminggu',
    tagline: 'Keseimbangan Hypertrophy & Pemulihan Saraf',
    days: [
      { day: 'Senin', focus: 'Upper Power (Heavy Bench & Barbell Row)', vol: '18 Sets' },
      { day: 'Selasa', focus: 'Lower Power (Heavy Squat & RDL)', vol: '16 Sets' },
      { day: 'Kamis', focus: 'Upper Hypertrophy (Incline DB & Lateral Raises)', vol: '20 Sets' },
      { day: 'Jumat', focus: 'Lower Hypertrophy (Leg Press & Calves)', vol: '18 Sets' }
    ]
  },
  5: {
    name: 'Push / Pull / Legs / Upper / Lower (5 Days)',
    tagline: 'Volume Tinggi untuk Progres Atletis Lanjut',
    days: [
      { day: 'Senin', focus: 'Push (Chest, Delts, Triceps)', vol: '18 Sets' },
      { day: 'Selasa', focus: 'Pull (Lats, Traps, Biceps)', vol: '18 Sets' },
      { day: 'Rabu', focus: 'Legs (Quads, Hamstrings, Calves)', vol: '16 Sets' },
      { day: 'Jumat', focus: 'Upper Volume (Compound Lifts)', vol: '16 Sets' },
      { day: 'Sabtu', focus: 'Lower Volume (Hypertrophy)', vol: '16 Sets' }
    ]
  },
  6: {
    name: 'Push / Pull / Legs (PPL 2x Cycle)',
    tagline: 'Maksimal Muscle Protein Synthesis untuk Pro Lifter',
    days: [
      { day: 'Senin & Kamis', focus: 'Push Focus (Heavy & Hypertrophy)', vol: '20 Sets' },
      { day: 'Selasa & Jumat', focus: 'Pull Focus (Heavy & Hypertrophy)', vol: '20 Sets' },
      { day: 'Rabu & Sabtu', focus: 'Legs Focus (Heavy & Hypertrophy)', vol: '20 Sets' }
    ]
  }
};

const FAQS = [
  {
    q: 'Apakah GymVault bisa digunakan saat gym saya tidak ada sinyal internet?',
    a: 'Tentu saja! GymVault dibangun dengan arsitektur Offline-First Local Vault. Semua rep, set, dan beban Anda tersimpan instan di memori HP dan otomatis tersinkronisasi ke server Supabase begitu HP Anda terhubung kembali ke Wi-Fi / data.'
  },
  {
    q: 'Bagaimana cara AI Gemini menganalisis makanan saya?',
    a: 'Cukup foto makanan Anda menggunakan kamera GymVault. Model multimodal Google Gemini 3.7 Vision akan langsung mendeteksi jenis makanan, menghitung estimasi gramatur, kalori, serta makronutrisi (Protein, Karbohidrat, Lemak) dalam hitungan detik.'
  },
  {
    q: 'Apa perbedaan Gym Mode dan Home Mode?',
    a: 'Saat Anda di gym, Gym Mode mengaktifkan pelacakan beban berat (Barbell/Dumbbell), kalkulator plate, RPE, dan rest timer presisi. Saat di rumah, Home Mode otomatis beralih ke latihan Calisthenics, Resistance Band, dan timer interval HIIT.'
  },
  {
    q: 'Bagaimana cara mengaktifkan akun Pro via QRIS DANA?',
    a: 'Buka menu pembayaran di aplikasi, scan kode QRIS DANA yang muncul di layar, lalu upload screenshot bukti bayar. Sistem kami yang terhubung ke Bot Telegram & Gemini AI akan memverifikasi dan mengaktifkan akun Anda secara instan 24/7!'
  }
];

export default function LandingPage({ onLoginPress }) {
  const isLarge = width >= 1024;
  const isMedium = width >= 768;

  // Interactive Screen Mockup Preview Tab
  const [mockupTab, setMockupTab] = useState('logger'); // 'logger' | 'heatmap' | 'ai' | 'fridge' | 'voice'

  // Interactive Demo States
  const [selectedMuscle, setSelectedMuscle] = useState('chest');
  const [activeMode, setActiveMode] = useState('gym'); // 'gym' | 'home'
  const [selectedFood, setSelectedFood] = useState(FOOD_PRESETS[0]);
  const [volumeSlider, setVolumeSlider] = useState(25000);
  const [openFaq, setOpenFaq] = useState(0);

  // Interactive Fridge Chef Playground State
  const [fridgeSelectedIngredients, setFridgeSelectedIngredients] = useState(['3 Butir Telur', '1 Papan Tempe', '1 Centong Nasi']);
  const [fridgeTargetCal, setFridgeTargetCal] = useState('650');

  // Interactive Voice Logger Simulator State
  const [voiceSimCommand, setVoiceSimCommand] = useState('Coach, catat 80 kilo 8 repetisi');
  const [voiceSimActiveSet, setVoiceSimActiveSet] = useState({ weight: '80', reps: '8', completed: true, restTimer: 180 });

  // 1RM Calculator States
  const [oneRmWeight, setOneRmWeight] = useState('100');
  const [oneRmReps, setOneRmReps] = useState('5');

  // Plate Calculator State
  const [targetPlateWeight, setTargetPlateWeight] = useState(100);

  // TDEE Calculator States
  const [tdeeWeight, setTdeeWeight] = useState('70');
  const [tdeeHeight, setTdeeHeight] = useState('175');
  const [tdeeAge, setTdeeAge] = useState('24');
  const [tdeeGoal, setTdeeGoal] = useState('cut'); // 'cut' | 'maintain' | 'bulk'

  // Split Generator State
  const [splitDays, setSplitDays] = useState(4);

  // Cardio Heart Rate Age
  const [userAge, setUserAge] = useState(25);

  const muscle = MUSCLE_DATA[selectedMuscle];

  // 1RM Calculation (Brzycki Formula)
  const estimated1RM = calculate1RM(oneRmWeight, oneRmReps);

  // Plate Calculator Breakdown (20kg bar, pairs per side)
  const plateResult = calculatePlateBreakdown(targetPlateWeight, 20);

  // TDEE Calculation (Mifflin-St Jeor)
  const tdeeResult = calculateTDEE({
    weightKg: tdeeWeight,
    heightCm: tdeeHeight,
    ageYears: tdeeAge,
    goal: tdeeGoal,
  });

  // Volume equivalents
  const getVolumeEquivalent = (vol) => {
    if (vol < 5000) return { qty: (vol / 500).toFixed(1), item: 'Motor Sport Ninja' };
    if (vol < 15000) return { qty: (vol / 1500).toFixed(1), item: 'Mobil Sedan City Car' };
    if (vol < 40000) return { qty: (vol / 2500).toFixed(1), item: 'Mobil SUV Listrik' };
    if (vol < 80000) return { qty: (vol / 5000).toFixed(1), item: 'Gajah Sumatra Dewasa' };
    return { qty: (vol / 20000).toFixed(1), item: 'Truk Kontainer Logistik' };
  };

  const equiv = getVolumeEquivalent(volumeSlider);
  const maxHR = 220 - (parseInt(userAge) || 25);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
      
      {/* ─── STICKY GLASSMORPHIC NAVBAR ─── */}
      <View style={[styles.header, { paddingHorizontal: isLarge ? 80 : 24 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.logoBadge}>
            <Dumbbell color="#CCFF00" size={24} />
          </View>
          <View>
            <Text style={styles.logoText}>GYMVAULT</Text>
            <Text style={styles.logoTagline}>THE ADAPTIVE ENGINE</Text>
          </View>
        </View>

        {isLarge && (
          <View style={styles.navLinks}>
            <View style={styles.statusLive}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>99.9% Uptime • Gemini 3.7 Multi-Model Cascade</Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.loginBtn} onPress={onLoginPress} activeOpacity={0.8}>
            <Text style={styles.loginBtnText}>Buka Web App</Text>
            <ArrowRight color="#000" size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── HERO SECTION (CINEMATIC WIDE 2-LINE) ─── */}
      <View style={[styles.heroSection, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.badge}>
          <Sparkles color="#CCFF00" size={14} />
          <Text style={styles.badgeText}>ELITE FITNESS & ADAPTIVE RECOVERY ENGINE 2.0</Text>
        </View>

        <Text style={[styles.heroTitle, { fontSize: isLarge ? 64 : isMedium ? 44 : 32, lineHeight: isLarge ? 74 : isMedium ? 52 : 40 }]}>
          ENGINEERED FOR{'\n'}
          <Text style={{ color: '#CCFF00' }}>ABSOLUTE PHYSICAL DOMINANCE.</Text>
        </Text>

        <Text style={[styles.heroSubtitle, { maxWidth: isLarge ? 760 : 600 }]}>
          GymVault memadukan pelacakan latihan berkecepatan 120 FPS Skia GPU, 
          mesin pemulihan kelelahan otot Central Nervous System (CNS), 
          dan kecerdasan buatan Google Gemini Multimodal untuk memecahkan batas rekor fisik Anda.
        </Text>

        {/* Hero CTAs */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.primaryCta} onPress={onLoginPress} activeOpacity={0.8}>
            <Text style={styles.primaryCtaText}>Mulai Latihan Sekarang (Gratis)</Text>
            <ArrowRight color="#000" size={18} />
          </TouchableOpacity>
        </View>

        {/* Telemetry Highlights */}
        <View style={[styles.statsRow, { flexDirection: isMedium ? 'row' : 'column', width: '100%', maxWidth: 940 }]}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0.02s</Text>
            <Text style={styles.statLabel}>Skia GPU Render Latency</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Offline-First Local Vault</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>Gemini 3.7</Text>
            <Text style={styles.statLabel}>Multimodal Vision AI</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>1-Click</Text>
            <Text style={styles.statLabel}>Instant QRIS Activation</Text>
          </View>
        </View>
      </View>

      {/* ─── INTERACTIVE APP SCREEN SHOWCASE PREVIEW ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <Smartphone color="#CCFF00" size={14} />
            <Text style={styles.miniTagText}>LIVE INTERACTIVE INTERFACE</Text>
          </View>
          <Text style={styles.sectionHeading}>Eksplorasi Antarmuka Aplikasi</Text>
          <Text style={styles.sectionSub}>
            Pilih modul di bawah untuk melihat simulasi antarmuka live dari fitur-fitur unggulan GymVault.
          </Text>

          {/* Tab Switcher */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { id: 'logger', label: 'Zero-Friction Live Logger', icon: PlayCircle },
              { id: 'voice', label: '🎙️ Voice Hands-Free Logger', icon: Mic },
              { id: 'fridge', label: '🍳 Fridge-to-Macro Chef', icon: Utensils },
              { id: 'heatmap', label: '12-Group CNS Heatmap', icon: Activity },
              { id: 'ai', label: 'Gemini 3.7 AI Coach', icon: Cpu }
            ].map(tab => {
              const IconComponent = tab.icon;
              const isSel = mockupTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.mockupTabBtn, isSel && styles.mockupTabBtnActive]}
                  onPress={() => setMockupTab(tab.id)}
                >
                  <IconComponent color={isSel ? '#000' : '#888'} size={16} />
                  <Text style={[styles.mockupTabBtnText, isSel && { color: '#000', fontWeight: 'bold' }]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Mockup Display Box */}
        <View style={[styles.mockupDisplayCard, { width: '100%', maxWidth: 880, alignSelf: 'center' }]}>
          {mockupTab === 'logger' && (
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: '#CCFF00', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>SESI LATIHAN AKTIF</Text>
                  <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 2 }}>Heavy Push Day (Barbell Focus)</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ color: '#CCFF00', fontWeight: 'bold', fontSize: 13 }}>00:42:18</Text>
                </View>
              </View>

              <View style={styles.loggerSetRow}>
                <Text style={{ color: '#888', fontWeight: 'bold', width: 50 }}>SET 1</Text>
                <Text style={{ color: '#FFF', fontWeight: 'bold', flex: 1 }}>Barbell Bench Press</Text>
                <Text style={{ color: '#CCFF00', fontWeight: 'bold' }}>100 kg × 8 reps</Text>
                <View style={styles.checkPill}><Check color="#000" size={14} /></View>
              </View>

              <View style={styles.loggerSetRow}>
                <Text style={{ color: '#888', fontWeight: 'bold', width: 50 }}>SET 2</Text>
                <Text style={{ color: '#FFF', fontWeight: 'bold', flex: 1 }}>Incline Dumbbell Press</Text>
                <Text style={{ color: '#CCFF00', fontWeight: 'bold' }}>36 kg × 10 reps</Text>
                <View style={styles.checkPill}><Check color="#000" size={14} /></View>
              </View>

              <View style={styles.loggerSetRow}>
                <Text style={{ color: '#888', fontWeight: 'bold', width: 50 }}>SET 3</Text>
                <Text style={{ color: '#FFF', fontWeight: 'bold', flex: 1 }}>Overhead Barbell Press</Text>
                <Text style={{ color: '#CCFF00', fontWeight: 'bold' }}>60 kg × 8 reps</Text>
                <View style={styles.checkPill}><Check color="#000" size={14} /></View>
              </View>
            </View>
          )}

          {mockupTab === 'voice' && (
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>VOICE HANDS-FREE WORKOUT LOGGER</Text>
                  <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 2 }}>Catat Beban Sambil Mengangkat Barbell</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(56,189,248,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)' }}>
                  <Text style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 12 }}>🎙️ LIVE MIC ACTIVE</Text>
                </View>
              </View>

              <Text style={{ color: '#888', fontSize: 12 }}>Klik contoh ucapan suara atlet di bawah untuk menguji simulasi pencatatan otomatis:</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { cmd: 'Coach, catat 80 kilo 8 repetisi', w: '80', r: '8', t: 180 },
                  { cmd: '75kg 10 rep', w: '75', r: '10', t: 120 },
                  { cmd: 'beban 25 kilo repetisi 12', w: '25', r: '12', t: 60 }
                ].map((item, idx) => {
                  const isSel = voiceSimCommand === item.cmd;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setVoiceSimCommand(item.cmd);
                        setVoiceSimActiveSet({ weight: item.w, reps: item.r, completed: true, restTimer: item.t });
                      }}
                      style={{
                        backgroundColor: isSel ? '#38BDF8' : 'rgba(56,189,248,0.1)',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: isSel ? '#38BDF8' : 'rgba(56,189,248,0.25)'
                      }}
                    >
                      <Text style={{ color: isSel ? '#000' : '#38BDF8', fontSize: 12, fontWeight: 'bold' }}>
                        🗣️ "{item.cmd}"
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Output Live Voice Result Box */}
              <View style={{ backgroundColor: '#0B132B', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#38BDF8', marginTop: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: 'bold' }}>✔ SET BERHASIL DICATAT OTOMATIS:</Text>
                  <View style={{ backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: 'bold' }}>⏱️ Rest Timer: {voiceSimActiveSet.restTimer}s</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Barbell Bench Press (Set 1)</Text>
                  <Text style={{ color: '#38BDF8', fontSize: 20, fontWeight: 'bold' }}>{voiceSimActiveSet.weight} kg × {voiceSimActiveSet.reps} reps</Text>
                </View>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
                  🗣️ AI Audio Response: "Set 1 dicatat, {voiceSimActiveSet.weight} kilogram {voiceSimActiveSet.reps} repetisi. Istirahat {voiceSimActiveSet.restTimer} detik dimulai!"
                </Text>
              </View>
            </View>
          )}

          {mockupTab === 'fridge' && (
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>FRIDGE-TO-MACRO SMART CHEF</Text>
                  <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 2 }}>Racik Menu Presisi dari Bahan Kulkas</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' }}>
                  <Text style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: 12 }}>🍳 AI CHEF ACTIVE</Text>
                </View>
              </View>

              <Text style={{ color: '#888', fontSize: 12 }}>Pilih bahan yang tersedia di dapur kulkas Anda saat ini:</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {['3 Butir Telur', '1 Papan Tempe', '1 Centong Nasi', '150g Dada Ayam', '1 Ikat Bayam'].map((ing, idx) => {
                  const isChecked = fridgeSelectedIngredients.includes(ing);
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        if (isChecked) {
                          setFridgeSelectedIngredients(prev => prev.filter(x => x !== ing));
                        } else {
                          setFridgeSelectedIngredients(prev => [...prev, ing]);
                        }
                      }}
                      style={{
                        backgroundColor: isChecked ? '#F59E0B' : 'rgba(255,255,255,0.06)',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: isChecked ? '#F59E0B' : '#333'
                      }}
                    >
                      <Text style={{ color: isChecked ? '#000' : '#DDD', fontSize: 12, fontWeight: 'bold' }}>
                        {isChecked ? '✔ ' : '+ '}{ing}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Output Live Recipe Simulation */}
              <View style={{ backgroundColor: '#1A1305', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#F59E0B', marginTop: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: '#F59E0B', fontSize: 14, fontWeight: 'bold' }}>🍳 Tumis Tempe Telur Gurih & Nasi Hangat</Text>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>{fridgeTargetCal} kcal</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginVertical: 8 }}>
                  <Text style={{ color: '#CCFF00', fontSize: 12, fontWeight: 'bold' }}>P: 42g Protein</Text>
                  <Text style={{ color: '#60A5FA', fontSize: 12, fontWeight: 'bold' }}>C: 58g Karbo</Text>
                  <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: 'bold' }}>F: 16g Lemak</Text>
                </View>
                <Text style={{ color: '#94A3B8', fontSize: 12, lineHeight: 17 }}>
                  👨‍🍳 <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Takaran Presisi:</Text> 3 butir telur (150g), 100g tempe dipotong dadu, 1 centong nasi putih (100g). Pas memenuhi 650 kcal target makan siang!
                </Text>
              </View>
            </View>
          )}

          {mockupTab === 'heatmap' && (
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: '#CCFF00', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>CNS FATIGUE ENGINE</Text>
                  <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 2 }}>Peta Pemulihan 12 Kelompok Otot</Text>
                </View>
                <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 13 }}>Status: Optimal</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={styles.heatmapMetricBox}>
                  <Text style={{ color: '#888', fontSize: 11 }}>DADA & TRICEPS</Text>
                  <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>85% Kelelahan</Text>
                  <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>Sisa Rest: 36 Jam</Text>
                </View>
                <View style={styles.heatmapMetricBox}>
                  <Text style={{ color: '#888', fontSize: 11 }}>PUNGGUNG & BICEPS</Text>
                  <Text style={{ color: '#10B981', fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>100% Pulih</Text>
                  <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>Siap Latihan Berat</Text>
                </View>
                <View style={styles.heatmapMetricBox}>
                  <Text style={{ color: '#888', fontSize: 11 }}>KAKI (QUADS & GLUTES)</Text>
                  <Text style={{ color: '#F59E0B', fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>60% Kelelahan</Text>
                  <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>Sisa Rest: 18 Jam</Text>
                </View>
              </View>
            </View>
          )}

          {mockupTab === 'ai' && (
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: '#CCFF00', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>GOOGLE GEMINI 3.7 COACH</Text>
                  <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 2 }}>Analisis Beban & Progresi Otomatis</Text>
                </View>
              </View>

              <View style={styles.aiChatBubbleBox}>
                <Sparkles color="#CCFF00" size={18} />
                <Text style={{ color: '#DDD', fontSize: 13, flex: 1, lineHeight: 20 }}>
                  "Volume Bench Press Anda minggu ini meningkat 12% menjadi 8.400 kg. CNS fatigue pada pectorals berada di zona adaptasi optimal. Disarankan menambah 2.5 kg pada sesi berikutnya untuk progressive overload."
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ─── INTERACTIVE SECTION 1: LIVE 1-REP MAX (1RM) CALCULATOR ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <Calculator color="#CCFF00" size={14} />
            <Text style={styles.miniTagText}>SCIENTIFIC 1RM ENGINE</Text>
          </View>
          <Text style={styles.sectionHeading}>Kalkulator 1-Rep Max & Strength Tier</Text>
          <Text style={styles.sectionSub}>
            Masukkan beban dan repetisi angkatan terberat Anda untuk menghitung batas maksimal 1RM dan estimasi beban kerja persentase.
          </Text>
        </View>

        <View style={[styles.toolCard, { width: '100%', maxWidth: 880, alignSelf: 'center' }]}>
          <View style={{ flexDirection: isMedium ? 'row' : 'column', gap: 20, marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>BEBAN ANGKATAN (KG)</Text>
              <TextInput
                style={styles.textInputStyle}
                value={oneRmWeight}
                onChangeText={setOneRmWeight}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="#555"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>JUMLAH REPETISI (1 - 12)</Text>
              <TextInput
                style={styles.textInputStyle}
                value={oneRmReps}
                onChangeText={setOneRmReps}
                keyboardType="numeric"
                placeholder="5"
                placeholderTextColor="#555"
              />
            </View>
          </View>

          {/* 1RM Result Display */}
          <View style={styles.oneRmResultBanner}>
            <View>
              <Text style={{ color: '#888', fontSize: 12, letterSpacing: 1 }}>ESTIMASI 1-REP MAX (100% 1RM)</Text>
              <Text style={{ color: '#CCFF00', fontSize: 44, fontWeight: 'bold', marginTop: 4 }}>
                {estimated1RM} <Text style={{ fontSize: 20, color: '#FFF' }}>kg</Text>
              </Text>
            </View>
            <View style={styles.strengthBadge}>
              <Award color="#CCFF00" size={20} />
              <Text style={{ color: '#CCFF00', fontWeight: 'bold', fontSize: 13 }}>
                {estimated1RM >= 140 ? 'ELITE LIFTER' : estimated1RM >= 100 ? 'ADVANCED' : 'INTERMEDIATE'}
              </Text>
            </View>
          </View>

          {/* Percentage Grid */}
          <Text style={{ color: '#888', fontSize: 11, letterSpacing: 1, marginTop: 24, marginBottom: 12 }}>PERSENTASE BEBAN KERJA HARIAN:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              { pct: '95%', reps: '2 reps', val: Math.round(estimated1RM * 0.95) },
              { pct: '90%', reps: '3-4 reps', val: Math.round(estimated1RM * 0.90) },
              { pct: '85%', reps: '5-6 reps', val: Math.round(estimated1RM * 0.85) },
              { pct: '80%', reps: '7-8 reps', val: Math.round(estimated1RM * 0.80) },
              { pct: '75%', reps: '9-10 reps', val: Math.round(estimated1RM * 0.75) },
              { pct: '70%', reps: '11-12 reps', val: Math.round(estimated1RM * 0.70) },
            ].map((item, idx) => (
              <View key={idx} style={styles.pctBox}>
                <Text style={{ color: '#CCFF00', fontSize: 12, fontWeight: 'bold' }}>{item.pct} ({item.reps})</Text>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 2 }}>{item.val} kg</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ─── INTERACTIVE SECTION 2: OLYMPIC BARBELL PLATE LOADER ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <Sliders color="#CCFF00" size={14} />
            <Text style={styles.miniTagText}>PLATE LOADING SIMULATOR</Text>
          </View>
          <Text style={styles.sectionHeading}>Kalkulator Plate Barbell Olympic</Text>
          <Text style={styles.sectionSub}>
            Pilih target beban total pada Barbell Olympic 20kg untuk melihat susunan piringan beban per sisi secara visual.
          </Text>
        </View>

        <View style={[styles.toolCard, { width: '100%', maxWidth: 880, alignSelf: 'center' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {[60, 80, 100, 120, 140, 160, 180, 200, 220].map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.volPresetBtn, targetPlateWeight === w && styles.volPresetBtnActive]}
                onPress={() => setTargetPlateWeight(w)}
              >
                <Text style={[styles.volPresetText, targetPlateWeight === w && { color: '#000', fontWeight: 'bold' }]}>
                  {w} kg
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Visual Barbell Shaft */}
          <View style={styles.barbellVisualArea}>
            <Text style={{ color: '#888', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
              SUSUNAN PLATE PER SISI (BEBAN SISI: {Math.max(0, (targetPlateWeight - 20) / 2)} KG):
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 16, minHeight: 90 }}>
              <View style={styles.barbellCenterBar}>
                <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>BAR 20KG</Text>
              </View>

              {plateResult.platesPerSide.map((p, i) => (
                <View key={i} style={[styles.plateGraphic, { backgroundColor: p.color }]}>
                  <Text style={[styles.plateGraphicText, p.textColor ? { color: p.textColor } : {}]}>{p.label}</Text>
                </View>
              ))}

              <View style={styles.barbellCollar} />
            </View>

            <Text style={{ color: '#AAA', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              Total: 20kg Olympic Bar + {plateResult.platesPerSide.map(p => p.label).join(' + ') || 'Tanpa Plate'} (x2 Sisi) = <Text style={{ color: '#CCFF00', fontWeight: 'bold' }}>{targetPlateWeight} kg</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* ─── INTERACTIVE SECTION 3: TDEE & MACRO ARCHITECT ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <Scale color="#CCFF00" size={14} />
            <Text style={styles.miniTagText}>PRECISION METABOLIC ENGINE</Text>
          </View>
          <Text style={styles.sectionHeading}>Kalkulator TDEE & Target Makronutrisi</Text>
          <Text style={styles.sectionSub}>
            Hitung kebutuhan kalori harian, target gramatur protein, dan asupan hidrasi air berdasarkan data tubuh Anda.
          </Text>
        </View>

        <View style={[styles.toolCard, { width: '100%', maxWidth: 880, alignSelf: 'center' }]}>
          {/* Inputs Row */}
          <View style={{ flexDirection: isMedium ? 'row' : 'column', gap: 16, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>BERAT (KG)</Text>
              <TextInput style={styles.textInputStyle} value={tdeeWeight} onChangeText={setTdeeWeight} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>TINGGI (CM)</Text>
              <TextInput style={styles.textInputStyle} value={tdeeHeight} onChangeText={setTdeeHeight} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>UMUR (TAHUN)</Text>
              <TextInput style={styles.textInputStyle} value={tdeeAge} onChangeText={setTdeeAge} keyboardType="numeric" />
            </View>
          </View>

          {/* Goal Selector */}
          <Text style={styles.inputLabel}>TUJUAN FISIK (GOAL):</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[
              { id: 'cut', label: 'Fat Loss (Cutting -500 kcal)' },
              { id: 'maintain', label: 'Maintenance (TDEE)' },
              { id: 'bulk', label: 'Hypertrophy (Bulking +400 kcal)' }
            ].map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.goalBtn, tdeeGoal === g.id && styles.goalBtnActive]}
                onPress={() => setTdeeGoal(g.id)}
              >
                <Text style={[styles.goalBtnText, tdeeGoal === g.id && { color: '#000', fontWeight: 'bold' }]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Target Results Cards */}
          <View style={{ flexDirection: isMedium ? 'row' : 'column', gap: 12 }}>
            <View style={[styles.macroItemLarge, { borderColor: '#CCFF00' }]}>
              <Flame color="#CCFF00" size={24} style={{ marginBottom: 6 }} />
              <Text style={{ color: '#888', fontSize: 11, fontWeight: 'bold' }}>TARGET KALORI</Text>
              <Text style={{ color: '#CCFF00', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{tdeeResult.targetCals} <Text style={{ fontSize: 14 }}>kcal</Text></Text>
            </View>
            <View style={[styles.macroItemLarge, { borderColor: '#10B981' }]}>
              <Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold' }}>PROTEIN HARIAN</Text>
              <Text style={{ color: '#FFF', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{tdeeResult.proteinGrams} <Text style={{ fontSize: 14 }}>gram</Text></Text>
              <Text style={{ color: '#888', fontSize: 11, marginTop: 4 }}>~2.2g / kg berat</Text>
            </View>
            <View style={[styles.macroItemLarge, { borderColor: '#60A5FA' }]}>
              <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: 'bold' }}>KARBOHIDRAT</Text>
              <Text style={{ color: '#FFF', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{tdeeResult.carbsGrams} <Text style={{ fontSize: 14 }}>gram</Text></Text>
              <Text style={{ color: '#888', fontSize: 11, marginTop: 4 }}>Sumber energi otot</Text>
            </View>
            <View style={[styles.macroItemLarge, { borderColor: '#38BDF8' }]}>
              <Droplets color="#38BDF8" size={24} style={{ marginBottom: 6 }} />
              <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold' }}>HIDRASI AIR</Text>
              <Text style={{ color: '#FFF', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{tdeeResult.waterLiters} <Text style={{ fontSize: 14 }}>Liter</Text></Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── INTERACTIVE SECTION 4: WORKOUT SPLIT ARCHITECT ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <Compass color="#CCFF00" size={14} />
            <Text style={styles.miniTagText}>WEEKLY SPLIT ARCHITECT</Text>
          </View>
          <Text style={styles.sectionHeading}>Generator Program Latihan Mingguan</Text>
          <Text style={styles.sectionSub}>
            Pilih frekuensi hari latihan Anda dalam seminggu untuk melihat pembagian split otot dan alokasi volume yang optimal.
          </Text>

          {/* Days Selector */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            {[3, 4, 5, 6].map((days) => (
              <TouchableOpacity
                key={days}
                style={[styles.volPresetBtn, splitDays === days && styles.volPresetBtnActive]}
                onPress={() => setSplitDays(days)}
              >
                <Text style={[styles.volPresetText, splitDays === days && { color: '#000', fontWeight: 'bold' }]}>
                  {days} Hari / Minggu
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.toolCard, { width: '100%', maxWidth: 880, alignSelf: 'center' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 16 }}>
            <View>
              <Text style={{ color: '#CCFF00', fontWeight: 'bold', fontSize: 18 }}>{SPLIT_PROGRAMS[splitDays].name}</Text>
              <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{SPLIT_PROGRAMS[splitDays].tagline}</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: '#CCFF00', fontWeight: 'bold', fontSize: 12 }}>{splitDays}x Sesi Aktif</Text>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            {SPLIT_PROGRAMS[splitDays].days.map((d, i) => (
              <View key={i} style={styles.splitDayRow}>
                <View style={styles.splitDayBadge}>
                  <Text style={{ color: '#CCFF00', fontWeight: 'bold', fontSize: 12 }}>{d.day}</Text>
                </View>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', flex: 1 }}>{d.focus}</Text>
                <Text style={{ color: '#888', fontSize: 12 }}>{d.vol}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ─── INTERACTIVE SECTION 5: CARDIO HEART RATE ZONES ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <Heart color="#CCFF00" size={14} />
            <Text style={styles.miniTagText}>CARDIOVASCULAR TELEMETRY</Text>
          </View>
          <Text style={styles.sectionHeading}>Zona Detak Jantung Latihan (HR Zones)</Text>
          <Text style={styles.sectionSub}>
            Ketahui batas BPM detak jantung untuk pembakaran lemak maksimal (Zone 2) dan peningkatan kapasitas VO2 Max (Zone 5).
          </Text>
        </View>

        <View style={[styles.toolCard, { width: '100%', maxWidth: 880, alignSelf: 'center' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <Text style={styles.inputLabel}>UMUR ANDA:</Text>
            <TextInput
              style={[styles.textInputStyle, { width: 80, textAlign: 'center', height: 44, paddingVertical: 0 }]}
              value={String(userAge)}
              onChangeText={setUserAge}
              keyboardType="numeric"
            />
            <Text style={{ color: '#888', fontSize: 13 }}>Max HR Estimasi: <Text style={{ color: '#CCFF00', fontWeight: 'bold' }}>{maxHR} BPM</Text></Text>
          </View>

          <View style={{ gap: 10 }}>
            {[
              { zone: 'Zone 1 (50-60%)', bpm: `${Math.round(maxHR * 0.5)} - ${Math.round(maxHR * 0.6)} BPM`, desc: 'Active Recovery & Pemanasan', color: '#9CA3AF' },
              { zone: 'Zone 2 (60-70%)', bpm: `${Math.round(maxHR * 0.6)} - ${Math.round(maxHR * 0.7)} BPM`, desc: 'Maksimal Fat Burning & Mitokondria Base', color: '#10B981' },
              { zone: 'Zone 3 (70-80%)', bpm: `${Math.round(maxHR * 0.7)} - ${Math.round(maxHR * 0.8)} BPM`, desc: 'Kapasitas Aerobik & Daya Tahan Kardio', color: '#60A5FA' },
              { zone: 'Zone 4 (80-90%)', bpm: `${Math.round(maxHR * 0.8)} - ${Math.round(maxHR * 0.9)} BPM`, desc: 'Lactate Threshold & Stamina Lari Cepat', color: '#F59E0B' },
              { zone: 'Zone 5 (90-100%)', bpm: `${Math.round(maxHR * 0.9)} - ${maxHR} BPM`, desc: 'Maksimal VO2 Max & Sprint Interval HIIT', color: '#EF4444' }
            ].map((z, i) => (
              <View key={i} style={[styles.hrZoneRow, { borderLeftColor: z.color }]}>
                <View style={{ width: 140 }}>
                  <Text style={[styles.hrZoneTitle, { color: z.color }]}>{z.zone}</Text>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13, marginTop: 2 }}>{z.bpm}</Text>
                </View>
                <Text style={{ color: '#AAA', fontSize: 13, flex: 1 }}>{z.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ─── INTERACTIVE SIMULATOR: LIVE MUSCLE RECOVERY ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <Activity color="#CCFF00" size={14} />
            <Text style={styles.miniTagText}>INTERACTIVE TELEMETRY</Text>
          </View>
          <Text style={styles.sectionHeading}>Simulasi Peta Kelelahan Otot & CNS</Text>
          <Text style={styles.sectionSub}>
            Pilih kelompok otot di bawah ini untuk melihat bagaimana algoritma GymVault menghitung kelelahan dan waktu pemulihan optimal Anda secara real-time.
          </Text>
        </View>

        <View style={[styles.simulatorWrapper, { flexDirection: isLarge ? 'row' : 'column' }]}>
          {/* Left: Selector */}
          <View style={[styles.simSelector, { width: isLarge ? '40%' : '100%' }]}>
            {Object.keys(MUSCLE_DATA).map((key) => {
              const item = MUSCLE_DATA[key];
              const isSelected = selectedMuscle === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.simTab, isSelected && styles.simTabActive]}
                  onPress={() => setSelectedMuscle(key)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.simTabTitle, isSelected && { color: '#CCFF00' }]}>{item.name}</Text>
                    <Text style={[styles.simTabPercent, isSelected ? { color: '#CCFF00' } : { color: '#888' }]}>{item.fatigue}%</Text>
                  </View>
                  <View style={styles.simProgressBarBg}>
                    <View style={[styles.simProgressBarFill, { width: `${item.fatigue}%`, backgroundColor: item.fatigue > 80 ? '#EF4444' : item.fatigue > 50 ? '#F59E0B' : '#CCFF00' }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Right: Live Telemetry Card */}
          <View style={[styles.simDisplay, { width: isLarge ? '60%' : '100%' }]}>
            <View style={styles.telemetryCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View>
                  <Text style={styles.telemetryTitle}>{muscle.name}</Text>
                  <Text style={styles.telemetrySubtitle}>Status: {muscle.fatigue >= 80 ? 'Heavy Fatigue (Adaptation Zone)' : 'Ready for Volume'}</Text>
                </View>
                <View style={[styles.fatigueBadge, { backgroundColor: muscle.fatigue > 80 ? 'rgba(239,68,68,0.15)' : 'rgba(204,255,0,0.15)' }]}>
                  <Text style={[styles.fatigueBadgeText, { color: muscle.fatigue > 80 ? '#EF4444' : '#CCFF00' }]}>
                    {muscle.fatigue}% FATIGUE
                  </Text>
                </View>
              </View>

              <View style={styles.telemetryMetricsRow}>
                <View style={styles.metricCard}>
                  <Timer color="#CCFF00" size={20} style={{ marginBottom: 6 }} />
                  <Text style={styles.metricLabel}>WAKTU RECOVERY</Text>
                  <Text style={styles.metricVal}>{muscle.recoveryHours} Jam</Text>
                </View>
                <View style={styles.metricCard}>
                  <Zap color="#CCFF00" size={20} style={{ marginBottom: 6 }} />
                  <Text style={styles.metricLabel}>CNS STRESS</Text>
                  <Text style={styles.metricVal}>{muscle.cnsStrain}</Text>
                </View>
              </View>

              <View style={styles.exerciseBox}>
                <Text style={styles.exerciseBoxTitle}>LATIHAN TERKAIT DI DATABASE:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {muscle.exercises.map((ex, i) => (
                    <View key={i} style={styles.exTag}>
                      <Text style={styles.exTagText}>{ex}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.aiAdviceBox}>
                <Sparkles color="#CCFF00" size={16} />
                <Text style={styles.aiAdviceText}>{muscle.advice}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ─── INTERACTIVE SECTION: ADAPTIVE ENGINE (GYM VS HOME) ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <Layers color="#CCFF00" size={14} />
            <Text style={styles.miniTagText}>THE ADAPTIVE ENGINE</Text>
          </View>
          <Text style={styles.sectionHeading}>Satu Aplikasi, Dua Mode Adaptif</Text>
          <Text style={styles.sectionSub}>
            GymVault secara otomatis menyesuaikan tampilan, database latihan, dan algoritma timer berdasarkan lokasi latihan Anda.
          </Text>

          {/* Switcher Toggle */}
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, activeMode === 'gym' && styles.modeToggleBtnActive]}
              onPress={() => setActiveMode('gym')}
            >
              <Dumbbell color={activeMode === 'gym' ? '#000' : '#888'} size={18} />
              <Text style={[styles.modeToggleText, activeMode === 'gym' && { color: '#000', fontWeight: 'bold' }]}>GYM MODE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeToggleBtn, activeMode === 'home' && styles.modeToggleBtnActive]}
              onPress={() => setActiveMode('home')}
            >
              <Heart color={activeMode === 'home' ? '#000' : '#888'} size={18} />
              <Text style={[styles.modeToggleText, activeMode === 'home' && { color: '#000', fontWeight: 'bold' }]}>HOME MODE</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.modeShowcaseCard, { flexDirection: isLarge ? 'row' : 'column' }]}>
          <View style={{ flex: 1, padding: isLarge ? 40 : 24, justifyContent: 'center' }}>
            <Text style={styles.modeCardBadge}>{activeMode === 'gym' ? 'HEAVY IRON & BARBELL' : 'CALISTHENICS & HIIT'}</Text>
            <Text style={styles.modeCardTitle}>
              {activeMode === 'gym' ? 'Dominasi Beban Berat & Pro Lifter Tracking' : 'Latihan Tanpa Beban Maksimal di Rumah'}
            </Text>
            <Text style={styles.modeCardDesc}>
              {activeMode === 'gym'
                ? 'Lacak Barbell, Dumbbell, Cable, dan Machine dengan plate calculator otomatis, RPE fatigue logger, dan voice guide audio bilingual.'
                : 'Program Bodyweight, Resistance Band, dan timer interval HIIT presisi tinggi tanpa memerlukan alat gym komersial sama sekali.'}
            </Text>

            <View style={{ marginTop: 24, gap: 12 }}>
              {(activeMode === 'gym'
                ? ['Kalkulator Barbell Plate Loading Otomatis', 'RPE Rating (Rate of Perceived Exertion)', 'Rest Timer Floating Dynamic Island', 'Audio Coach Bilingual (ID / EN)']
                : ['HIIT & Tabata Interval Smart Beeper', 'Variasi Gerakan Kalistenik & Band', 'Kalori Terbakar Berdasarkan Metronom', 'Tidak Perlu Alat Gym Mahal']
              ).map((feat, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 color="#CCFF00" size={18} />
                  <Text style={{ color: '#DDD', fontSize: 14 }}>{feat}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ flex: 1, backgroundColor: '#0D0D0F', padding: 32, justifyContent: 'center', alignItems: 'center', borderLeftWidth: isLarge ? 1 : 0, borderTopWidth: !isLarge ? 1 : 0, borderColor: '#222' }}>
            <View style={styles.modeMockBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCFF00' }} />
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                  {activeMode === 'gym' ? 'SESI: CHEST & SHOULDER (RPE 9)' : 'SESI: FULL BODY HIIT (30s WORK / 15s REST)'}
                </Text>
              </View>
              <View style={styles.mockRow}>
                <Text style={{ color: '#888', fontSize: 12 }}>{activeMode === 'gym' ? 'Set 1: Barbell Bench Press' : 'Round 1: Diamond Push Up'}</Text>
                <Text style={{ color: '#CCFF00', fontWeight: 'bold' }}>{activeMode === 'gym' ? '100 kg × 8 reps' : '20 reps • 45s'}</Text>
              </View>
              <View style={styles.mockRow}>
                <Text style={{ color: '#888', fontSize: 12 }}>{activeMode === 'gym' ? 'Set 2: Overhead Barbell Press' : 'Round 2: Jump Squats'}</Text>
                <Text style={{ color: '#CCFF00', fontWeight: 'bold' }}>{activeMode === 'gym' ? '60 kg × 10 reps' : '25 reps • 45s'}</Text>
              </View>
              <View style={styles.mockRow}>
                <Text style={{ color: '#888', fontSize: 12 }}>{activeMode === 'gym' ? 'Set 3: Incline Dumbbell Fly' : 'Round 3: Mountain Climbers'}</Text>
                <Text style={{ color: '#CCFF00', fontWeight: 'bold' }}>{activeMode === 'gym' ? '28 kg × 12 reps' : '40 reps • 45s'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ─── INTERACTIVE SECTION: GEMINI AI MULTIMODAL VISION ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <Cpu color="#CCFF00" size={14} />
            <Text style={styles.miniTagText}>GOOGLE GEMINI 3.7 MULTIMODAL</Text>
          </View>
          <Text style={styles.sectionHeading}>Instant AI Nutrition & Meal Scanner</Text>
          <Text style={styles.sectionSub}>
            Pilih simulasi makanan di bawah untuk menguji kecepatan Gemini AI dalam membedah makronutrisi dan kalori secara akurat.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {FOOD_PRESETS.map((f) => {
            const isSel = selectedFood.id === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.foodChip, isSel && styles.foodChipActive]}
                onPress={() => setSelectedFood(f)}
              >
                <Text style={[styles.foodChipText, isSel && { color: '#000', fontWeight: 'bold' }]}>{f.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.foodCard, { width: '100%', maxWidth: 880, alignSelf: 'center' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View>
              <Text style={{ color: '#888', fontSize: 12, letterSpacing: 1 }}>HASIL DETEKSI GEMINI AI</Text>
              <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{selectedFood.name}</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#CCFF00' }}>
              <Text style={{ color: '#CCFF00', fontWeight: 'bold', fontSize: 22 }}>{selectedFood.calories} <Text style={{ fontSize: 13 }}>kcal</Text></Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <View style={[styles.macroItem, { borderColor: '#10B981' }]}>
              <Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold' }}>PROTEIN</Text>
              <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{selectedFood.protein}g</Text>
            </View>
            <View style={[styles.macroItem, { borderColor: '#60A5FA' }]}>
              <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: 'bold' }}>CARBS</Text>
              <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{selectedFood.carbs}g</Text>
            </View>
            <View style={[styles.macroItem, { borderColor: '#F59E0B' }]}>
              <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: 'bold' }}>FATS</Text>
              <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{selectedFood.fats}g</Text>
            </View>
          </View>

          <View style={{ backgroundColor: '#16161A', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Sparkles color="#CCFF00" size={16} />
            <Text style={{ color: '#AAA', fontSize: 13, flex: 1 }}>{selectedFood.verdict}</Text>
          </View>
        </View>
      </View>

      {/* ─── INTERACTIVE SECTION: VOLUME CALCULATOR ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <TrendingUp color="#CCFF00" size={14} />
            <Text style={styles.miniTagText}>GAMIFICATION & VIRAL SHARING</Text>
          </View>
          <Text style={styles.sectionHeading}>Strava-Style Volume Comparison</Text>
          <Text style={styles.sectionSub}>
            Berapa total volume angkatan Anda bulan ini? GymVault secara otomatis mengubah angka kg kering menjadi objek nyata yang bisa langsung dibagikan ke Instagram Story.
          </Text>
        </View>

        <View style={[styles.volumeCalcBox, { width: '100%', maxWidth: 740, alignSelf: 'center' }]}>
          <Text style={{ color: '#888', fontSize: 12, letterSpacing: 1, textAlign: 'center' }}>GESER VOLUME ANGKATAN ANDA (KG):</Text>
          <Text style={{ color: '#CCFF00', fontSize: 42, fontWeight: 'bold', textAlign: 'center', marginVertical: 12 }}>
            {volumeSlider.toLocaleString('id-ID')} <Text style={{ fontSize: 20, color: '#FFF' }}>kg</Text>
          </Text>

          {/* Quick Volume Preset Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {[5000, 15000, 25000, 50000, 100000].map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.volPresetBtn, volumeSlider === v && styles.volPresetBtnActive]}
                onPress={() => setVolumeSlider(v)}
              >
                <Text style={[styles.volPresetText, volumeSlider === v && { color: '#000', fontWeight: 'bold' }]}>
                  {(v / 1000)}k kg
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Output Card */}
          <View style={styles.volResultCard}>
            <Text style={{ color: '#FFF', fontSize: 22, fontWeight: 'bold', textAlign: 'center' }}>
              Setara Mengangkat <Text style={{ color: '#CCFF00' }}>{equiv.qty}x {equiv.item}</Text>!
            </Text>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
              Langsung generate story beresolusi tinggi 4:5 hanya dengan 1-klik di aplikasi.
            </Text>
          </View>
        </View>
      </View>

      {/* ─── PRICING MATRIX ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <Crown color="#CCFF00" size={14} />
            <Text style={styles.miniTagText}>TRANSPARENT PRICING</Text>
          </View>
          <Text style={styles.sectionHeading}>Investasi Terbaik untuk Fisik Anda</Text>
          <Text style={styles.sectionSub}>Pilih paket gratis atau nikmati AI tanpa batas via QRIS DANA 1-Click Instant Activation.</Text>
        </View>

        <View style={[styles.pricingRow, { flexDirection: isLarge ? 'row' : 'column', maxWidth: 920, alignSelf: 'center', width: '100%' }]}>
          {/* Free Tier */}
          <View style={[styles.pricingCard, { flex: 1 }]}>
            <Text style={styles.planName}>STARTER</Text>
            <Text style={styles.planPrice}>Rp 0 <Text style={styles.planPeriod}>/ selamanya</Text></Text>
            <Text style={styles.planDesc}>Semua fitur dasar pelacakan latihan & offline vault.</Text>
            
            <View style={{ gap: 12, marginVertical: 24 }}>
              {['Unlimited Workout Sessions', 'Skia 120 FPS Progress Charts', 'Offline-First Local Vault', 'Daily Check-In Scan Limits (15x AI)'].map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Check color="#CCFF00" size={16} />
                  <Text style={{ color: '#CCC', fontSize: 13 }}>{p}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.planBtnSecondary} onPress={onLoginPress}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Mulai Gratis</Text>
            </TouchableOpacity>
          </View>

          {/* Pro Tier */}
          <View style={[styles.pricingCard, styles.pricingCardPro, { flex: 1 }]}>
            <View style={styles.popularBadge}>
              <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>PALING POPULER</Text>
            </View>
            <Text style={[styles.planName, { color: '#CCFF00' }]}>PRO LIFTER</Text>
            <Text style={styles.planPrice}>Rp 29.900 <Text style={styles.planPeriod}>/ bulan</Text></Text>
            <Text style={styles.planDesc}>Akses unlimited ke Gemini 3.7 AI Coach & Instant Verifikasi.</Text>

            <View style={{ gap: 12, marginVertical: 24 }}>
              {[
                'Semua Fitur Starter',
                'Unlimited AI Meal Plan & Routine Generator',
                'Gemini 3.7 Multi-Model Reasoning AI',
                'Badge Eksklusif Pro Lifter di Global Leaderboard',
                'QRIS DANA 1-Click Instant Activation'
              ].map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Check color="#CCFF00" size={16} />
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>{p}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.planBtnPrimary} onPress={onLoginPress}>
              <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 15 }}>Upgrade ke Pro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── FAQS ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Pertanyaan Umum (FAQ)</Text>
        </View>

        <View style={{ width: '100%', maxWidth: 880, alignSelf: 'center', gap: 12 }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.faqCard}
                onPress={() => setOpenFaq(isOpen ? null : idx)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.faqQ}>{faq.q}</Text>
                  {isOpen ? <ChevronUp color="#CCFF00" size={20} /> : <ChevronDown color="#888" size={20} />}
                </View>
                {isOpen && (
                  <Text style={styles.faqA}>{faq.a}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── FOOTER ─── */}
      <View style={[styles.footer, { paddingHorizontal: isLarge ? 80 : 24 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Dumbbell color="#CCFF00" size={24} />
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>GYMVAULT</Text>
        </View>
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} GymVault Inc. Engineered by Dhani078. All Rights Reserved.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(204,255,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.3)',
  },
  logoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  logoTagline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    color: '#CCFF00',
    letterSpacing: 2,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#AAA',
    fontSize: 12,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#CCFF00',
    borderRadius: 100,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loginBtnText: {
    fontFamily: 'Inter_700Bold',
    color: '#000000',
    fontSize: 14,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 80,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    marginBottom: 24,
  },
  badgeText: {
    color: '#CCFF00',
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 24,
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 36,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 60,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#CCFF00',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  primaryCtaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#000000',
  },
  statsRow: {
    backgroundColor: '#0E0E10',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#CCFF00',
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#222',
  },
  sectionContainer: {
    marginBottom: 100,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  miniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204,255,0,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
    marginBottom: 12,
  },
  miniTagText: {
    color: '#CCFF00',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  sectionHeading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    maxWidth: 640,
    lineHeight: 22,
  },
  mockupTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16161A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  mockupTabBtnActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  mockupTabBtnText: {
    color: '#888',
    fontSize: 13,
  },
  mockupDisplayCard: {
    backgroundColor: '#0F0F12',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#222',
  },
  loggerSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161A',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 12,
  },
  checkPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CCFF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapMetricBox: {
    flex: 1,
    backgroundColor: '#16161A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  aiChatBubbleBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(204,255,0,0.06)',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
  },
  toolCard: {
    backgroundColor: '#0F0F12',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#222',
  },
  inputLabel: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInputStyle: {
    backgroundColor: '#16161A',
    color: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  oneRmResultBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16161A',
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333',
    flexWrap: 'wrap',
    gap: 16,
  },
  strengthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(204,255,0,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.3)',
  },
  pctBox: {
    backgroundColor: '#16161A',
    borderRadius: 12,
    padding: 14,
    flex: 1,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  barbellVisualArea: {
    backgroundColor: '#141418',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  barbellCenterBar: {
    width: 90,
    height: 18,
    backgroundColor: '#888',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateGraphic: {
    width: 22,
    height: 70,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  plateGraphicText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFF',
    transform: [{ rotate: '-90deg' }],
  },
  barbellCollar: {
    width: 14,
    height: 36,
    backgroundColor: '#444',
    borderRadius: 4,
  },
  goalBtn: {
    flex: 1,
    backgroundColor: '#16161A',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  goalBtnActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  goalBtnText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  macroItemLarge: {
    flex: 1,
    backgroundColor: '#16161A',
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  splitDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161A',
    padding: 16,
    borderRadius: 14,
    gap: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  splitDayBadge: {
    backgroundColor: 'rgba(204,255,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hrZoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161A',
    padding: 16,
    borderRadius: 14,
    gap: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  hrZoneTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  simulatorWrapper: {
    backgroundColor: '#0F0F12',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
    gap: 24,
    padding: 24,
  },
  simSelector: {
    gap: 10,
  },
  simTab: {
    backgroundColor: '#16161A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  simTabActive: {
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderColor: '#CCFF00',
  },
  simTabTitle: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  simTabPercent: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  simProgressBarBg: {
    height: 6,
    backgroundColor: '#222',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  simProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  simDisplay: {
    justifyContent: 'center',
  },
  telemetryCard: {
    backgroundColor: '#18181C',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  telemetryTitle: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  telemetrySubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  fatigueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fatigueBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  telemetryMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#101014',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  metricLabel: {
    color: '#888',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  metricVal: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  exerciseBox: {
    backgroundColor: '#121216',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  exerciseBoxTitle: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  exTag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exTagText: {
    color: '#DDD',
    fontSize: 11,
  },
  aiAdviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
  },
  aiAdviceText: {
    color: '#CCFF00',
    fontSize: 12,
    flex: 1,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#16161A',
    borderRadius: 100,
    padding: 6,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginTop: 24,
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  modeToggleBtnActive: {
    backgroundColor: '#CCFF00',
  },
  modeToggleText: {
    color: '#888',
    fontSize: 13,
  },
  modeShowcaseCard: {
    backgroundColor: '#121216',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  modeCardBadge: {
    color: '#CCFF00',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  modeCardTitle: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  modeCardDesc: {
    color: '#888',
    fontSize: 14,
    lineHeight: 22,
  },
  modeMockBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  mockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  foodChip: {
    backgroundColor: '#16161A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  foodChipActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  foodChipText: {
    color: '#888',
    fontSize: 13,
  },
  foodCard: {
    backgroundColor: '#101014',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  macroItem: {
    flex: 1,
    backgroundColor: '#18181C',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
  },
  volumeCalcBox: {
    backgroundColor: '#101014',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  volPresetBtn: {
    backgroundColor: '#18181C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  volPresetBtnActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  volPresetText: {
    color: '#888',
    fontSize: 13,
  },
  volResultCard: {
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  pricingRow: {
    gap: 24,
  },
  pricingCard: {
    backgroundColor: '#101014',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    position: 'relative',
  },
  pricingCardPro: {
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204,255,0,0.03)',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#CCFF00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planName: {
    color: '#888',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  planPrice: {
    color: '#FFF',
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    marginVertical: 10,
  },
  planPeriod: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  planDesc: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  planBtnSecondary: {
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  planBtnPrimary: {
    backgroundColor: '#CCFF00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  faqCard: {
    backgroundColor: '#101014',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  faqQ: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    flex: 1,
    paddingRight: 12,
  },
  faqA: {
    color: '#888',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    flexWrap: 'wrap',
    gap: 16,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
});
