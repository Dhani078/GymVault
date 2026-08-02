import React, { useState, useCallback } from 'react';

export default function useInterstitialAd() {
  const [loaded] = useState(false);

  const showAd = useCallback((onClosedCallback) => {
    // AdMob tidak tersedia di web, langsung panggil callback
    if (onClosedCallback) onClosedCallback();
    return false;
  }, []);

  return { isLoaded: loaded, showAd };
}
