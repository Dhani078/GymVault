import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, Alert, Platform, Modal, TextInput, Share, DeviceEventEmitter } from 'react-native';
import { Zap, Trash2, Share2, Download, X, CheckCircle2, Dumbbell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, theme } from '../theme';
import { supabase } from '../supabaseClient';
import { useDynamicIsland } from '../contexts/DynamicIslandContext';

// ─── SAFE BASE64 ENCODER & DECODER FOR ROUTINES ───
const encodeRoutine = (routine) => {
  const payload = JSON.stringify({
    name: routine.name,
    exercises: (routine.exercises || []).map(ex => ({
      name: ex.name,
      numSets: ex.numSets || 3,
      image: ex.image || '',
    })),
  });
  try {
    if (typeof btoa === 'function') {
      return 'GV-ROUTINE:' + btoa(unescape(encodeURIComponent(payload)));
    }
  } catch (_e) {}
  try {
    if (typeof Buffer !== 'undefined') {
      return 'GV-ROUTINE:' + Buffer.from(payload, 'utf8').toString('base64');
    }
  } catch (_e) {}
  return 'GV-ROUTINE:' + payload;
};

const decodeRoutine = (text) => {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  const match = clean.match(/GV-ROUTINE:([A-Za-z0-9+/=]+)/);
  if (match && match[1]) {
    try {
      let jsonStr = '';
      if (typeof atob === 'function') {
        jsonStr = decodeURIComponent(escape(atob(match[1])));
      } else if (typeof Buffer !== 'undefined') {
        jsonStr = Buffer.from(match[1], 'base64').toString('utf8');
      }
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed?.name && Array.isArray(parsed?.exercises)) {
          return parsed;
        }
      }
    } catch (_e) {}
  }
  // Fallback: try raw JSON in case copied raw
  try {
    const raw = JSON.parse(clean.replace(/^GV-ROUTINE:/, ''));
    if (raw?.name && Array.isArray(raw?.exercises)) {
      return raw;
    }
  } catch (_e) {}
  return null;
};

