import React from 'react';
import { View, TouchableOpacity, Modal } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { AppText, theme } from '../../theme';

export default function DeleteConfirmModal({
  visible,
  onCancel,
  onConfirm
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: theme.colors.card, width: '100%', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Trash2 color="#EF4444" size={24} />
          </View>
          <AppText weight="bold" style={{ fontSize: 20, marginBottom: 8 }}>Hapus Data?</AppText>
          <AppText style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 24 }}>
            Apakah Anda yakin ingin menghapus data ini secara permanen? Aksi ini tidak dapat dibatalkan.
          </AppText>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}
              onPress={onCancel}
            >
              <AppText weight="bold" style={{ color: theme.colors.text }}>Batal</AppText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' }}
              onPress={onConfirm}
            >
              <AppText weight="bold" style={{ color: '#fff' }}>Hapus</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
