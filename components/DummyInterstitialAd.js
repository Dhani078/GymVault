import React, { useEffect, useState, useCallback, useRef } from 'react';

// Coba import AdMob — kalau gagal (Expo Go / Web), pakai dummy
let InterstitialAd, AdEventType, adUnitIds;
let isAdMobAvailable = false;

try {
  const admob = require('react-native-google-mobile-ads');
  InterstitialAd = admob.InterstitialAd;
  AdEventType = admob.AdEventType;
  adUnitIds = require('../config/ads').adUnitIds;
  isAdMobAvailable = true;
} catch (e) {
  isAdMobAvailable = false;
}

// Buat instance di luar hook (hanya jika AdMob tersedia)
let interstitial = null;
if (isAdMobAvailable && InterstitialAd) {
  interstitial = InterstitialAd.createForAdRequest(adUnitIds.interstitial, {
    requestNonPersonalizedAdsOnly: true,
  });
}

export default function useInterstitialAd() {
  const [loaded, setLoaded] = useState(false);
  const onClosedCallbackRef = useRef(null);

  useEffect(() => {
    if (!isAdMobAvailable || !interstitial) return;

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      if (onClosedCallbackRef.current) {
        onClosedCallbackRef.current();
        onClosedCallbackRef.current = null;
      }
      interstitial.load();
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('Interstitial Ad Error:', error);
      setLoaded(false);
    });

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  const showAd = useCallback((onClosedCallback) => {
    if (!isAdMobAvailable || !interstitial) {
      // AdMob tidak tersedia (Expo Go), langsung panggil callback
      if (onClosedCallback) onClosedCallback();
      return false;
    }
    if (loaded) {
      onClosedCallbackRef.current = onClosedCallback || null;
      interstitial.show();
      return true;
    }
    return false;
  }, [loaded]);

  return { isLoaded: loaded, showAd };
}
