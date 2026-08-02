import { Platform } from 'react-native';

// ID Iklan Asli milik akun GymVault (Dhani078)
const ANDROID_BANNER_ID = 'ca-app-pub-4822166160113924/4326018111';
const ANDROID_INTERSTITIAL_ID = 'ca-app-pub-4822166160113924/5787419383';
const ANDROID_REWARDED_ID = 'ca-app-pub-4822166160113924/2207001099';

// ID Iklan iOS khusus akun GymVault (Dhani078)
const IOS_BANNER_ID = 'ca-app-pub-4822166160113924/3572598820';
const IOS_INTERSTITIAL_ID = 'ca-app-pub-4822166160113924/7259582452';
const IOS_REWARDED_ID = 'ca-app-pub-4822166160113924/3320337445';

// Pilih ID Asli berdasarkan Platform
const REAL_BANNER_ID = Platform.OS === 'ios' ? IOS_BANNER_ID : ANDROID_BANNER_ID;
const REAL_INTERSTITIAL_ID = Platform.OS === 'ios' ? IOS_INTERSTITIAL_ID : ANDROID_INTERSTITIAL_ID;
const REAL_REWARDED_ID = Platform.OS === 'ios' ? IOS_REWARDED_ID : ANDROID_REWARDED_ID;

// Test IDs dari Google (untuk development agar akun tidak di-banned)
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

// Coba import TestIds dari AdMob, fallback ke hardcoded test IDs
let TestIds;
try {
  TestIds = require('react-native-google-mobile-ads').TestIds;
} catch (e) {
  // Jika react-native-google-mobile-ads tidak tersedia (Expo Go / Web),
  // gunakan hardcoded test IDs sebagai fallback
  TestIds = {
    BANNER: TEST_BANNER_ID,
    INTERSTITIAL: TEST_INTERSTITIAL_ID,
    REWARDED: TEST_REWARDED_ID,
  };
}

// Saat mode pengembangan (__DEV__), selalu gunakan TestIds resmi dari Google.
// Meng-klik atau menampilkan iklan asli pada HP sendiri dapat menyebabkan akun AdMob di-banned.
export const adUnitIds = {
  banner: __DEV__ ? TestIds.BANNER : REAL_BANNER_ID,
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : REAL_INTERSTITIAL_ID,
  rewarded: __DEV__ ? TestIds.REWARDED : REAL_REWARDED_ID,
};
