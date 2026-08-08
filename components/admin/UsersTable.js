import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, Eye, UserCheck, Ban, Trash2 } from 'lucide-react-native';

export default function UsersTable({ 
  usersList, 
  searchQuery, 
  setSearchQuery, 
  openUserDetails, 
  setUserToToggleStatus, 
  setUserToDelete 
}) {
  return (
    <View style={styles.tableSection}>
      <View style={[styles.chartHeader, { marginBottom: 20 }]}>
        <View>
          <Text style={styles.sectionTitle}>Database Pengguna</Text>
          <Text style={styles.chartSubtitle}>Kelola semua akun pengguna</Text>
        </View>
        <View style={styles.searchContainer}>
          <Search color="#888" size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari email atau username..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <View style={styles.tableContainer}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>Username</Text>
          <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>Email</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Role</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Status</Text>
          <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Bergabung</Text>
          <Text style={[styles.tableCell, styles.cellAction, styles.headerText, { textAlign: 'right', paddingRight: 24 }]}>Aksi</Text>
        </View>

        {/* Table Body */}
        {usersList.filter(user => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return (
            (user.email && user.email.toLowerCase().includes(query)) ||
            (user.username && user.username.toLowerCase().includes(query)) ||
            (user.name && user.name.toLowerCase().includes(query))
          );
        }).map((user, index) => {
          const isEven = index % 2 === 0;
          return (
            <View key={user.id || index} style={[styles.tableRow, isEven && styles.tableRowEven]}>
              <Text style={[styles.tableCell, styles.cellFlex2, styles.cellTextBold]}>
                {user.username || user.name || 'Unknown'}
              </Text>
              <Text style={[styles.tableCell, styles.cellFlex2, styles.cellText]}>
                {user.email || '-'}
              </Text>
              <View style={[styles.tableCell, styles.cellFlex1]}>
                <View style={[styles.roleBadge, user.role === 'admin' ? styles.roleAdmin : styles.roleUser]}>
                  <Text style={[styles.roleText, user.role === 'admin' && styles.roleTextAdmin]}>
                    {(user.role || 'user').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, styles.cellFlex1]}>
                <View style={[styles.statusBadge, user.status === 'suspended' ? styles.statusSuspended : styles.statusActive]}>
                  <Text style={[styles.statusText, user.status === 'suspended' ? styles.statusTextSuspended : styles.statusTextActive]}>
                    {(user.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.tableCell, styles.cellFlex1, styles.cellTextMuted]}>
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
              </Text>
              <View style={[styles.tableCell, styles.cellAction, { flexDirection: 'row', gap: 12, justifyContent: 'flex-end', paddingRight: 24 }]}>
                <TouchableOpacity 
                  style={styles.actionBtnInfo}
                  onPress={() => openUserDetails(user)}
                >
                  <Eye color="#CCFF00" size={16} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionBtnWarning, user.status === 'suspended' && { backgroundColor: 'rgba(204, 255, 0, 0.1)', borderColor: 'rgba(204, 255, 0, 0.2)' }]}
                  onPress={() => setUserToToggleStatus(user)}
                >
                  {user.status === 'suspended' ? (
                    <UserCheck color="#CCFF00" size={16} />
                  ) : (
                    <Ban color="#FFA500" size={16} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => setUserToDelete(user)}
                >
                  <Trash2 color="#FF4444" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {usersList.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={styles.cellTextMuted}>Tidak ada data pengguna.</Text>
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
    marginBottom: 40,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    paddingHorizontal: 16,
    height: 44,
    width: 300,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    outlineStyle: 'none',
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
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  roleAdmin: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  roleUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#888',
  },
  roleTextAdmin: {
    color: '#CCFF00',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
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
  actionBtnWarning: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
