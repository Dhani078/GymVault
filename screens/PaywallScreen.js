import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { Check, Crown, Zap, Star, Shield, X, CreditCard, QrCode, Upload, CheckCircle, Clock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, theme, styles } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import GymVaultLogo from '../components/GymVaultLogo';
import SmoothScrollView from '../components/SmoothScrollView';
import { supabase } from '../supabaseClient';

const DANA_CONFIG = {
  merchantName: 'GymVault QRIS DANA',
  // Masukkan link QRIS DANA Anda jika ada, atau biarkan default
  qrImageUrl: '',
};

const PLANS = [
  { id: 'monthly', label: 'Bulanan', price: 'Rp 29.900', priceNum: 29900, period: '/bulan', popular: false },
  { id: 'yearly', label: 'Tahunan', price: 'Rp 199.900', priceNum: 199900, period: '/tahun', popular: true, save: 'Hemat 44%' },
];

const FEATURES = [
  { icon: Zap, text: 'Unlimited Custom Routines', desc: 'Buat routine latihan tanpa batas' },
  { icon: Star, text: 'AI Coach & Meal Plan Unlimited', desc: 'Konsultasi dan scan makanan tanpa batas' },
  { icon: Shield, text: 'Advanced Analytics & CNS Tracking', desc: 'Grafik recovery & fatigue monitoring' },
  { icon: Crown, text: 'Badge Pro Lifter & Priority Support', desc: 'Tampilan eksklusif dan fitur premium' },
];

