import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, TextInput } from 'react-native';
import { ShieldAlert, Send, X } from 'lucide-react-native';

export default function NotificationModals({
  showNotifModal, setShowNotifModal,
  newNotif, setNewNotif,
  handleCreateNotification, isSendingNotif,
  notifToDelete, setNotifToDelete, confirmDeleteNotif
}) {
  return (
    <>
      {/* CREATE NOTIF MODAL */}
      <Modal
        visible={showNotifModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'stretch' }]}>
            <View style={[styles.detailHeader, { borderBottomWidth: 0, marginBottom: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Send color="#4488FF" size={28} />
                <Text style={styles.modalTitle}>Kirim Pengumuman</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotifModal(false)} style={styles.closeBtn}>
                <X color="#888" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Judul Pengumuman</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Maintenance Server"
                placeholderTextColor="#555"
                value={newNotif.title}
                onChangeText={(text) => setNewNotif(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Isi Pesan</Text>
              <TextInput
                style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Tulis pesan pengumuman..."
                placeholderTextColor="#555"
                multiline
                value={newNotif.message}
                onChangeText={(text) => setNewNotif(prev => ({ ...prev, message: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipe Notifikasi</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['info', 'warning', 'success'].map(type => (
                  <TouchableOpacity 
                    key={type}
                    style={[
                      styles.generateBtn, 
                      { flex: 1, paddingVertical: 12 },
                      newNotif.type === type && { 
                        backgroundColor: type === 'warning' ? 'rgba(255, 165, 0, 0.2)' : type === 'info' ? 'rgba(68, 136, 255, 0.2)' : 'rgba(204, 255, 0, 0.2)',
                        borderColor: type === 'warning' ? '#FFA500' : type === 'info' ? '#4488FF' : '#D4F53C'
                      }
                    ]}
                    onPress={() => setNewNotif(prev => ({ ...prev, type }))}
                  >
                    <Text style={[styles.generateBtnText, { color: type === 'warning' ? '#FFA500' : type === 'info' ? '#4488FF' : '#D4F53C' }]}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: '#4488FF' }, isSendingNotif && { opacity: 0.7 }]} 
              onPress={handleCreateNotification}
              disabled={isSendingNotif}
            >
              {isSendingNotif ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={[styles.submitBtnText, { color: '#FFF' }]}>Kirim Sekarang</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DELETE NOTIF CONFIRMATION MODAL */}
      <Modal
        visible={!!notifToDelete}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <ShieldAlert color="#FF4444" size={32} />
            </View>
            <Text style={styles.modalTitle}>Hapus Pengumuman?</Text>
            <Text style={styles.modalText}>
              Anda yakin ingin menghapus pengumuman <Text style={{ color: '#FFF' }}>{notifToDelete?.title}</Text>?
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setNotifToDelete(null)}>
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmDeleteNotif}>
                <Text style={styles.modalBtnConfirmText}>Ya, Hapus</Text>
              </TouchableOpacity>
            </View>
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
    color: '#D4F53C',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#D4F53C',
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