export default function CustomRoutinesWidget({ session, dbReady, onStartRoutine }) {
  const [customRoutines, setCustomRoutines] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCodeText, setImportCodeText] = useState('');
  const [previewRoutine, setPreviewRoutine] = useState(null);
  const [importing, setImporting] = useState(false);
  const { showNotification } = useDynamicIsland();

  const getStorageKey = useCallback(() => {
    return session?.user?.id ? `customRoutines_${session.user.id}` : 'customRoutines_guest';
  }, [session?.user?.id]);

  const fetchCustomRoutines = useCallback(async () => {
    try {
      const storageKey = getStorageKey();
      const routinesStr = await AsyncStorage.getItem(storageKey);
      let localRoutines = [];
      if (routinesStr) {
        try { localRoutines = JSON.parse(routinesStr); } catch (_e) {}
        setCustomRoutines(localRoutines);
      } else {
        // Fallback: migrate from legacy un-scoped key if available
        const legacyStr = await AsyncStorage.getItem('customRoutines');
        if (legacyStr) {
          try {
            localRoutines = JSON.parse(legacyStr);
            setCustomRoutines(localRoutines);
            await AsyncStorage.setItem(storageKey, JSON.stringify(localRoutines));
          } catch (_e) {}
        }
      }

      if (session?.user?.id && dbReady) {
        const { data, error } = await supabase
          .from('users_profile')
          .select('custom_routines')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!error && data?.custom_routines) {
          const remoteRoutines = Array.isArray(data.custom_routines) ? data.custom_routines : [];
          if (remoteRoutines.length > 0) {
            setCustomRoutines(remoteRoutines);
            await AsyncStorage.setItem(storageKey, JSON.stringify(remoteRoutines));
          } else if (localRoutines.length > 0) {
            await supabase
              .from('users_profile')
              .update({ custom_routines: localRoutines })
              .eq('id', session.user.id);
          }
        }
      }
    } catch (_e) {}
  }, [getStorageKey, session?.user?.id, dbReady]);

  useEffect(() => {
    fetchCustomRoutines();
    const sub = DeviceEventEmitter.addListener('custom_routines_updated', (updated) => {
      if (Array.isArray(updated)) {
        setCustomRoutines(updated);
      } else {
        fetchCustomRoutines();
      }
    });
    return () => sub.remove();
  }, [fetchCustomRoutines]);

  const confirmDeleteRoutine = (routine) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Hapus routine "${routine.name}"?`)) {
        deleteRoutine(routine.id);
      }
    } else {
      Alert.alert(
        "Delete Routine",
        `Are you sure you want to delete "${routine.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteRoutine(routine.id) }
        ]
      );
    }
  };

  const deleteRoutine = async (routineId) => {
    try {
      const storageKey = getStorageKey();
      const updated = customRoutines.filter(r => r.id !== routineId);
      setCustomRoutines(updated);
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));

      if (session?.user?.id && dbReady) {
        const { error } = await supabase
          .from('users_profile')
          .update({ custom_routines: updated })
          .eq('id', session.user.id);
        if (error) console.warn("[CustomRoutines] Failed to sync routine deletion to Supabase:", error.message);
      }
      showNotification({
        type: 'success',
        title: 'Routine Deleted',
        subtitle: 'The routine has been removed.',
        duration: 2500,
      });
    } catch (_e) {}
  };

  // ─── SHARE ROUTINE HANDLER ───
  const handleShareRoutine = async (routine) => {
    const code = encodeRoutine(routine);
    const exerciseList = (routine.exercises || []).map(e => `• ${e.name} (${e.numSets || 3} set)`).join('\n');
    const shareMessage = `🏋️ *GymVault Routine: ${routine.name}*\n\nGerakan:\n${exerciseList}\n\n📲 *Kode Import GymVault:*\n${code}\n\n(Buka GymVault > My Routines > Import untuk langsung pakai!)`;

    if (Platform.OS !== 'web') {
      try {
        await Share.share({
          title: `GymVault: ${routine.name}`,
          message: shareMessage,
        });
        return;
      } catch (_e) {}
    }

    // Web & Clipboard Fallback
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareMessage);
        showNotification({
          type: 'success',
          title: 'Kode Rutin Disalin! 📋',
          subtitle: `"${routine.name}" siap dikirim ke teman Anda.`,
          duration: 3500,
        });
        return;
      }
    } catch (_e) {}

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.prompt('Salin teks/kode rutin ini untuk teman:', code);
    }
  };

  // ─── IMPORT LIVE VALIDATION ───
  const handleImportTextChange = (text) => {
    setImportCodeText(text);
    const decoded = decodeRoutine(text);
    setPreviewRoutine(decoded);
  };

  const handleConfirmImport = async () => {
    if (!previewRoutine) return;
    setImporting(true);
    try {
      const storageKey = getStorageKey();
      const newRoutine = {
        id: Date.now().toString(),
        name: previewRoutine.name || 'Imported Routine',
        exercises: (previewRoutine.exercises || []).map(ex => ({
          name: ex.name,
          image: ex.image || '',
          numSets: ex.numSets || 3,
        })),
      };

      const updated = [newRoutine, ...customRoutines];
      setCustomRoutines(updated);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));

      if (session?.user?.id && dbReady) {
        await supabase
          .from('users_profile')
          .update({ custom_routines: updated })
          .eq('id', session.user.id);
      }

      showNotification({
        type: 'success',
        title: 'Rutin Berhasil Diimpor! 🚀',
        subtitle: `"${newRoutine.name}" siap digunakan.`,
        duration: 3500,
      });

      setShowImportModal(false);
      setImportCodeText('');
      setPreviewRoutine(null);
    } catch (_e) {
      Alert.alert('Gagal', 'Terjadi kesalahan saat mengimpor rutin.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={{ marginTop: 4, marginBottom: 20 }}>
      {/* ─── HEADER ROW ─── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.text }}>My Routines</AppText>
          {customRoutines.length > 0 && (
            <View style={{ backgroundColor: 'rgba(212,245,60,0.12)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,245,60,0.25)' }}>
              <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 12 }}>{customRoutines.length}</AppText>
            </View>
          )}
        </View>

        {/* ─── IMPORT BUTTON ─── */}
        <TouchableOpacity
          onPress={() => setShowImportModal(true)}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(212,245,60,0.08)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(212,245,60,0.3)',
          }}
          accessibilityLabel="Import routine dari kode atau teman"
          accessibilityRole="button"
        >
          <Download color={theme.colors.primary} size={14} />
          <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 12 }}>+ Import</AppText>
        </TouchableOpacity>
      </View>

      {/* ─── EMPTY STATE (CLEAN DASHED PROMPT) ─── */}
      {customRoutines.length === 0 ? (
        <View style={{
          padding: 18,
          backgroundColor: theme.colors.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderStyle: 'dashed',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(212,245,60,0.08)', justifyContent: 'center', alignItems: 'center' }}>
              <Dumbbell color={theme.colors.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text, marginBottom: 2 }}>Belum Ada Rutin</AppText>
              <AppText style={{ fontSize: 12, color: theme.colors.textMuted }}>Simpan latihan selesai atau import kode dari teman.</AppText>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setShowImportModal(true)}
            style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
          >
            <AppText weight="bold" style={{ color: '#000', fontSize: 11 }}>Import Kode</AppText>
          </TouchableOpacity>
        </View>
      ) : (
        /* ─── ROUTINE CAROUSEL ─── */
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
          {customRoutines.map((routine) => (
            <TouchableOpacity 
              key={routine.id}
              activeOpacity={0.85}
              style={{ 
                width: 270, 
                marginRight: 14, 
                padding: 18, 
                backgroundColor: theme.colors.card,
                borderRadius: 20,
                borderColor: theme.colors.border, 
                borderWidth: 1,
                position: 'relative'
              }}
              onPress={() => typeof onStartRoutine === 'function' && onStartRoutine(routine)}
              onLongPress={() => confirmDeleteRoutine(routine)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <AppText weight="bold" style={{ fontSize: 16, color: theme.colors.text, flex: 1, paddingRight: 8 }} numberOfLines={1}>
                  {routine.name}
                </AppText>
                
                {/* ACTIONS: SHARE & DELETE & START */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* SHARE BUTTON */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleShareRoutine(routine);
                    }}
                    style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(212,245,60,0.1)', justifyContent: 'center', alignItems: 'center' }}
                    accessibilityLabel={`Bagikan routine ${routine.name}`}
                    accessibilityRole="button"
                  >
                    <Share2 color={theme.colors.primary} size={14} />
                  </TouchableOpacity>

                  {/* TRASH BUTTON */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      confirmDeleteRoutine(routine);
                    }}
                    style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(239, 68, 68, 0.08)', justifyContent: 'center', alignItems: 'center' }}
                    accessibilityLabel={`Hapus routine ${routine.name}`}
                    accessibilityRole="button"
                  >
                    <Trash2 color="#EF4444" size={14} />
                  </TouchableOpacity>

                  {/* 1-TAP START BADGE */}
                  <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(212,245,60,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                    <Zap color={theme.colors.primary} size={15} />
                  </View>
                </View>
              </View>

              <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 12 }}>
                {(routine.exercises || []).length} gerakan • 1-Tap Mulai
              </AppText>

              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {(routine.exercises || []).slice(0, 2).map((ex, i) => (
                  <View key={i} style={{ backgroundColor: theme.colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: theme.colors.border }}>
                    <AppText style={{ fontSize: 10, color: theme.colors.textMuted }} numberOfLines={1}>
                      {(ex?.name || 'Exercise').length > 13 ? (ex?.name || 'Exercise').substring(0, 13) + '…' : (ex?.name || 'Exercise')}
                    </AppText>
                  </View>
                ))}
                {(routine.exercises || []).length > 2 && (
                  <View style={{ backgroundColor: 'rgba(212,245,60,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(212,245,60,0.15)' }}>
                    <AppText style={{ fontSize: 10, color: theme.colors.primary }}>+{(routine.exercises || []).length - 2}</AppText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ─── IMPORT ROUTINE MODAL ─── */}
      <Modal visible={showImportModal} transparent animationType="fade" onRequestClose={() => setShowImportModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: theme.colors.card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: theme.colors.border }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Download color={theme.colors.primary} size={20} />
                <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.text }}>Import Rutin Teman</AppText>
              </View>
              <TouchableOpacity
                onPress={() => { setShowImportModal(false); setImportCodeText(''); setPreviewRoutine(null); }}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' }}
              >
                <X color={theme.colors.textMuted} size={16} />
              </TouchableOpacity>
            </View>

            <AppText style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 14, lineHeight: 18 }}>
              Tempel kode rutin (contoh: <AppText weight="bold" style={{ color: theme.colors.primary }}>GV-ROUTINE:...</AppText>) atau teks yang dibagikan teman Anda:
            </AppText>

            <TextInput
              style={{
                backgroundColor: theme.colors.inputBg,
                color: theme.colors.text,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: previewRoutine ? theme.colors.primary : theme.colors.border,
                padding: 14,
                fontSize: 13,
                fontFamily: 'Inter_500Medium',
                minHeight: 80,
                textAlignVertical: 'top',
                marginBottom: 16,
              }}
              placeholder="Tempel kode rutin di sini..."
              placeholderTextColor={theme.colors.textMuted}
              value={importCodeText}
              onChangeText={handleImportTextChange}
              multiline
              autoFocus
            />

            {/* PREVIEW OF PARSED ROUTINE */}
            {previewRoutine ? (
              <View style={{ backgroundColor: 'rgba(212,245,60,0.06)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(212,245,60,0.3)', marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <CheckCircle2 color={theme.colors.primary} size={16} />
                  <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.primary }}>Rutin Valid Terdeteksi</AppText>
                </View>
                <AppText weight="bold" style={{ fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>{previewRoutine.name}</AppText>
                <AppText style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 }}>
                  {(previewRoutine.exercises || []).length} Gerakan:
                </AppText>
                <View style={{ gap: 4 }}>
                  {(previewRoutine.exercises || []).map((ex, idx) => (
                    <AppText key={idx} style={{ fontSize: 12, color: theme.colors.text }}>
                      • {ex.name} <AppText style={{ color: theme.colors.primary, fontSize: 11 }}>({ex.numSets || 3} set)</AppText>
                    </AppText>
                  ))}
                </View>
              </View>
            ) : importCodeText.trim().length > 0 ? (
              <View style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', marginBottom: 18 }}>
                <AppText style={{ fontSize: 12, color: '#EF4444' }}>Kode rutin tidak valid. Pastikan format mengandung GV-ROUTINE:... atau JSON yang benar.</AppText>
              </View>
            ) : null}

            {/* ACTIONS */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setShowImportModal(false); setImportCodeText(''); setPreviewRoutine(null); }}
                style={{ flex: 1, height: 46, borderRadius: 12, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}
              >
                <AppText weight="bold" style={{ color: theme.colors.textMuted }}>Batal</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmImport}
                disabled={!previewRoutine || importing}
                style={{
                  flex: 1.5,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: previewRoutine ? theme.colors.primary : 'rgba(212,245,60,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <AppText weight="bold" style={{ color: previewRoutine ? '#000000' : 'rgba(0,0,0,0.4)', fontSize: 14 }}>
                  {importing ? 'Menyimpan...' : 'Simpan ke My Routines'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
