import React, { useEffect, useState, useCallback, useRef } from 'react';

// Coba import AdMob — kalau gagal (Expo Go / Web), pakai dummy
let RewardedAd, RewardedAdEventType, AdEventType, adUnitIds;
let isAdMobAvailable = false;

try {
  const admob = require('react-native-google-mobile-ads');
  RewardedAd = admob.RewardedAd;
  RewardedAdEventType = admob.RewardedAdEventType;
  AdEventType = admob.AdEventType;
  adUnitIds = require('../config/ads').adUnitIds;
  isAdMobAvailable = true;
} catch (e) {
  isAdMobAvailable = false;
}

// Buat instance di luar hook (hanya jika AdMob tersedia)
let rewarded = null;
if (isAdMobAvailable && RewardedAd) {
  rewarded = RewardedAd.createForAdRequest(adUnitIds.rewarded, {
    requestNonPersonalizedAdsOnly: true,
  });
}

export default function useRewardedAd() {
  const [loaded, setLoaded] = useState(false);
  const onRewardCallbackRef = useRef(null);

  useEffect(() => {
    if (!isAdMobAvailable || !rewarded) return;

    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
    });

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        if (onRewardCallbackRef.current) {
          onRewardCallbackRef.current();
          onRewardCallbackRef.current = null;
        }
      },
    );

    const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      rewarded.load();
    });

    const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('Rewarded Ad Error:', error);
      setLoaded(false);
    });

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  const showAd = useCallback((onRewardCallback) => {
    if (!isAdMobAvailable || !rewarded) {
      // AdMob tidak tersedia (Expo Go), langsung kasih reward
      if (onRewardCallback) onRewardCallback();
      return true; // Pura-pura sukses di dev mode
    }
    if (loaded) {
      onRewardCallbackRef.current = onRewardCallback || null;
      rewarded.show();
      return true;
    }
    return false;
  }, [loaded]);

  return { isLoaded: loaded, showAd };
}
