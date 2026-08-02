import React, { useState, useCallback } from 'react';

export default function useRewardedAd() {
  const [loaded] = useState(false);

  const showAd = useCallback((onRewardCallback) => {
    // AdMob tidak tersedia di web, langsung kasih reward
    if (onRewardCallback) onRewardCallback();
    return true; // Pura-pura sukses di dev mode
  }, []);

  return { isLoaded: loaded, showAd };
}
