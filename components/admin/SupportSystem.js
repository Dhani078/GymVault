import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye } from 'lucide-react-native';

export default function SupportSystem({ supportTickets, setSelectedTicket }) {
  return (
    <View style={[styles.tableSection, { marginTop: 40 }]}>
      <View style={[styles.chartHeader, { marginBottom: 20 }]}>
        <View>
          <Text style={styles.sectionTitle}>Laporan & Keluhan Pengguna</Text>
          <Text style={styles.chartSubtitle}>Tanggapi feedback dan keluhan</Text>
        </View>
      </View>

      <View style={styles.tableContainer}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>Subjek</Text>
          <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>Email Pengguna</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Status</Text>
          <Text style={[styles.tableCell, styles.cellAction, styles.headerText, { textAlign: 'right', paddingRight: 24 }]}>Aksi</Text>
        </View>

        {supportTickets.map((ticket, index) => {
          const isEven = index % 2 === 0;
          return (
            <View key={ticket.id || index} style={[styles.tableRow, isEven && styles.tableRowEven]}>
              <Text style={[styles.tableCell, styles.cellFlex2, styles.cellTextBold]}>
                {ticket.subject}
              </Text>
              <Text style={[styles.tableCell, styles.cellFlex2, styles.cellText]} numberOfLines={1}>
                {ticket.users_profile?.email || 'Unknown User'}
              </Text>
              <View style={[styles.tableCell, styles.cellFlex1]}>
                <View style={[styles.statusBadge, {
                  backgroundColor: ticket.status === 'open' ? 'rgba(255, 165, 0, 0.1)' : 'rgba(204, 255, 0, 0.1)',
                  borderColor: ticket.status === 'open' ? 'rgba(255, 165, 0, 0.3)' : 'rgba(204, 255, 0, 0.3)'
                }]}>
                  <Text style={[styles.statusText, {
                    color: ticket.status === 'open' ? '#FFA500' : '#D4F53C'
                  }]}>
                    {ticket.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, styles.cellAction, { flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 24 }]}>
                <TouchableOpacity 
                  style={styles.actionBtnInfo}
                  onPress={() => setSelectedTicket(ticket)}
                >
                  <Eye color="#D4F53C" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {supportTickets.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={styles.cellTextMuted}>Belum ada laporan atau keluhan.</Text>
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
  actionBtnInfo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
