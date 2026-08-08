import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, TextInput } from 'react-native';
import { Trash2, Ticket, X } from 'lucide-react-native';

export default function PromoModals({
  promoToDelete, setPromoToDelete, confirmDeletePromo,
  showPromoModal, setShowPromoModal,
  newPromoConfig, setNewPromoConfig,
  generateRandomCode, handleCreatePromoCode, isGeneratingPromo
}) {
  return (
    <>
      {/* DELETE PROMO CONFIRMATION MODAL */}
      <Modal
        visible={!!promoToDelete}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Trash2 color="#FF4444" size={32} />
            </View>
            <Text style={styles.modalTitle}>Hapus Kode Promo?</Text>
            <Text style={styles.modalText}>
              Anda yakin ingin menghapus promo <Text style={{ color: '#CCFF00', fontFamily: 'Inter_700Bold' }}>{promoToDelete?.code}</Text>?
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setPromoToDelete(null)}>
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmDeletePromo}>
                <Text style={styles.modalBtnConfirmText}>Ya, Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE PROMO MODAL */}
      <Modal
        visible={showPromoModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'stretch' }]}>
            <View style={[styles.detailHeader, { borderBottomWidth: 0, marginBottom: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ticket color="#CCFF00" size={28} />
                <Text style={styles.modalTitle}>Buat Kode Promo</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPromoModal(false)} style={styles.closeBtn}>
                <X color="#888" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kode Unik</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Contoh: GYM-NEW-2024"
                  placeholderTextColor="#555"
                  value={newPromoConfig.code}
                  onChangeText={(text) => setNewPromoConfig(prev => ({ ...prev, code: text.toUpperCase() }))}
                />
                <TouchableOpacity style={styles.generateBtn} onPress={generateRandomCode}>
                  <Text style={styles.generateBtnText}>Acak</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Durasi (Hari)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="30"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                  value={newPromoConfig.durationDays}
                  onChangeText={(text) => setNewPromoConfig(prev => ({ ...prev, durationDays: text }))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Maks. Klaim</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="1"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                  value={newPromoConfig.maxUses}
                  onChangeText={(text) => setNewPromoConfig(prev => ({ ...prev, maxUses: text }))}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, isGeneratingPromo && { opacity: 0.7 }]} 
              onPress={handleCreatePromoCode}
              disabled={isGeneratingPromo}
            >
              {isGeneratingPromo ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Simpan Promo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 32,
    width: 400,
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    alignItems: 'center',
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF4444',
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    marginBottom: 20,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#111',
    borderRadius: 100,
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  inputLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  generateBtn: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#CCFF00',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#CCFF00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  submitBtnText: {
    color: '#000',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
});
