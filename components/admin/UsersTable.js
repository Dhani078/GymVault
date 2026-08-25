import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, Eye, UserCheck, Ban, Trash2, Users, Star, Shield } from 'lucide-react-native';

export default function UsersTable({ 
  usersList = [], 
  searchQuery = '', 
  setSearchQuery, 
  openUserDetails, 
  setUserToToggleStatus, 
  setUserToDelete 
}) {
  const [filterRole, setFilterRole] = useState('all'); // 'all' | 'pro' | 'free' | 'suspended'

  const filteredUsers = useMemo(() => {
    return usersList.filter(user => {
      // 1. Role Filter
      if (filterRole === 'pro' && !user.is_premium && user.status !== 'premium') return false;
      if (filterRole === 'free' && (user.is_premium || user.status === 'premium')) return false;
      if (filterRole === 'suspended' && user.status !== 'suspended') return false;

      // 2. Search Query
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.username && user.username.toLowerCase().includes(query)) ||
        (user.name && user.name.toLowerCase().includes(query))
      );
    });
  }, [usersList, filterRole, searchQuery]);

  const proCount = usersList.filter(u => u.is_premium || u.status === 'premium').length;
  const suspendedCount = usersList.filter(u => u.status === 'suspended').length;
  const freeCount = usersList.length - proCount;

  return (
    <View style={styles.tableSection}>
      {/* ─── HEADER & SEARCH ─── */}
      <View style={styles.chartHeader}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Users size={20} color="#CCFF00" />
            <Text style={styles.sectionTitle}>Database Lifter & Member Directory</Text>
          </View>
          <Text style={styles.chartSubtitle}>Kelola akun, status pro, dan hak akses database</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Search color="#888" size={16} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari email, username, nama..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* ─── QUICK FILTER TABS ─── */}
      <View style={styles.filterPillsRow}>
        {[
          { key: 'all', label: `Semua Lifter (${usersList.length})` },
          { key: 'pro', label: `Pro Members (${proCount})` },
          { key: 'free', label: `Free Tier (${freeCount})` },
          { key: 'suspended', label: `Suspended (${suspendedCount})` },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterPill, filterRole === tab.key && styles.filterPillActive]}
            onPress={() => setFilterRole(tab.key)}
          >
            <Text style={[styles.filterPillText, filterRole === tab.key && styles.filterPillTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* ─── TABLE CONTAINER ─── */}
      <View style={styles.tableContainer}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>LIFTER / USERNAME</Text>
          <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>EMAIL</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>TIER</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>STATUS</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>BERGABUNG</Text>
          <Text style={[styles.tableCell, styles.cellAction, styles.headerText, { textAlign: 'right', paddingRight: 16 }]}>AKSI</Text>
        </View>

        {/* Table Body */}
        {filteredUsers.length === 0 ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: '#888', fontSize: 13 }}>Tidak ada atlet yang cocok dengan pencarian.</Text>
          </View>
        ) : (
          filteredUsers.map((user, index) => {
            const isEven = index % 2 === 0;
            const isPro = user.is_premium || user.status === 'premium';
            const isSuspended = user.status === 'suspended';
            const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-';

            return (
              <View key={user.id || index} style={[styles.tableRow, isEven && styles.tableRowEven]}>
                {/* Username & Name */}
                <View style={[styles.tableCell, styles.cellFlex2]}>
                  <Text style={styles.cellTextBold}>{user.name || user.username || 'Athlete'}</Text>
                  <Text style={styles.cellSubText}>@{user.username || 'lifter'}</Text>
                </View>

                {/* Email */}
                <Text style={[styles.tableCell, styles.cellFlex2, styles.cellText]}>
                  {user.email || '-'}
                </Text>

                {/* Tier */}
                <View style={[styles.tableCell, styles.cellFlex1]}>
                  <View style={[styles.tierBadge, isPro ? styles.tierPro : styles.tierFree]}>
                    {isPro && <Star size={10} color="#CCFF00" />}
                    <Text style={[styles.tierText, isPro ? { color: '#CCFF00' } : { color: '#888' }]}>
                      {isPro ? 'PRO LIFTER' : 'FREE'}
                    </Text>
                  </View>
                </View>

                {/* Status */}
                <View style={[styles.tableCell, styles.cellFlex1]}>
                  <View style={[styles.statusBadge, isSuspended ? styles.statusSuspended : styles.statusActive]}>
                    <Text style={[styles.statusText, isSuspended ? styles.statusTextSuspended : styles.statusTextActive]}>
                      {isSuspended ? 'SUSPENDED' : 'AKTIF'}
                    </Text>
                  </View>
                </View>

                {/* Date */}
                <Text style={[styles.tableCell, styles.cellFlex1, styles.cellTextMuted]}>
                  {joinDate}
                </Text>

                {/* Actions */}
                <View style={[styles.tableCell, styles.cellAction, { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', paddingRight: 16 }]}>
                  <TouchableOpacity 
                    style={styles.actionBtnInfo}
                    onPress={() => openUserDetails(user)}
                    title="Detail"
                  >
                    <Eye color="#CCFF00" size={14} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionBtnWarning, isSuspended && { backgroundColor: 'rgba(204, 255, 0, 0.1)', borderColor: 'rgba(204, 255, 0, 0.2)' }]}
                    onPress={() => setUserToToggleStatus(user)}
                    title={isSuspended ? 'Unsuspend' : 'Suspend'}
                  >
                    {isSuspended ? (
                      <UserCheck color="#CCFF00" size={14} />
                    ) : (
                      <Ban color="#FFA500" size={14} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => setUserToDelete(user)}
                    title="Delete"
                  >
                    <Trash2 color="#FF4444" size={14} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableSection: {
    backgroundColor: '#0E0E14',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1E28',
    padding: 24,
    marginBottom: 28,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#8E8E9F',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14141E',
    borderWidth: 1,
    borderColor: '#222230',
    borderRadius: 10,
    paddingHorizontal: 12,
    minWidth: 260,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    color: '#FFF',
    fontSize: 12,
    paddingVertical: 8,
    flex: 1,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#14141E',
    borderWidth: 1,
    borderColor: '#222230',
  },
  filterPillActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderColor: '#CCFF00',
  },
  filterPillText: {
    color: '#8E8E9F',
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterPillTextActive: {
    color: '#CCFF00',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#1E1E28',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#161622',
    backgroundColor: '#0E0E14',
  },
  tableRowEven: {
    backgroundColor: '#11111A',
  },
  tableHeader: {
    backgroundColor: '#161622',
    borderBottomColor: '#222230',
    paddingVertical: 12,
  },
  headerText: {
    color: '#8E8E9F',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tableCell: {
    justifyContent: 'center',
  },
  cellFlex1: {
    flex: 1,
  },
  cellFlex2: {
    flex: 2,
  },
  cellAction: {
    flex: 1.5,
  },
  cellTextBold: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cellSubText: {
    color: '#666',
    fontSize: 11,
  },
  cellText: {
    color: '#CCC',
    fontSize: 12,
  },
  cellTextMuted: {
    color: '#8E8E9F',
    fontSize: 11,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tierPro: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
  },
  tierFree: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusSuspended: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusTextActive: {
    color: '#10B981',
  },
  statusTextSuspended: {
    color: '#FF4444',
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnInfo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnWarning: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
