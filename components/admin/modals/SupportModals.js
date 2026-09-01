import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { MessageSquare, CheckCircle, X } from 'lucide-react-native';

export default function SupportModals({
  selectedTicket, setSelectedTicket,
  handleResolveTicket, isResolvingTicket
}) {
  return (
    <Modal
      visible={!!selectedTicket}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { alignItems: 'stretch' }]}>
          <View style={[styles.detailHeader, { borderBottomWidth: 0, marginBottom: 10 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <MessageSquare color="#D4F53C" size={28} />
              <Text style={styles.modalTitle}>Detail Keluhan</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedTicket(null)} style={styles.closeBtn}>
              <X color="#888" size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.inputLabel}>Pengguna</Text>
            <Text style={[styles.cellTextBold, { fontSize: 16 }]}>{selectedTicket?.users_profile?.email || 'Unknown User'}</Text>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={styles.inputLabel}>Subjek</Text>
            <Text style={[styles.cellTextBold, { fontSize: 16 }]}>{selectedTicket?.subject}</Text>
          </View>

          <View style={{ marginBottom: 30 }}>
            <Text style={styles.inputLabel}>Pesan Keluhan</Text>
            <View style={{ backgroundColor: '#111', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#222' }}>
              <Text style={[styles.cellText, { lineHeight: 22 }]}>{selectedTicket?.message}</Text>
            </View>
          </View>

          {selectedTicket?.status === 'open' ? (
            <TouchableOpacity 
              style={[styles.submitBtn, isResolvingTicket && { opacity: 0.7 }]} 
              onPress={handleResolveTicket}
              disabled={isResolvingTicket}
            >
              {isResolvingTicket ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CheckCircle color="#000" size={20} />
                  <Text style={styles.submitBtnText}>Tandai Selesai</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={[styles.statusBadge, styles.statusActive, { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12 }]}>
              <Text style={[styles.statusText, styles.statusTextActive, { fontSize: 14 }]}>Keluhan Telah Diselesaikan</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
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
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
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
  inputLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  cellText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#CCCCCC',
  },
  cellTextBold: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  statusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  statusTextActive: {
    color: '#D4F53C',
  },
});
