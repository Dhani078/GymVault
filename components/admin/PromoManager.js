import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';

export default function PromoManager({ promoCodes, setShowPromoModal, setPromoToDelete }) {
  return (
    <View style={[styles.tableSection, { marginTop: 40 }]}>
      <View style={[styles.chartHeader, { marginBottom: 20 }]}>
        <View>
          <Text style={styles.sectionTitle}>Promo Code Manager</Text>
          <Text style={styles.chartSubtitle}>Kelola kode promo akses Premium</Text>
        </View>
        <TouchableOpacity 
          style={[styles.exportBtn, { backgroundColor: '#D4F53C' }]} 
          onPress={() => setShowPromoModal(true)}
        >
          <Plus color="#000" size={16} />
          <Text style={[styles.exportText, { color: '#000' }]}>Buat Kode</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableContainer}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>Kode Promo</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Durasi (Hari)</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Terpakai</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Status</Text>
          <Text style={[styles.tableCell, styles.cellAction, styles.headerText, { textAlign: 'right', paddingRight: 24 }]}>Aksi</Text>
        </View>

        {promoCodes.map((promo, index) => {
          const isEven = index % 2 === 0;
          const isExhausted = promo.uses >= promo.max_uses;
          return (
            <View key={promo.id || index} style={[styles.tableRow, isEven && styles.tableRowEven]}>
              <Text style={[styles.tableCell, styles.cellFlex2, styles.cellTextBold, { color: '#D4F53C', letterSpacing: 1 }]}>
                {promo.code}
              </Text>
              <Text style={[styles.tableCell, styles.cellFlex1, styles.cellText]}>
                {promo.discount_value} Hari
              </Text>
              <Text style={[styles.tableCell, styles.cellFlex1, styles.cellText]}>
                {promo.uses} / {promo.max_uses}
              </Text>
              <View style={[styles.tableCell, styles.cellFlex1]}>
                <View style={[styles.statusBadge, isExhausted ? styles.statusSuspended : styles.statusActive]}>
                  <Text style={[styles.statusText, isExhausted ? styles.statusTextSuspended : styles.statusTextActive]}>
                    {isExhausted ? 'HABIS' : 'AKTIF'}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, styles.cellAction, { flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 24 }]}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => setPromoToDelete(promo)}
                >
                  <Trash2 color="#FF4444" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {promoCodes.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={styles.cellTextMuted}>Belum ada kode promo.</Text>
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
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusSuspended: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  statusTextActive: {
    color: '#22C55E',
  },
  statusTextSuspended: {
    color: '#FF4444',
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
