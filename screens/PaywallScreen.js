import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Image, Modal, Alert, TextInput, Linking } from 'react-native';
import { Check, Crown, Zap, Star, Shield, X, CreditCard, QrCode, Copy, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, theme, styles } from '../theme';
import GymVaultLogo from '../components/GymVaultLogo';
import SmoothScrollView from '../components/SmoothScrollView';

// ═══════════════════════════════════════════════════════════
// 🔴 CONFIG: Ganti dengan data DANA Merchant Anda
// ═══════════════════════════════════════════════════════════
const DANA_CONFIG = {
  merchantName: 'GymVault Premium',
  // Ganti URL ini dengan link gambar QR DANA Merchant Anda
  // Upload QR ke imgur.com atau hosting lain, lalu paste URL-nya
  qrImageUrl: '', // Contoh: 'https://i.imgur.com/xxxxx.png'
  // Atau gunakan deep link DANA (opsional)
  danaDeepLink: '', // Contoh: 'https://link.dana.id/qr/xxxxx'
};

const PLANS = [
  { id: 'monthly', label: 'Bulanan', price: 'Rp 29.900', priceNum: 29900, period: '/bulan', popular: false },
  { id: 'yearly', label: 'Tahunan', price: 'Rp 199.900', priceNum: 199900, period: '/tahun', popular: true, save: 'Hemat 44%' },
];

const FEATURES = [
  { icon: Zap, text: 'Unlimited Custom Routines', desc: 'Buat routine tanpa batas' },
  { icon: Star, text: 'AI Coach Tanpa Limit', desc: 'Tanya apa saja ke AI assistant' },
  { icon: Shield, text: 'Advanced Analytics', desc: 'Grafik & progress tracking lengkap' },
  { icon: Crown, text: 'Priority Support', desc: 'Bantuan eksklusif & fitur baru pertama' },
];

