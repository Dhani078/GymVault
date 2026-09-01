import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Send, Trash2 } from 'lucide-react-native';

export default function NotificationSystem({ notifications, setShowNotifModal, setNotifToDelete }) {
  return (
    <View style={[styles.tableSection, { marginTop: 40 }]}>
      <View style={[styles.chartHeader, { marginBottom: 20 }]}>
        <View>
          <Text style={styles.sectionTitle}>Global Broadcast</Text>
          <Text style={styles.chartSubtitle}>Kirim pengumuman ke semua pengguna</Text>
        </View>
        <TouchableOpacity 
          style={[styles.exportBtn, { backgroundColor: '#4488FF' }]} 
          onPress={() => setShowNotifModal(true)}
        >
          <Send color="#FFF" size={16} />
          <Text style={[styles.exportText, { color: '#FFF' }]}>Kirim Pengumuman</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableContainer}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>Judul</Text>
          <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>Pesan</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Tipe</Text>
          <Text style={[styles.tableCell, styles.cellAction, styles.headerText, { textAlign: 'right', paddingRight: 24 }]}>Aksi</Text>
        </View>

        {notifications.map((notif, index) => {
          const isEven = index % 2 === 0;
          return (
            <View key={notif.id || index} style={[styles.tableRow, isEven && styles.tableRowEven]}>
              <Text style={[styles.tableCell, styles.cellFlex2, styles.cellTextBold]}>
                {notif.title}
              </Text>
              <Text style={[styles.tableCell, styles.cellFlex2, styles.cellText]} numberOfLines={1}>
                {notif.message}
              </Text>
              <View style={[styles.tableCell, styles.cellFlex1]}>
                <View style={[styles.statusBadge, {
                  backgroundColor: notif.type === 'warning' ? 'rgba(255, 165, 0, 0.1)' : notif.type === 'info' ? 'rgba(68, 136, 255, 0.1)' : 'rgba(204, 255, 0, 0.1)',
                  borderColor: notif.type === 'warning' ? 'rgba(255, 165, 0, 0.3)' : notif.type === 'info' ? 'rgba(68, 136, 255, 0.3)' : 'rgba(204, 255, 0, 0.3)'
                }]}>
                  <Text style={[styles.statusText, {
                    color: notif.type === 'warning' ? '#FFA500' : notif.type === 'info' ? '#4488FF' : '#D4F53C'
                  }]}>
                    {notif.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, styles.cellAction, { flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 24 }]}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => setNotifToDelete(notif)}
                >
                  <Trash2 color="#FF4444" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {notifications.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={styles.cellTextMuted}>Belum ada pengumuman global.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableSection: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  chartSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#888888',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  exportText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  tableRowEven: {
    backgroundColor: '#0F0F0F',
  },
  tableHeader: {
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingVertical: 16,
  },
  tableCell: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  headerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellFlex1: { flex: 1 },
  cellFlex2: { flex: 2 },
  cellAction: { width: 140 },
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
  cellTextMuted: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
