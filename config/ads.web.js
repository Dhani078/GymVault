// Test IDs dari Google (untuk development agar akun tidak di-banned)
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

// Hardcoded test IDs as fallback for Web where native module doesn't exist
const TestIds = {
  BANNER: TEST_BANNER_ID,
  INTERSTITIAL: TEST_INTERSTITIAL_ID,
  REWARDED: TEST_REWARDED_ID,
};

export const adUnitIds = {
  banner: TestIds.BANNER,
  interstitial: TestIds.INTERSTITIAL,
  rewarded: TestIds.REWARDED,
};
