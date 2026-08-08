import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Dumbbell, Activity, Cpu, ShieldCheck } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LandingPage({ onLoginPress }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Dumbbell color="#CCFF00" size={32} />
          <Text style={styles.logoText}>GYMVAULT</Text>
        </View>
        <TouchableOpacity style={styles.loginBtn} onPress={onLoginPress} activeOpacity={0.8}>
          <Text style={styles.loginBtnText}>Masuk / Login</Text>
        </TouchableOpacity>
      </View>

      {/* HERO SECTION */}
      <View style={styles.heroSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ELITE FITNESS ENGINE 2.0</Text>
        </View>
        <Text style={styles.heroTitle}>
          Train Like A <Text style={{ color: '#CCFF00' }}>Machine.</Text>{'\n'}
          Recover Like A <Text style={{ color: '#CCFF00' }}>Pro.</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          GymVault adalah platform pelacakan kebugaran tingkat lanjut dengan AI Meal Planner, 
          Mesin Pemulihan Otot SVG, dan kapabilitas Offline-Sync tanpa batas.
        </Text>
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.primaryCta} onPress={onLoginPress} activeOpacity={0.8}>
            <Text style={styles.primaryCtaText}>Buka Web App</Text>
          </TouchableOpacity>
          <View style={styles.secondaryCta}>
            <Text style={styles.secondaryCtaText}>Tersedia untuk Mobile PWA & Desktop</Text>
          </View>
        </View>
      </View>

      {/* BENTO GRID FEATURES */}
      <View style={styles.featuresSection}>
        <View style={[styles.bentoCard, styles.cardLarge]}>
          <Activity color="#CCFF00" size={48} style={{ marginBottom: 20 }} />
          <Text style={styles.cardTitle}>Dynamic Muscle Fatigue</Text>
          <Text style={styles.cardDesc}>
            Algoritma visual kami memetakan kelelahan otot Anda pada peta anatomi 2D. 
            Sistem membaca data latihan Anda dan secara otomatis menghitung waktu pemulihan hingga 100%.
          </Text>
        </View>

        <View style={[styles.bentoCard, styles.cardMedium]}>
          <ShieldCheck color="#CCFF00" size={48} style={{ marginBottom: 20 }} />
          <Text style={styles.cardTitle}>Offline-First Auto Sync</Text>
          <Text style={styles.cardDesc}>
            Latihan di gym tanpa sinyal? Tidak masalah. GymVault menyimpan sesi Anda 
            ke dalam brankas lokal dan menyinkronkannya otomatis ke server Supabase saat online.
          </Text>
        </View>

        <View style={[styles.bentoCard, styles.cardMedium]}>
          <Cpu color="#CCFF00" size={48} style={{ marginBottom: 20 }} />
          <Text style={styles.cardTitle}>AI Nutrition Planner</Text>
          <Text style={styles.cardDesc}>
            Didukung oleh Gemini AI. Hasilkan rencana makan spesifik berdasarkan tinggi, berat, 
            dan target Anda dalam hitungan detik.
          </Text>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} GymVault. The Adaptive Engine.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width > 1024 ? 120 : 40,
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  logoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  loginBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#111111',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#333333',
  },
  loginBtnText: {
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    fontSize: 14,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 80,
    marginBottom: 100,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    marginBottom: 30,
  },
  badgeText: {
    color: '#CCFF00',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 2,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: width > 768 ? 72 : 48,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: width > 768 ? 80 : 56,
    letterSpacing: -2,
    marginBottom: 30,
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#888888',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 28,
    marginBottom: 50,
  },
  ctaContainer: {
    alignItems: 'center',
    gap: 16,
  },
  primaryCta: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 48,
    paddingVertical: 20,
    borderRadius: 100,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  primaryCtaText: {
    color: '#000000',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  secondaryCtaText: {
    color: '#555555',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  featuresSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: width > 1024 ? 120 : 40,
    gap: 24,
    maxWidth: 1400,
    alignSelf: 'center',
  },
  bentoCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 30,
    padding: 40,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  cardLarge: {
    width: '100%',
  },
  cardMedium: {
    width: width > 1024 ? '48%' : '100%',
    flexGrow: 1,
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  cardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#888888',
    lineHeight: 26,
  },
  footer: {
    marginTop: 100,
    alignItems: 'center',
    paddingVertical: 40,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  footerText: {
    color: '#444444',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  }
});
