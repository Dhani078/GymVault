import React from 'react';
import { View, TouchableOpacity, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { AppText, theme } from '../../theme';

export default function WaterDetailModal({
  visible,
  water,
  onClose,
  onDelete
}) {
  if (!visible || !water) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: theme.colors.card, width: '100%', maxWidth: 380, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.text }}>Konsumsi Air Harian</AppText>
              <AppText style={{ fontSize: 12, color: theme.colors.textMuted }}>{water.date}</AppText>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={theme.colors.text} size={20} />
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: theme.colors.background, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <AppText style={{ fontSize: 22 }}>💧</AppText>
            </View>
            <AppText weight="bold" tabular style={{ fontSize: 26, color: '#38BDF8' }}>
              {water.ml || 0} <AppText style={{ fontSize: 16, color: theme.colors.textMuted }}>ml</AppText>
            </AppText>
            <AppText style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
              Target Harian: 2500 ml ({Math.min(100, Math.round(((water.ml || 0) / 2500) * 100))}% tercapai)
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                const wId = water.id;
                if (onClose) onClose();
                if (onDelete) onDelete(wId);
              }}
              style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', alignItems: 'center' }}
            >
              <AppText weight="bold" style={{ color: '#EF4444', fontSize: 13 }}>Hapus Catatan</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, backgroundColor: theme.colors.surface, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}
            >
              <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 13 }}>Tutup</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
