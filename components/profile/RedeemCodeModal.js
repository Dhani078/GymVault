import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Award } from 'lucide-react-native';
import { AppText, theme } from '../../theme';
import { supabase } from '../../supabaseClient';

export default function RedeemCodeModal({
  visible,
  onClose,
  session,
  onSuccess,
  showToast,
  cardColor,
  borderColor,
  textColor,
  textMuted
}) {
  const [redeemCode, setRedeemCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    if (!session?.user?.id) {
      showToast('error', 'Silakan login terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const codeToRedeem = redeemCode.trim().toUpperCase();
      
      // Call atomic RPC function
      const { data, error } = await supabase.rpc('redeem_promo_code', {
        input_code: codeToRedeem
      });

      if (error) {
        showToast('error', error.message || 'Terjadi kesalahan sistem.');
        setLoading(false);
        return;
      }

      if (data && data.success) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const userId = session.user.id;
        const premiumUntil = new Date();
        premiumUntil.setFullYear(premiumUntil.getFullYear() + 10);

        await AsyncStorage.setItem(`premium_since_${userId}`, new Date().toISOString());
        await AsyncStorage.setItem(`premium_until_${userId}`, premiumUntil.toISOString());
        await AsyncStorage.setItem(`is_premium_${userId}`, 'true');
        await AsyncStorage.setItem(`@premium_status_${userId}`, 'active');

        setRedeemCode('');
        onClose();
        if (onSuccess) onSuccess();
        showToast('success', data.message || 'Selamat! Akun Premium Anda aktif 👑');
      } else {
        showToast('error', data?.message || 'Kode promo tidak valid atau sudah dipakai ❌');
      }
    } catch (e) {
      showToast('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: theme.colors.primary }}>
          <Award color={theme.colors.primary} size={48} style={{ marginBottom: 16, alignSelf: 'center' }} />
          <AppText weight="bold" style={{ fontSize: 20, color: textColor, marginBottom: 8, textAlign: 'center' }}>Redeem Premium</AppText>
          <AppText style={{ color: textMuted, fontSize: 13, marginBottom: 24, textAlign: 'center', lineHeight: 20 }}>
            Masukkan kode rahasia dari admin (via WhatsApp) untuk mengaktifkan AI tanpa batas!
          </AppText>
          
          <TextInput 
            style={{
              backgroundColor: theme.colors.inputBg,
              color: textColor,
              borderRadius: 10,
              padding: 14,
              fontSize: 18,
              borderWidth: 1,
              borderColor: borderColor,
              marginBottom: 24,
              fontFamily: 'Inter_600SemiBold',
              textAlign: 'center',
              textTransform: 'uppercase'
            }} 
            value={redeemCode} 
            onChangeText={setRedeemCode} 
            placeholder="CONTOH: GV-A8F2" 
            placeholderTextColor="#555" 
            autoCapitalize="characters"
            editable={!loading}
          />
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center' }}
              onPress={onClose}
              disabled={loading}
            >
              <AppText style={{ color: textColor, textAlign: 'center' }}>Batal</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#D4F53C', alignItems: 'center', justifyContent: 'center' }}
              onPress={handleRedeem}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <AppText weight="bold" style={{ color: '#000' }}>Aktivasi</AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
