import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { AppText, theme } from '../theme';

// Coba import AdMob — kalau gagal (Expo Go / Web), pakai dummy
let BannerAd, BannerAdSize, adUnitIds;
let isAdMobAvailable = false;

try {
  const admob = require('react-native-google-mobile-ads');
  BannerAd = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
  adUnitIds = require('../config/ads').adUnitIds;
  isAdMobAvailable = true;
} catch (e) {
  // react-native-google-mobile-ads tidak tersedia (Expo Go / Web)
  isAdMobAvailable = false;
}

export default function DummyAdBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || !isAdMobAvailable || !BannerAd) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.adWrapper}>
        <BannerAd
          unitId={adUnitIds.banner}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdFailedToLoad={(error) => {

            setIsVisible(false);
          }}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.closeBtn} 
        onPress={() => setIsVisible(false)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={16} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingTop: 8,
    paddingBottom: 8,
  },
  adWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 2,
    zIndex: 10,
  },
  dummyBanner: {
    height: 50,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  dummyText: {
    color: '#6B7280',
    fontSize: 12,
  },
});
