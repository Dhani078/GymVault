export const MUSCLE_DATA = {
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

export const FOOD_PRESETS = [
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

export const SPLIT_PROGRAMS = {
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

export const FAQS = [
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
