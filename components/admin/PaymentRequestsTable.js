import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { CreditCard, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react-native';

export default function PaymentRequestsTable({
  paymentRequests = [],
  loading = false,
  onApprove,
  onReject,
  actionLoadingId
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <CreditCard color="#CCFF00" size={22} />
          <Text style={styles.title}>QRIS DANA PAYMENT REQUESTS</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {paymentRequests.filter(p => p.status === 'pending').length} Menunggu ACC
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color="#CCFF00" size="large" />
        </View>
      ) : paymentRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock color="#666" size={36} style={{ marginBottom: 8 }} />
          <Text style={styles.emptyText}>Belum ada pembayaran masuk.</Text>
        </View>
      ) : (
        <View style={styles.tableWrapper}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { flex: 2 }]}>USER / EMAIL</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>PAKET</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>NOMINAL</Text>
            <Text style={[styles.th, { flex: 2 }]}>WAKTU</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>STATUS</Text>
            <Text style={[styles.th, { flex: 2, textAlign: 'center' }]}>AKSI</Text>
          </View>

          {/* Table Body */}
          {paymentRequests.map((item, idx) => {
            const isPending = item.status === 'pending';
            const isApproved = item.status === 'approved';
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
            const isBusy = actionLoadingId === item.id;

            return (
              <View key={item.id || idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                {/* User */}
                <View style={{ flex: 2 }}>
                  <Text style={styles.userName}>{item.user_name || 'Athlete'}</Text>
                  <Text style={styles.userEmail}>{item.user_email || '-'}</Text>
                </View>

                {/* Plan */}
                <View style={{ flex: 1.5 }}>
                  <View style={[styles.planBadge, item.plan === 'yearly' ? styles.yearlyBadge : styles.monthlyBadge]}>
                    <Text style={[styles.planText, item.plan === 'yearly' ? { color: '#CCFF00' } : { color: '#60A5FA' }]}>
                      {item.plan === 'yearly' ? 'Tahunan' : 'Bulanan'}
                    </Text>
                  </View>
                </View>

                {/* Amount */}
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.amountText}>Rp {(item.amount || 0).toLocaleString('id-ID')}</Text>
                </View>

                {/* Date */}
                <View style={{ flex: 2 }}>
                  <Text style={styles.dateText}>{dateStr} WIB</Text>
                </View>

                {/* Status */}
                <View style={{ flex: 1.5 }}>
                  <View style={[
                    styles.statusBadge,
                    isApproved ? styles.statusApproved : isPending ? styles.statusPending : styles.statusRejected
                  ]}>
                    <Text style={[
                      styles.statusText,
                      isApproved ? { color: '#10B981' } : isPending ? { color: '#F59E0B' } : { color: '#EF4444' }
                    ]}>
                      {isApproved ? 'DI-ACC' : isPending ? 'PENDING' : 'DITOLAK'}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                  {isPending ? (
                    isBusy ? (
                      <ActivityIndicator size="small" color="#CCFF00" />
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => onApprove(item.id)}
                          activeOpacity={0.8}
                        >
                          <CheckCircle2 color="#000" size={14} />
                          <Text style={styles.approveBtnText}>ACC</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => onReject(item.id)}
                          activeOpacity={0.8}
                        >
                          <XCircle color="#EF4444" size={14} />
                        </TouchableOpacity>
                      </>
                    )
                  ) : (
                    <Text style={styles.completedText}>Selesai</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 24,
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(204,255,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.3)',
  },
  countText: {
    color: '#CCFF00',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  tableWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  th: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    backgroundColor: '#111111',
  },
  tableRowAlt: {
    backgroundColor: '#141414',
  },
  userName: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  userEmail: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  yearlyBadge: {
    backgroundColor: 'rgba(204,255,0,0.1)',
  },
  monthlyBadge: {
    backgroundColor: 'rgba(96,165,250,0.1)',
  },
  planText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  amountText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  dateText: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusApproved: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  statusPending: {
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  approveBtn: {
    backgroundColor: '#CCFF00',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveBtnText: {
    color: '#000',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  rejectBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  completedText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
