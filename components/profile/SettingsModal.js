import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, Switch, Platform, Alert } from 'react-native';
import {
  X, ChevronRight, Globe, Zap, Activity, Target, Moon, Bell, Shield,
  Settings, Award, Download, Trash2, Camera, User, Lock, LogOut
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AppText, theme } from '../../theme';

const SettingItem = ({ icon: Icon, title, value, type = 'nav', onPress, toggleValue }) => (
  <TouchableOpacity
    activeOpacity={type === 'toggle' ? 1 : 0.7}
    onPress={onPress}
    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
  >
    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
      <Icon color={theme.colors.primary} size={18} />
    </View>
    <AppText weight="bold" style={{ flex: 1, color: theme.colors.text, fontSize: 16 }}>{title}</AppText>

    {type === 'nav' && (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {value && <AppText style={{ color: theme.colors.textMuted, marginRight: 8 }}>{value}</AppText>}
        <ChevronRight color={theme.colors.textMuted} size={20} />
      </View>
    )}

    {type === 'toggle' && (
      <Switch
        value={toggleValue}
        onValueChange={onPress}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={toggleValue ? '#000' : theme.colors.textMuted}
      />
    )}
  </TouchableOpacity>
);

export default function SettingsModal({
  visible,
  onClose,
  session,
  profile,
  updateProfile,
  themeContext,
  languageContext,
  notifications,
  handleNotificationToggle,
  privateMode,
  setPrivateMode,
  weightUnit,
  setWeightUnit,
  healthKitConnected,
  handleHealthKitToggle,
  handlePickAvatar,
  handleResetPassword,
  handleSignOut,
  handleExportData,
  onOpenRedeemModal,
  onOpenEditModal,
  showToast,
  cardColor,
  borderColor,
  bgColor,
  textColor,
  textMuted
}) {
  const { darkMode, setDarkMode, graphicsQuality, setGraphicsQuality, fpsLimit, setFpsLimit, proMode, setProMode } = themeContext;
  const { language, setLanguage, t } = languageContext;

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [unitsModalVisible, setUnitsModalVisible] = useState(false);
  const [graphicsModalVisible, setGraphicsModalVisible] = useState(false);
  const [fpsModalVisible, setFpsModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  return (
    <>
      {/* ─── Main Settings Modal ─── */}
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: bgColor }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: borderColor }}>
            <AppText weight="bold" style={{ fontSize: 20, color: textColor }}>{t('settings')}</AppText>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <X color={textColor} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 8 }}>{t('appearance')}</AppText>

            <View style={{ backgroundColor: cardColor, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: borderColor, marginBottom: 24 }}>
              <SettingItem
                icon={Globe}
                title={t('language')}
                value={language.toUpperCase()}
                onPress={() => setLanguageModalVisible(true)}
              />
              <SettingItem
                icon={Zap}
                title="Graphics Quality"
                value={graphicsQuality === 'extreme' ? 'Extreme' : graphicsQuality === 'high' ? 'High' : graphicsQuality === 'medium' ? 'Medium' : graphicsQuality === 'potato' ? 'Potato' : 'Low'}
                onPress={() => setGraphicsModalVisible(true)}
              />
              <SettingItem
                icon={Activity}
                title="Framerate (FPS)"
                value={`${fpsLimit} FPS`}
                onPress={() => setFpsModalVisible(true)}
              />
              <SettingItem
                icon={Target}
                title="Pro Lifter Mode (RPE, Set Tags)"
                type="toggle"
                toggleValue={proMode}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setProMode(!proMode);
                }}
              />
              <SettingItem
                icon={Moon}
                title={t('dark_mode')}
                type="toggle"
                toggleValue={darkMode}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDarkMode(!darkMode);
                  showToast('success', !darkMode ? t('toast_dark_mode_activated') : t('toast_light_mode_activated'));
                }}
              />
              <SettingItem
                icon={Bell}
                title={t('notifications')}
                type="toggle"
                toggleValue={notifications}
                onPress={handleNotificationToggle}
              />
              <SettingItem
                icon={Shield}
                title={t('privacy')}
                type="toggle"
                toggleValue={privateMode}
                onPress={async () => {
                  const nextPriv = !privateMode;
                  setPrivateMode(nextPriv);
                  try {
                    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                    await AsyncStorage.setItem('gymvault_private_mode', String(nextPriv));
                    if (session?.user?.id) {
                      await updateProfile({ is_private: nextPriv });
                    }
                  } catch (e) {}
                  showToast('success', nextPriv ? t('toast_workout_logs_are_now') : t('toast_workout_logs_are_publ'));
                }}
              />
              <SettingItem
                icon={Settings}
                title={t('units')}
                value={weightUnit === 'metric' ? 'Metric' : 'Imperial'}
                onPress={() => setUnitsModalVisible(true)}
              />
              <SettingItem
                icon={Activity}
                title={Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit Connect'}
                type="toggle"
                toggleValue={healthKitConnected}
                onPress={handleHealthKitToggle}
              />
            </View>

            <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 8 }}>PREMIUM & SUPPORT</AppText>
            <View style={{ backgroundColor: cardColor, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: borderColor, marginBottom: 24 }}>
              <SettingItem
                icon={Award}
                title="Redeem Premium Code"
                onPress={() => {
                  onClose();
                  if (onOpenRedeemModal) onOpenRedeemModal();
                }}
              />
              <SettingItem
                icon={Activity}
                title="Support Developer (DANA)"
                onPress={() => {
                  Alert.alert('Support GymVault ☕', 'Terima kasih telah menggunakan GymVault! Fitur ini bisa Anda gunakan gratis. Jika Anda ingin mendukung biaya server, silakan scan QRIS pada menu AI Routine.');
                }}
              />
            </View>

            <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 8 }}>{t('data_privacy')}</AppText>
            <View style={{ backgroundColor: cardColor, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: borderColor, marginBottom: 24 }}>
              <SettingItem
                icon={Download}
                title={t('export_data')}
                onPress={() => setExportModalVisible(true)}
              />
              <SettingItem
                icon={Trash2}
                title={t('clear_cache')}
                onPress={() => showToast('success', t('toast_local_cache_cleared'))}
              />
            </View>

            <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 8 }}>{t('account')}</AppText>
            <View style={{ backgroundColor: cardColor, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: borderColor, marginBottom: 40 }}>
              <SettingItem
                icon={Camera}
                title={t('change_avatar')}
                onPress={handlePickAvatar}
              />
              <SettingItem
                icon={User}
                title={t('edit_name')}
                onPress={() => {
                  onClose();
                  if (onOpenEditModal) onOpenEditModal();
                }}
              />
              <SettingItem
                icon={Lock}
                title={t('reset_password')}
                onPress={handleResetPassword}
              />
              <SettingItem
                icon={LogOut}
                title={t('logout')}
                onPress={handleSignOut}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Language Selector Modal ─── */}
      <Modal visible={languageModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: borderColor }}>
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, marginBottom: 24 }}>{t('language')}</AppText>
            {[
              { code: 'en', label: 'English (US)', flag: '🇺🇸' },
              { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
              { code: 'es', label: 'Español', flag: '🇪🇸' },
              { code: 'fr', label: 'Français', flag: '🇫🇷' },
              { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
              { code: 'it', label: 'Italiano', flag: '🇮🇹' },
              { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
              { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
              { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
            ].map(l => (
              <TouchableOpacity 
                key={l.code} 
                onPress={() => { 
                  setLanguage(l.code); 
                  setLanguageModalVisible(false); 
                  showToast('success', `${t('toast_lang_changed')} ${l.label}`); 
                }} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: language === l.code ? 'rgba(204,255,0,0.15)' : 'transparent', 
                  borderWidth: 1, 
                  borderColor: language === l.code ? '#CCFF00' : borderColor, 
                  marginBottom: 12 
                }}
              >
                <AppText style={{ fontSize: 20, marginRight: 14 }}>{l.flag}</AppText>
                <AppText weight="bold" style={{ color: textColor, fontSize: 16, flex: 1 }}>{l.label}</AppText>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: language === l.code ? '#CCFF00' : '#555', justifyContent: 'center', alignItems: 'center' }}>
                  {language === l.code && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCFF00' }} />}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setLanguageModalVisible(false)} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center', marginTop: 8 }}>
              <AppText weight="bold" style={{ color: textMuted }}>{t('cancel')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Weight Units Modal ─── */}
      <Modal visible={unitsModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: borderColor }}>
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, marginBottom: 24 }}>{t('units_title')}</AppText>
            {['metric', 'imperial'].map(u => (
              <TouchableOpacity key={u} onPress={() => { setWeightUnit(u); setUnitsModalVisible(false); showToast('success', u === 'metric' ? t('unit_metric') : t('unit_imperial')); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: weightUnit === u ? 'rgba(204,255,0,0.15)' : 'transparent', borderWidth: 1, borderColor: weightUnit === u ? '#CCFF00' : borderColor, marginBottom: 12 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: weightUnit === u ? '#CCFF00' : '#555', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  {weightUnit === u && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCFF00' }} />}
                </View>
                <AppText weight="bold" style={{ color: textColor, fontSize: 16 }}>{u === 'metric' ? t('unit_metric') : t('unit_imperial')}</AppText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setUnitsModalVisible(false)} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center', marginTop: 8 }}>
              <AppText weight="bold" style={{ color: textMuted }}>{t('cancel')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Graphics Quality Modal ─── */}
      <Modal visible={graphicsModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: borderColor }}>
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, marginBottom: 24 }}>Graphics Quality</AppText>
            {[
              { code: 'extreme', label: 'Extreme', desc: 'World-class cinematic animations, heavy 3D effects' },
              { code: 'high', label: 'High', desc: 'Smooth animations, blur effects, full transitions' },
              { code: 'medium', label: 'Medium', desc: 'Optimized transitions, fewer heavy effects' },
              { code: 'low', label: 'Low', desc: 'No heavy animations, aggressive memory savings' },
              { code: 'potato', label: 'Potato', desc: 'Absolute minimum rendering, maximum speed' },
            ].map(g => (
              <TouchableOpacity 
                key={g.code} 
                onPress={() => { 
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setGraphicsQuality(g.code); 
                  setGraphicsModalVisible(false); 
                  showToast('success', `Graphics set to ${g.label}`); 
                }} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: graphicsQuality === g.code ? 'rgba(204,255,0,0.15)' : 'transparent', 
                  borderWidth: 1, 
                  borderColor: graphicsQuality === g.code ? '#CCFF00' : borderColor, 
                  marginBottom: 12 
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{ color: textColor, fontSize: 16, marginBottom: 4 }}>{g.label}</AppText>
                  <AppText style={{ color: textMuted, fontSize: 12 }}>{g.desc}</AppText>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: graphicsQuality === g.code ? '#CCFF00' : '#555', justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                  {graphicsQuality === g.code && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCFF00' }} />}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setGraphicsModalVisible(false)} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center', marginTop: 8 }}>
              <AppText weight="bold" style={{ color: textMuted }}>{t('cancel')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── FPS Limit Modal ─── */}
      <Modal visible={fpsModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: borderColor }}>
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, marginBottom: 24 }}>Framerate Limit</AppText>
            {[
              { code: '120', label: '120 FPS', desc: 'Ultra smooth, requires capable display' },
              { code: '90', label: '90 FPS', desc: 'Very smooth, great balance for high-end' },
              { code: '60', label: '60 FPS', desc: 'Standard smooth experience' },
              { code: '30', label: '30 FPS', desc: 'Battery saver' },
            ].map(f => (
              <TouchableOpacity 
                key={f.code} 
                onPress={() => { 
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFpsLimit(f.code); 
                  setFpsModalVisible(false); 
                  showToast('success', `FPS set to ${f.label}`); 
                }} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: fpsLimit === f.code ? 'rgba(204,255,0,0.15)' : 'transparent', 
                  borderWidth: 1, 
                  borderColor: fpsLimit === f.code ? '#CCFF00' : borderColor, 
                  marginBottom: 12 
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{ color: textColor, fontSize: 16, marginBottom: 4 }}>{f.label}</AppText>
                  <AppText style={{ color: textMuted, fontSize: 12 }}>{f.desc}</AppText>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: fpsLimit === f.code ? '#CCFF00' : '#555', justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                  {fpsLimit === f.code && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCFF00' }} />}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setFpsModalVisible(false)} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center', marginTop: 8 }}>
              <AppText weight="bold" style={{ color: textMuted }}>{t('cancel')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Export Data Modal ─── */}
      <Modal visible={exportModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: borderColor }}>
            <Download color="#CCFF00" size={40} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, textAlign: 'center', marginBottom: 8 }}>{t('export_title')}</AppText>
            <AppText style={{ color: textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>{t('export_confirm')}</AppText>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setExportModalVisible(false)} style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center' }}>
                <AppText weight="bold" style={{ color: textMuted }}>{t('cancel')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setExportModalVisible(false);
                  if (handleExportData) handleExportData();
                }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#CCFF00', alignItems: 'center' }}
              >
                <AppText weight="bold" style={{ color: '#000' }}>{t('confirm')}</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
