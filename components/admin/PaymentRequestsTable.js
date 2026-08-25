import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, TextInput, Modal } from 'react-native';
import { CreditCard, CheckCircle2, XCircle, Clock, ExternalLink, Search, Check, X, Eye } from 'lucide-react-native';

export default function PaymentRequestsTable({
  paymentRequests = [],
  loading = false,
  onApprove,
  onReject,
  actionLoadingId
}) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const filteredRequests = useMemo(() => {
    return paymentRequests.filter(item => {
      // 1. Status Filter
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      // 2. Search Filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.user_name && item.user_name.toLowerCase().includes(q)) ||
        (item.user_email && item.user_email.toLowerCase().includes(q)) ||
        (item.plan && item.plan.toLowerCase().includes(q))
      );
    });
  }, [paymentRequests, filterStatus, searchQuery]);

  const pendingCount = paymentRequests.filter(p => p.status === 'pending').length;
  const approvedCount = paymentRequests.filter(p => p.status === 'approved').length;
  const rejectedCount = paymentRequests.filter(p => p.status === 'rejected').length;

  return (
    <View style={styles.container}>
      {/* ─── HEADER & METRICS ─── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <CreditCard color="#CCFF00" size={22} />
          <View>
            <Text style={styles.title}>VERIFIKASI PEMBAYARAN QRIS DANA</Text>
            <Text style={styles.subtitle}>Sinkronisasi Realtime dengan Webhook Telegram Bot & Supabase</Text>
          </View>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{pendingCount} Menunggu ACC</Text>
        </View>
      </View>

      {/* ─── FILTERS & SEARCH ROW ─── */}
      <View style={styles.toolbarRow}>
        {/* Status Filter Pills */}
        <View style={styles.filterPills}>
          {[
            { key: 'all', label: `Semua (${paymentRequests.length})` },
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'approved', label: `Disetujui (${approvedCount})` },
            { key: 'rejected', label: `Ditolak (${rejectedCount})` },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.pill, filterStatus === f.key && styles.pillActive]}
              onPress={() => setFilterStatus(f.key)}
            >
              <Text style={[styles.pillText, filterStatus === f.key && styles.pillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Box */}
        <View style={styles.searchBox}>
          <Search size={14} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari atlet atau email..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color="#CCFF00" size="large" />
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock color="#555" size={32} style={{ marginBottom: 8 }} />
          <Text style={styles.emptyText}>Tidak ada data pembayaran yang sesuai kriteria.</Text>
        </View>
      ) : (
        <View style={styles.tableWrapper}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { flex: 2.2 }]}>LIFTER / EMAIL</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>PAKET</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>NOMINAL</Text>
            <Text style={[styles.th, { flex: 1.8 }]}>WAKTU</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>BUKTI</Text>
            <Text style={[styles.th, { flex: 1.3 }]}>STATUS</Text>
            <Text style={[styles.th, { flex: 2, textAlign: 'center' }]}>AKSI</Text>
          </View>

          {/* Table Body */}
          {filteredRequests.map((item, idx) => {
            const isPending = item.status === 'pending';
            const isApproved = item.status === 'approved';
            const isBusy = actionLoadingId === item.id;
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
            const proofUrl = item.proof_url || item.proof_image_url;

            return (
              <View key={item.id || idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                {/* User */}
                <View style={{ flex: 2.2 }}>
                  <Text style={styles.userName}>{item.user_name || 'Athlete'}</Text>
                  <Text style={styles.userEmail}>{item.user_email || '-'}</Text>
                </View>

                {/* Plan */}
                <View style={{ flex: 1.2 }}>
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
                <View style={{ flex: 1.8 }}>
                  <Text style={styles.dateText}>{dateStr} WIB</Text>
                </View>

                {/* Proof Thumbnail Modal */}
                <View style={{ flex: 1.2 }}>
                  {proofUrl ? (
                    <TouchableOpacity
                      style={styles.proofThumbBtn}
                      onPress={() => setPreviewImage(proofUrl)}
                    >
                      <Eye size={12} color="#CCFF00" />
                      <Text style={styles.proofThumbText}>Lihat</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: '#666', fontSize: 11 }}>-</Text>
                  )}
                </View>

                {/* Status */}
                <View style={{ flex: 1.3 }}>
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
                <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                  {isPending ? (
                    isBusy ? (
                      <ActivityIndicator size="small" color="#CCFF00" />
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.btnApprove}
                          onPress={() => onApprove(item.id)}
                        >
                          <Check size={14} color="#000" />
                          <Text style={styles.btnApproveText}>ACC</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.btnReject}
                          onPress={() => onReject(item.id)}
                        >
                          <X size={14} color="#FF4444" />
                          <Text style={styles.btnRejectText}>Tolak</Text>
                        </TouchableOpacity>
                      </>
                    )
                  ) : (
                    <Text style={styles.completedText}>
                      {isApproved ? 'Aktif Pro' : 'Selesai'}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ─── MODAL ZOOM BUKTI BAYAR ─── */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>BUKTI TRANSFER QRIS</Text>
              <TouchableOpacity onPress={() => setPreviewImage(null)} style={styles.closeBtn}>
                <X size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
            {previewImage && (
              <Image source={{ uri: previewImage }} style={styles.fullReceiptImage} resizeMode="contain" />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0E0E14',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1E28',
    padding: 24,
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    color: '#8E8E9F',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countText: {
    color: '#CCFF00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#14141E',
    borderWidth: 1,
    borderColor: '#222230',
  },
  pillActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderColor: '#CCFF00',
  },
  pillText: {
    color: '#8E8E9F',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pillTextActive: {
    color: '#CCFF00',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#14141E',
    borderWidth: 1,
    borderColor: '#222230',
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 200,
  },
  searchInput: {
    color: '#FFF',
    fontSize: 12,
    paddingVertical: 6,
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 13,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#1E1E28',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222230',
  },
  th: {
    color: '#8E8E9F',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#161622',
    backgroundColor: '#0E0E14',
  },
  tableRowAlt: {
    backgroundColor: '#11111A',
  },
  userName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#8E8E9F',
    fontSize: 11,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  yearlyBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
  },
  monthlyBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  planText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  amountText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#8E8E9F',
    fontSize: 11,
  },
  proofThumbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  proofThumbText: {
    color: '#CCFF00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  btnApprove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFF00',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnApproveText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  btnReject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnRejectText: {
    color: '#FF4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
  completedText: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#121218',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22222C',
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  fullReceiptImage: {
    width: '100%',
    height: 400,
    borderRadius: 10,
    backgroundColor: '#000',
  },
});