export default function PaywallScreen({ onSkip, session }) {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [showPayment, setShowPayment] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkPremium();
  }, [session]);

  const checkPremium = async () => {
    const userId = session?.user?.id || 'guest';
    const status = await AsyncStorage.getItem(`@premium_status_${userId}`);
    if (status === 'active') setIsPremium(true);
  };

  const handleSubscribe = () => {
    setShowPayment(true);
  };

  const handleOpenDANA = async () => {
    if (DANA_CONFIG.danaDeepLink) {
      try {
        await Linking.openURL(DANA_CONFIG.danaDeepLink);
      } catch (e) {
        Alert.alert('DANA tidak ditemukan', 'Pastikan aplikasi DANA sudah terinstall.');
      }
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionId.trim()) {
      Alert.alert('ID Transaksi Kosong', 'Masukkan 4 digit terakhir ID transaksi DANA Anda sebagai bukti pembayaran.');
      return;
    }

    const userId = session?.user?.id || 'guest';

    // Save premium status locally
    const premiumData = {
      status: 'active',
      plan: selectedPlan,
      activatedAt: new Date().toISOString(),
      txRef: transactionId.trim(),
    };
    await AsyncStorage.setItem(`@premium_status_${userId}`, 'active');
    await AsyncStorage.setItem(`@premium_data_${userId}`, JSON.stringify(premiumData));

    // Also sync the secondary keys used by other modals
    const premiumUntil = new Date();
    if (selectedPlan === 'yearly') {
      premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
    } else {
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);
    }
    await AsyncStorage.setItem(`is_premium_${userId}`, 'true');
    await AsyncStorage.setItem(`premium_until_${userId}`, premiumUntil.toISOString());
    await AsyncStorage.setItem(`premium_since_${userId}`, new Date().toISOString());

    // Also save to Supabase if session exists (for cross-device sync)
    if (session?.user) {
      try {
        const { supabase } = require('../supabaseClient');
        await supabase.from('users_profile').upsert({
          id: session.user.id,
          is_premium: true,
          premium_plan: selectedPlan,
          premium_activated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn('[Paywall] Supabase sync failed:', e.message);
      }
    }

    setShowPayment(false);
    setShowConfirm(false);
    setIsPremium(true);
    Alert.alert('🎉 Premium Aktif!', 'Selamat! Semua fitur premium sudah terbuka.', [
      { text: 'Mulai Sekarang!', onPress: onSkip }
    ]);
  };

  // Already premium → skip
  if (isPremium) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <GymVaultLogo size={90} />
        <AppText weight="bold" style={{ fontSize: 24, marginBottom: 8, marginTop: 24 }}>You're Premium! 👑</AppText>
        <AppText style={{ color: theme.colors.textMuted, textAlign: 'center', marginBottom: 32 }}>Semua fitur sudah aktif.</AppText>
        <TouchableOpacity style={[styles.btnPrimary, { width: '100%' }]} onPress={onSkip}>
          <AppText weight="bold" style={styles.btnPrimaryText}>Masuk ke App</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const plan = PLANS.find(p => p.id === selectedPlan);

  return (
    <SmoothScrollView style={styles.screen} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 28, marginTop: 12 }}>
        <GymVaultLogo size={80} />
        <AppText weight="bold" style={{ fontSize: 26, textAlign: 'center', letterSpacing: -0.5, marginTop: 20 }}>
          Upgrade ke Premium
        </AppText>
        <AppText style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
          Buka semua fitur dan latih tanpa batas
        </AppText>
      </View>

      {/* Features */}
      <View style={{ backgroundColor: theme.colors.card, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border }}>
        {FEATURES.map((f, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i < FEATURES.length - 1 ? 18 : 0 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(204,255,0,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
              <f.icon color={theme.colors.primary} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="bold" style={{ fontSize: 14 }}>{f.text}</AppText>
              <AppText style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 1 }}>{f.desc}</AppText>
            </View>
            <Check color="#10B981" size={18} />
          </View>
        ))}
      </View>

      {/* Plan Selector */}
      <View style={{ gap: 10, marginBottom: 24 }}>
        {PLANS.map(p => {
          const isSelected = selectedPlan === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.8}
              onPress={() => setSelectedPlan(p.id)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                padding: 16, borderRadius: 14,
                backgroundColor: isSelected ? 'rgba(204,255,0,0.06)' : theme.colors.card,
                borderWidth: 1.5,
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              }}
            >
              {/* Radio */}
              <View style={{
                width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                borderColor: isSelected ? theme.colors.primary : '#333',
                justifyContent: 'center', alignItems: 'center', marginRight: 14,
              }}>
                {isSelected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.primary }} />}
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AppText weight="bold" style={{ fontSize: 16 }}>{p.label}</AppText>
                  {p.popular && (
                    <View style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <AppText weight="bold" style={{ fontSize: 9, color: '#000' }}>BEST VALUE</AppText>
                    </View>
                  )}
                </View>
                {p.save && <AppText style={{ fontSize: 12, color: '#10B981', marginTop: 2 }}>{p.save}</AppText>}
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <AppText weight="bold" style={{ fontSize: 18, color: isSelected ? theme.colors.primary : theme.colors.text }}>{p.price}</AppText>
                <AppText style={{ fontSize: 11, color: theme.colors.textMuted }}>{p.period}</AppText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 16,
          flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
          shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
        }}
        onPress={handleSubscribe}
      >
        <CreditCard color="#000" size={20} />
        <AppText weight="bold" style={{ color: '#000', fontSize: 16 }}>Bayar via DANA ({plan?.price})</AppText>
      </TouchableOpacity>

      <AppText style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 12, fontSize: 11, lineHeight: 16 }}>
        Pembayaran aman via DANA. Hubungi support jika ada kendala.
      </AppText>

      {/* Skip */}
      <TouchableOpacity style={{ marginTop: 24, alignItems: 'center', paddingVertical: 12 }} onPress={onSkip}>
        <AppText weight="medium" style={{ color: theme.colors.textMuted, fontSize: 14 }}>Nanti saja, pakai versi gratis</AppText>
      </TouchableOpacity>

      {/* ═══ Payment Modal ═══ */}
      <Modal visible={showPayment} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%', borderWidth: 1, borderColor: theme.colors.border }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View>
                  <AppText weight="bold" style={{ fontSize: 20, color: theme.colors.text }}>Pembayaran DANA</AppText>
                  <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{plan?.label} - {plan?.price}</AppText>
                </View>
                <TouchableOpacity onPress={() => setShowPayment(false)} style={{ padding: 4 }}>
                  <X color={theme.colors.textMuted} size={24} />
                </TouchableOpacity>
              </View>

              {/* QR Code Section */}
              <View style={{
                backgroundColor: '#FFF', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20,
              }}>
                {DANA_CONFIG.qrImageUrl ? (
                  <Image source={{ uri: DANA_CONFIG.qrImageUrl }} style={{ width: 220, height: 220, borderRadius: 8 }} resizeMode="contain" />
                ) : (
                  <View style={{ width: 220, height: 220, borderRadius: 12, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#DDD', borderStyle: 'dashed' }}>
                    <QrCode color="#1A8CFF" size={64} />
                    <AppText weight="bold" style={{ color: '#333', fontSize: 14, marginTop: 12 }}>QR DANA</AppText>
                    <AppText style={{ color: '#999', fontSize: 11, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>
                      Set qrImageUrl di PaywallScreen.js
                    </AppText>
                  </View>
                )}
                <AppText weight="bold" style={{ color: '#1A8CFF', fontSize: 16, marginTop: 12 }}>
                  {DANA_CONFIG.merchantName}
                </AppText>
              </View>

              {/* Instructions */}
              <View style={{ backgroundColor: theme.colors.card, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border }}>
                <AppText weight="bold" style={{ fontSize: 14, marginBottom: 12, color: theme.colors.text }}>Cara Bayar:</AppText>
                {[
                  'Buka aplikasi DANA di HP Anda',
                  'Tap "Scan" dan arahkan ke QR di atas',
                  `Masukkan nominal: ${plan?.price}`,
                  'Selesaikan pembayaran',
                  'Catat 4 digit terakhir ID Transaksi',
                ].map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(204,255,0,0.12)', justifyContent: 'center', alignItems: 'center', marginTop: 1 }}>
                      <AppText weight="bold" style={{ fontSize: 11, color: theme.colors.primary }}>{i + 1}</AppText>
                    </View>
                    <AppText style={{ color: theme.colors.text, fontSize: 13, flex: 1, lineHeight: 18 }}>{step}</AppText>
                  </View>
                ))}
              </View>

              {/* Open DANA Button */}
              {DANA_CONFIG.danaDeepLink ? (
                <TouchableOpacity
                  style={{ backgroundColor: '#1A8CFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                  onPress={handleOpenDANA}
                >
                  <AppText weight="bold" style={{ color: '#FFF', fontSize: 15 }}>Buka Aplikasi DANA</AppText>
                </TouchableOpacity>
              ) : null}

              {/* Confirm Payment */}
              <TouchableOpacity
                style={{ backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={() => setShowConfirm(true)}
              >
                <CheckCircle color="#FFF" size={18} />
                <AppText weight="bold" style={{ color: '#FFF', fontSize: 15 }}>Saya Sudah Bayar</AppText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══ Confirm Modal ═══ */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.colors.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
            <AppText weight="bold" style={{ fontSize: 18, marginBottom: 8, color: theme.colors.text }}>Konfirmasi Pembayaran</AppText>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 20, lineHeight: 18 }}>
              Masukkan 4 digit terakhir ID Transaksi DANA Anda sebagai verifikasi.
            </AppText>

            <View style={{ backgroundColor: theme.colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16, marginBottom: 20 }}>
              <TextInput
                style={{ color: theme.colors.text, fontSize: 20, paddingVertical: 16, textAlign: 'center', letterSpacing: 8 }}
                placeholder="• • • •"
                placeholderTextColor={theme.colors.textMuted}
                value={transactionId}
                onChangeText={(t) => setTransactionId(t.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setShowConfirm(false)}
              >
                <AppText weight="bold" style={{ color: theme.colors.textMuted }}>Batal</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}
                onPress={handleConfirmPayment}
              >
                <AppText weight="bold" style={{ color: '#FFF' }}>Aktivasi Premium</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SmoothScrollView>
  );
}
