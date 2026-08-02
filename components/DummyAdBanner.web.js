import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

const ADSENSE_PUB_ID = 'ca-pub-4822166160113924';

export default function DummyAdBanner() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (!document.getElementById('google-adsense-script')) {
          const script = document.createElement('script');
          script.id = 'google-adsense-script';
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`;
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // Ignored
      }
    }
  }, []);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.container}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: '50px', textAlign: 'center' }}
        data-ad-client={ADSENSE_PUB_ID}
        data-ad-slot="auto"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
});
