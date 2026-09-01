import React from 'react';
import { View, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { AppText, theme } from '../../theme';

export default function EditProfileModal({
  visible,
  onClose,
  editForm,
  setEditForm,
  onSave,
  t,
  cardColor,
  borderColor,
  textColor,
  textMuted
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: cardColor, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, height: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <AppText weight="bold" style={{ color: textColor, fontSize: 20 }}>{t ? t('edit_profile') : 'Edit Profile'}</AppText>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: theme.colors.inputBg, borderRadius: 20 }}>
              <X color={textColor} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Nama Lengkap</AppText>
            <TextInput
              style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 16, marginBottom: 16, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: borderColor }}
              value={editForm.name}
              onChangeText={v => setEditForm(prev => ({ ...prev, name: v }))}
              placeholder="Nama Anda"
              placeholderTextColor="#888"
            />

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Berat Badan (kg)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 16, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: borderColor }}
                  value={editForm.weight}
                  onChangeText={v => setEditForm(prev => ({ ...prev, weight: v }))}
                  keyboardType="numeric"
                  placeholder="70"
                  placeholderTextColor="#888"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Tinggi Badan (cm)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 16, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: borderColor }}
                  value={editForm.height}
                  onChangeText={v => setEditForm(prev => ({ ...prev, height: v }))}
                  keyboardType="numeric"
                  placeholder="170"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <AppText weight="bold" style={{ color: textMuted, marginBottom: 12, marginTop: 8 }}>BODY MEASUREMENTS (OPSIONAL)</AppText>
            
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
              <View style={{ flex: 1 }}>
                <AppText style={{ color: textColor, fontSize: 12, marginBottom: 6 }}>Chest (cm)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', borderWidth: 1, borderColor: borderColor }}
                  value={editForm.chest}
                  onChangeText={v => setEditForm(prev => ({ ...prev, chest: v }))}
                  keyboardType="numeric"
                  placeholder="--"
                  placeholderTextColor="#888"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ color: textColor, fontSize: 12, marginBottom: 6 }}>Biceps (cm)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', borderWidth: 1, borderColor: borderColor }}
                  value={editForm.biceps}
                  onChangeText={v => setEditForm(prev => ({ ...prev, biceps: v }))}
                  keyboardType="numeric"
                  placeholder="--"
                  placeholderTextColor="#888"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ color: textColor, fontSize: 12, marginBottom: 6 }}>Waist (cm)</AppText>
                <TextInput
                  style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', borderWidth: 1, borderColor: borderColor }}
                  value={editForm.waist}
                  onChangeText={v => setEditForm(prev => ({ ...prev, waist: v }))}
                  keyboardType="numeric"
                  placeholder="--"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#D4F53C', padding: 16, borderRadius: 16, marginTop: 16, marginBottom: 32, alignItems: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
              onPress={() => {
                onSave();
                onClose();
              }}
            >
              <AppText weight="bold" style={{ color: '#000', fontSize: 16, textAlign: 'center' }}>Simpan Perubahan</AppText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
