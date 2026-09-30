import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, ArrowRight } from 'lucide-react-native';

export default function LandingHero({ onLoginPress, styles, isLarge, isMedium }) {
  return (
    <View style={[styles.heroSection, { paddingHorizontal: isLarge ? 80 : 20 }]}>
      <View style={styles.badge}>
        <Sparkles color="#D4F53C" size={14} />
        <Text style={styles.badgeText}>GYMVAULT FITNESS PLATFORM 2.0</Text>
      </View>

      <Text style={[styles.heroTitle, { fontSize: isLarge ? 64 : isMedium ? 44 : 32, lineHeight: isLarge ? 74 : isMedium ? 52 : 40 }]}>
        ENGINEERED FOR{'\n'}
        <Text style={{ color: '#D4F53C', fontWeight: '600', letterSpacing: 1 }}>PRECISION TRAINING.</Text>
      </Text>

      <Text style={[styles.heroSubtitle, { maxWidth: isLarge ? 760 : 600 }]}>
        Platform pencatat latihan dengan pelacakan performa, recovery analysis, dan insight berbasis data. Dirancang untuk hasil nyata.
      </Text>

      {/* Hero CTAs */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.primaryCta} onPress={onLoginPress} activeOpacity={0.8}>
          <Text style={styles.primaryCtaText}>Mulai Latihan Sekarang (Gratis)</Text>
          <ArrowRight color="#000" size={18} />
        </TouchableOpacity>
      </View>

      {/* Telemetry Highlights */}
      <View style={[styles.statsRow, { flexDirection: isMedium ? 'row' : 'column', width: '100%', maxWidth: 940 }]}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>0.02s</Text>
          <Text style={styles.statLabel}>Skia GPU Render Latency</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>100%</Text>
          <Text style={styles.statLabel}>Offline-First Local Vault</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>Gemini 3.7</Text>
          <Text style={styles.statLabel}>Multimodal Vision AI</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>1-Click</Text>
          <Text style={styles.statLabel}>Instant QRIS Activation</Text>
        </View>
      </View>
    </View>
  );
}
