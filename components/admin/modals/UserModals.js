import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { ShieldAlert, UserCheck, Ban, X, Activity } from 'lucide-react-native';

export default function UserModals({
  userToDelete, setUserToDelete, confirmDeleteUser,
  userToToggleStatus, setUserToToggleStatus, confirmToggleStatus,
  selectedUserDetail, setSelectedUserDetail, userWorkouts, loadingDetail
}) {
  return (
    <>
      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={!!userToDelete}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <ShieldAlert color="#FF4444" size={32} />
            </View>
            <Text style={styles.modalTitle}>Hapus Pengguna?</Text>
            <Text style={styles.modalText}>
              Anda yakin ingin menghapus <Text style={{ color: '#FFF' }}>{userToDelete?.username || userToDelete?.email}</Text>? Tindakan ini tidak dapat dibatalkan.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setUserToDelete(null)}>
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmDeleteUser}>
                <Text style={styles.modalBtnConfirmText}>Ya, Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* STATUS TOGGLE CONFIRMATION MODAL */}
      <Modal
        visible={!!userToToggleStatus}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBox, userToToggleStatus?.status === 'suspended' ? { backgroundColor: 'rgba(204, 255, 0, 0.1)' } : { backgroundColor: 'rgba(255, 165, 0, 0.1)' }]}>
              {userToToggleStatus?.status === 'suspended' ? (
                <UserCheck color="#CCFF00" size={32} />
              ) : (
                <Ban color="#FFA500" size={32} />
              )}
            </View>
            <Text style={styles.modalTitle}>
              {userToToggleStatus?.status === 'suspended' ? 'Aktifkan Pengguna?' : 'Suspend Pengguna?'}
            </Text>
            <Text style={styles.modalText}>
              Anda yakin ingin {userToToggleStatus?.status === 'suspended' ? 'mengaktifkan kembali' : 'melakukan suspend pada'} <Text style={{ color: '#FFF' }}>{userToToggleStatus?.username || userToToggleStatus?.email}</Text>? 
              {userToToggleStatus?.status !== 'suspended' && ' User ini tidak akan bisa login sampai Anda mengaktifkannya kembali.'}
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setUserToToggleStatus(null)}>
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnConfirm, userToToggleStatus?.status === 'suspended' ? { backgroundColor: '#CCFF00' } : { backgroundColor: '#FFA500' }]} 
                onPress={confirmToggleStatus}
              >
                <Text style={[styles.modalBtnConfirmText, userToToggleStatus?.status === 'suspended' ? { color: '#000' } : { color: '#000' }]}>
                  {userToToggleStatus?.status === 'suspended' ? 'Ya, Aktifkan' : 'Ya, Suspend'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* USER DETAIL MODAL */}
      <Modal
        visible={!!selectedUserDetail}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: 500, alignItems: 'stretch' }]}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedUserDetail?.username || 'Detail Pengguna'}</Text>
                <Text style={styles.detailSubtitle}>{selectedUserDetail?.email}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedUserDetail(null)} style={styles.closeBtn}>
                <X color="#888" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailBody}>
              <Text style={styles.detailSectionTitle}>Riwayat Aktivitas Terakhir (Max 5)</Text>
              
              {loadingDetail ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator color="#CCFF00" />
                </View>
              ) : userWorkouts && userWorkouts.length > 0 ? (
                userWorkouts.map((session, idx) => (
                  <View key={session.id || idx} style={styles.workoutItem}>
                    <Activity color="#666" size={16} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.workoutName}>{session.split_name || 'Latihan Custom'}</Text>
                      <Text style={styles.workoutDate}>{new Date(session.started_at).toLocaleString()}</Text>
                    </View>
                    {session.is_completed ? (
                      <Text style={styles.workoutDuration}>Selesai</Text>
                    ) : (
                      <Text style={[styles.workoutDuration, { color: '#FFA500' }]}>Berlangsung</Text>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyDetailBox}>
                  <Text style={styles.modalText}>Belum ada riwayat latihan yang tersimpan.</Text>
                </View>
              )}
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
  detailSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#111',
    borderRadius: 100,
  },
  detailBody: {
    width: '100%',
  },
  detailSectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#AAA',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  workoutName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFF',
    marginBottom: 4,
  },
  workoutDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#888',
  },
  workoutDuration: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#CCFF00',
  },
  emptyDetailBox: {
    backgroundColor: '#111',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
});
