import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AuditLogs({ adminLogs }) {
  return (
    <View style={[styles.tableSection, { marginTop: 40 }]}>
      <Text style={styles.sectionTitle}>Audit Logs (Riwayat Aktivitas Keamanan)</Text>
      
      <View style={styles.tableContainer}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Aksi</Text>
          <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>Detail</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Waktu</Text>
        </View>

        {adminLogs.map((log, index) => {
          const isEven = index % 2 === 0;
          return (
            <View key={log.id || index} style={[styles.tableRow, isEven && styles.tableRowEven]}>
              <Text style={[styles.tableCell, styles.cellFlex1, styles.cellTextBold, { color: log.action.includes('DELETE') ? '#FF4444' : log.action.includes('SUSPEND') ? '#FFA500' : '#D4F53C' }]}>
                {log.action}
              </Text>
              <Text style={[styles.tableCell, styles.cellFlex2, styles.cellText]}>
                {log.details}
              </Text>
              <Text style={[styles.tableCell, styles.cellFlex1, styles.cellTextMuted]}>
                {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
              </Text>
            </View>
          );
        })}

        {adminLogs.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={styles.cellTextMuted}>Belum ada riwayat log, atau tabel admin_logs belum dibuat di Supabase.</Text>
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
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.5,
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
});
