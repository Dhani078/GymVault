import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { Activity, X, Gamepad2, Zap, Coffee, ShieldAlert } from 'lucide-react-native';
import { AppText, styles, theme } from '../theme';
import { safeUpsert } from '../supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import NeuroGameWidget from './NeuroGameWidget';

export default function CnsReadinessWidget({ session, userProfile, dbError, onStartWorkout }) {
  const { t } = useTranslation();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [sleep, setSleep] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [energy, setEnergy] = useState(3);

  const handleStartWorkout = async () => {
    setLoading(true);
    const averageCns = Math.round((sleep + soreness + energy) / 3);

    if (session?.user && !dbError) {
      try {
        await safeUpsert('users_profile', {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || userProfile?.name || 'Athlete',
          email: session.user.email,
          cns_fatigue: averageCns,
        });
      } catch (e) {
        console.warn('[CnsReadinessWidget] CNS save failed:', e.message);
      }
    }

    setLoading(false);
    setModalVisible(false);
    if (onStartWorkout) {
      onStartWorkout();
    }
  };

  const applyReactionResult = (score) => {
    setSleep(score);
    setSoreness(score);
    setEnergy(score);
  };

  return (
    <>
      {/* ═══ CNS STATUS CARD ═══ */}
      <View style={{ 
        backgroundColor: theme.colors.card, 
        padding: 18, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: theme.colors.border,
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 16,
        marginBottom: 24
      }}>
        <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(204,255,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
          <Activity color={theme.colors.primary} size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <AppText weight="bold" style={{ fontSize: 15, color: theme.colors.text }}>CNS Readiness</AppText>
            <AppText weight="bold" style={{ fontSize: 12, color: (userProfile?.cns_fatigue || 3) >= 4 ? '#10B981' : ((userProfile?.cns_fatigue || 3) === 3 ? '#CCFF00' : '#FF9F0A') }}>
              Level {userProfile?.cns_fatigue || 3}/5
            </AppText>
          </View>
          <AppText style={{ fontSize: 12, color: theme.colors.textMuted, lineHeight: 16, marginBottom: 8 }}>
            {userProfile?.cns_fatigue
              ? (userProfile.cns_fatigue >= 4 ? 'Siap latihan berat! Tubuh Anda pulih maksimal.' : userProfile.cns_fatigue >= 3 ? 'Kondisi baik. Siap untuk latihan normal.' : 'Kelelahan terdeteksi. Disarankan deload/istirahat.')
              : 'Mulai latihan untuk melacak tingkat kesiapan CNS Anda.'}
          </AppText>
          
          {/* Visual CNS Bar Indicator */}
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {[1, 2, 3, 4, 5].map((level) => {
              const score = userProfile?.cns_fatigue || 3;
              const isLit = level <= score;
              const activeColor = score >= 4 ? '#10B981' : (score === 3 ? '#CCFF00' : '#FF9F0A');
              return (
                <View 
                  key={level} 
                  style={{ 
                    flex: 1, 
                    height: 6, 
                    borderRadius: 3, 
                    backgroundColor: isLit ? activeColor : 'rgba(255,255,255,0.08)',
                    opacity: isLit ? 1 : 0.4
                  }} 
                />
              );
            })}
          </View>

          {/* Test Readiness Button */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}
            style={{ marginTop: 14, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            <Gamepad2 color={theme.colors.textMuted} size={16} />
            <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 13 }}>{t('check_cns')}</AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive CNS Readiness Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Activity color={theme.colors.primary} size={24} style={{ marginRight: 12 }} />
                <AppText weight="bold" style={{ fontSize: 20 }}>CNS Readiness Check</AppText>
              </View>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={{ padding: 8 }}
              >
                <X color={theme.colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 24 }}>
              <NeuroGameWidget 
                onResult={applyReactionResult} 
                onCancel={() => setModalVisible(false)} 
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.btnPrimary, { paddingVertical: 18, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }]}
              onPress={handleStartWorkout}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={theme.colors.background} /> : <AppText weight="bold" style={[styles.btnPrimaryText, { fontSize: 16 }]}>Confirm & Start</AppText>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnGhost, { marginTop: 12, paddingVertical: 16 }]} onPress={() => setModalVisible(false)}>
              <AppText weight="bold" style={{ color: theme.colors.textMuted, fontSize: 15, textAlign: 'center' }}>Cancel</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