export default function PaywallScreen({ onSkip, session }) {
  const { colors } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [showPayment, setShowPayment] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkPremium();
  }, [session]);

  const checkPremium = async () => {
    const userId = session?.user?.id || 'guest';
    const status = await AsyncStorage.getItem(`@premium_status_${userId}`);
    const isPrem = await AsyncStorage.getItem(`is_premium_${userId}`);
    if (status === 'active' || isPrem === 'true') {
      setIsPremium(true);
      return;
    }

    if (session?.user?.id) {
      const { data } = await supabase
        .from('users_profile')
        .select('is_premium, premium_until')
        .eq('id', session.user.id)
        .single();
      
      if (data?.is_premium) {
        setIsPremium(true);
        await AsyncStorage.setItem(`is_premium_${userId}`, 'true');
        await AsyncStorage.setItem(`@premium_status_${userId}`, 'active');
      }
    }
  };

  const handlePickProof = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Izin Dibutuhkan', 'Mohon izinkan akses galeri untuk mengunggah screenshot bukti transfer.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProofImage(result.assets[0]);
    }
  };

  const handleSendPaymentNotification = async () => {
    if (!proofImage) {
      Alert.alert('Bukti Kosong', 'Silakan pilih foto screenshot bukti pembayaran DANA Anda terlebih dahulu.');
      return;
    }

    if (!session?.user?.id) {
      Alert.alert('Perhatian', 'Silakan login terlebih dahulu sebelum melakukan pembayaran.');
      return;
    }

    setIsSubmitting(true);
    try {
      const plan = PLANS.find(p => p.id === selectedPlan);
      const payload = {
        userId: session.user.id,
        userName: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Athlete',
        userEmail: session.user.email || '',
        plan: selectedPlan,
        amount: plan?.priceNum || 29900,
        proofImageBase64: proofImage.base64 ? `data:image/jpeg;base64,${proofImage.base64}` : null,
      };

      // Call our serverless Telegram notifier
      const baseUrl = typeof window !== 'undefined' && window.location?.origin 
        ? window.location.origin 
        : 'https://gymvault-app.vercel.app';
      const res = await fetch(`${baseUrl}/api/payment-notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsSubmitted(true);
        setShowProofModal(false);
        setShowPayment(false);
        Alert.alert(
          'Bukti Terkirim! 🚀',
          'Bukti transfer Anda telah dikirim langsung ke Admin. Akun Pro Anda akan segera aktif otomatis begitu Admin memverifikasi (1–3 menit).'
        );
      } else {
        throw new Error(json.error || 'Gagal mengirim notifikasi.');
      }
    } catch (e) {
      console.error('Submit Payment Error:', e);
      Alert.alert('Gagal Mengirim', 'Terjadi kesalahan saat mengirim bukti. Pastikan koneksi internet Anda stabil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const plan = PLANS.find(p => p.id === selectedPlan);

  if (isPremium) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <GymVaultLogo size={90} />
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(212,245,60,0.15)', justifyContent: 'center', alignItems: 'center', marginVertical: 20 }}>
          <Crown color="#D4F53C" size={36} />
        </View>
        <AppText weight="bold" style={{ fontSize: 24, color: '#D4F53C', textAlign: 'center', marginBottom: 8 }}>
          Status Premium Aktif! 👑
        </AppText>
        <AppText style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 32 }}>
          Anda memiliki akses tanpa batas ke seluruh fitur cerdas GymVault.
        </AppText>
        <TouchableOpacity
          style={{ backgroundColor: '#D4F53C', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }}
          onPress={onSkip}
        >
          <AppText weight="bold" style={{ color: '#000', fontSize: 16 }}>Mulai Latihan</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SmoothScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60, minHeight: '100%' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 }}>
        <GymVaultLogo size={44} />
        <TouchableOpacity onPress={onSkip} style={{ padding: 8 }}>
          <X color={theme.colors.textMuted} size={24} />
        </TouchableOpacity>
      </View>

      {/* Hero Badge */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(212,245,60,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
          <Crown color="#D4F53C" size={28} />
        </View>
        <AppText weight="bold" style={{ fontSize: 26, color: theme.colors.text, textAlign: 'center' }}>
          GymVault <AppText weight="bold" style={{ color: '#D4F53C' }}>PRO</AppText>
        </AppText>
        <AppText style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
          Buka potensi maksimal latihan & nutrisi Anda
        </AppText>
      </View>

      {/* Submitted Status Banner */}
      {isSubmitted && (
        <View style={{ backgroundColor: 'rgba(212,245,60,0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#D4F53C', marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Clock color="#D4F53C" size={24} />
          <View style={{ flex: 1 }}>
            <AppText weight="bold" style={{ color: '#D4F53C', fontSize: 14 }}>Menunggu Verifikasi Admin</AppText>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
              Bukti pembayaran Anda sudah diterima. Akun akan otomatis aktif dalam 1–3 menit.
            </AppText>
          </View>
        </View>
      )}

      {/* Features List */}
      <View style={{ backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border }}>
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < FEATURES.length - 1 ? 1 : 0, borderBottomColor: theme.colors.border }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(212,245,60,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Icon color="#D4F53C" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 14 }}>{f.text}</AppText>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 11 }}>{f.desc}</AppText>
              </View>
              <Check color="#D4F53C" size={16} />
            </View>
          );
        })}
      </View>

      {/* Pricing Plans */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        {PLANS.map((p) => {
          const isSelected = selectedPlan === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={{
                flex: 1, backgroundColor: isSelected ? 'rgba(212,245,60,0.06)' : theme.colors.card,
                borderRadius: 16, padding: 16, borderWidth: 2,
                borderColor: isSelected ? '#D4F53C' : theme.colors.border,
                position: 'relative',
              }}
              onPress={() => setSelectedPlan(p.id)}
            >
              {p.popular && (
                <View style={{ position: 'absolute', top: -10, right: 12, backgroundColor: '#D4F53C', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                  <AppText weight="bold" style={{ color: '#000', fontSize: 10 }}>{p.save || 'POPULER'}</AppText>
                </View>
              )}
              <AppText weight="bold" style={{ fontSize: 14, color: isSelected ? '#D4F53C' : theme.colors.text, marginBottom: 4 }}>{p.label}</AppText>
              <AppText weight="bold" style={{ fontSize: 18, color: isSelected ? '#D4F53C' : theme.colors.text }}>{p.price}</AppText>
              <AppText style={{ fontSize: 11, color: theme.colors.textMuted }}>{p.period}</AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={{
          backgroundColor: '#D4F53C', borderRadius: 14, paddingVertical: 16,
          flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
          shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
        }}
        onPress={() => setShowPayment(true)}
      >
        <CreditCard color="#000" size={20} />
        <AppText weight="bold" style={{ color: '#000', fontSize: 16 }}>Bayar via QRIS DANA ({plan?.price})</AppText>
      </TouchableOpacity>

      <AppText style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 12, fontSize: 11, lineHeight: 16 }}>
        100% Bebas Biaya Transaksi • Verifikasi Cepat via Telegram Admin
      </AppText>

      {/* Skip */}
      <TouchableOpacity style={{ marginTop: 24, alignItems: 'center', paddingVertical: 12 }} onPress={onSkip}>
        <AppText weight="medium" style={{ color: theme.colors.textMuted, fontSize: 14 }}>Nanti saja, pakai versi gratis</AppText>
      </TouchableOpacity>

      {/* ═══ Payment Modal ═══ */}
      <Modal visible={showPayment} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%', borderWidth: 1, borderColor: theme.colors.border }}>
            <SmoothScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View>
                  <AppText weight="bold" style={{ fontSize: 20, color: theme.colors.text }}>Pembayaran QRIS DANA</AppText>
                  <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{plan?.label} - {plan?.price}</AppText>
                </View>
                <TouchableOpacity onPress={() => setShowPayment(false)} style={{ padding: 4 }}>
                  <X color={theme.colors.textMuted} size={24} />
                </TouchableOpacity>
              </View>

              {/* QR Code — background putih tetap untuk QR agar bisa di-scan, teks pakai theme */}
              <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 8 }}>
                  <Image
                    source={require('../assets/qris.jpg')}
                    style={{ width: 240, height: 280, borderRadius: 8 }}
                    resizeMode="contain"
                  />
                </View>
                <AppText weight="bold" style={{ color: '#D4F53C', fontSize: 16, marginTop: 12 }}>
                  GymVault QRIS DANA
                </AppText>
                <AppText style={{ color: colors.textMuted, fontSize: 11, marginTop: 2, textAlign: 'center' }}>
                  Support: DANA, BCA, GoPay, OVO, ShopeePay, Mandiri, dll
                </AppText>
              </View>

              {/* Steps */}
              <View style={{ backgroundColor: theme.colors.card, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border }}>
                <AppText weight="bold" style={{ fontSize: 14, marginBottom: 12, color: theme.colors.text }}>Cara Bayar & Aktivasi:</AppText>
                {[
                  'Buka aplikasi DANA / BCA / Gopay / OVO di HP Anda',
                  'Scan kode QRIS di atas',
                  `Transfer nominal tepat: ${plan?.price}`,
                  'Screenshot (tangkapan layar) bukti transfer berhasil',
                  'Upload screenshot bukti transfer di bawah ini',
                ].map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(212,245,60,0.12)', justifyContent: 'center', alignItems: 'center', marginTop: 1 }}>
                      <AppText weight="bold" style={{ fontSize: 11, color: '#D4F53C' }}>{i + 1}</AppText>
                    </View>
                    <AppText style={{ color: theme.colors.text, fontSize: 13, flex: 1, lineHeight: 18 }}>{step}</AppText>
                  </View>
                ))}
              </View>

              {/* Upload Proof Button */}
              <TouchableOpacity
                style={{ backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={() => {
                  setShowPayment(false);
                  setShowProofModal(true);
                }}
              >
                <Upload color="#FFF" size={18} />
                <AppText weight="bold" style={{ color: '#FFF', fontSize: 15 }}>Upload Bukti Pembayaran</AppText>
              </TouchableOpacity>
            </SmoothScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══ Proof Upload Modal ═══ */}
      <Modal visible={showProofModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.colors.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.text }}>Kirim Bukti Transfer</AppText>
              <TouchableOpacity onPress={() => setShowProofModal(false)}>
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <AppText style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 16, lineHeight: 18 }}>
              Pilih foto screenshot bukti transfer DANA sebesar <AppText weight="bold" style={{ color: '#D4F53C' }}>{plan?.price}</AppText>.
            </AppText>

            {/* Image Preview Box */}
            <TouchableOpacity
              onPress={handlePickProof}
              style={{
                width: '100%', height: 180, borderRadius: 12, backgroundColor: theme.colors.inputBg,
                borderWidth: 1.5, borderColor: proofImage ? '#D4F53C' : theme.colors.border, borderStyle: proofImage ? 'solid' : 'dashed',
                justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden'
              }}
            >
              {proofImage ? (
                <Image source={{ uri: proofImage.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Upload color="#D4F53C" size={32} style={{ marginBottom: 8 }} />
                  <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 13 }}>Pilih Screenshot dari Galeri</AppText>
                  <AppText style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 4 }}>Format JPG / PNG</AppText>
                </View>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setShowProofModal(false)}
                disabled={isSubmitting}
              >
                <AppText weight="bold" style={{ color: theme.colors.textMuted }}>Batal</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: '#D4F53C', justifyContent: 'center', alignItems: 'center' }}
                onPress={handleSendPaymentNotification}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <AppText weight="bold" style={{ color: '#000' }}>Kirim ke Admin</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SmoothScrollView>
  );
}
