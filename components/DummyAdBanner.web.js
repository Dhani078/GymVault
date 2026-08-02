import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// Google AdSense Publisher ID dari Dashboard Anda
const ADSENSE_PUB_ID = 'ca-pub-4822166160113924';

export default function DummyAdBanner() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // 1. Inject Google AdSense script ke head jika belum ada
      if (!document.getElementById('google-adsense-script')) {
        const script = document.createElement('script');
        script.id = 'google-adsense-script';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      // 2. Trigger adsbygoogle push untuk memuat iklan AdSense
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // Ignored if adblock or initializing
      }
    }
  }, []);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.container}>
      <div style={{ width: '100%', maxWidth: '468px', margin: '0 auto', textAlign: 'center', minHeight: '50px' }}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_PUB_ID}
          data-ad-slot="auto"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
});
