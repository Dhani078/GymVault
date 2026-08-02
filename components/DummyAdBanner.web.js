import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

const ADSENSE_PUB_ID = 'ca-pub-4822166160113924';

export default function DummyAdBanner() {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
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
          setHasError(true);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  if (Platform.OS !== 'web' || hasError) return null;

  return (
    <View style={styles.container}>
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '100%', height: '50px' }}
        data-ad-client={ADSENSE_PUB_ID}
        data-ad-format="horizontal"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
