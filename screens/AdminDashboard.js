import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Platform, Alert } from 'react-native';
import { Users, Activity, BarChart, LogOut, ShieldAlert, Trash2, Eye, Download, X } from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminDashboard() {
  const { colors } = useTheme();
  
  // States
  const [stats, setStats] = useState({ totalUsers: 0, totalWorkouts: 0, activeToday: 0 });
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State for Delete
  const [userToDelete, setUserToDelete] = useState(null);

  // Modal State for Detail
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userWorkouts, setUserWorkouts] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data semua user
      const { data: users, error: userError } = await supabase
        .from('users_profile')
        .select('*')
        .order('created_at', { ascending: false });

      if (userError) throw userError;
      
      // 2. Ambil statistik workout (dummy stats for now, can be replaced with actual COUNT query)
      const { count: workoutCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true });

      setUsersList(users || []);
      setStats({
        totalUsers: users?.length || 0,
        totalWorkouts: workoutCount || 0,
        activeToday: Math.floor((users?.length || 0) * 0.3) // Estimasi dummy 30% aktif hari ini
      });
      
    } catch (e) {
      console.warn('[AdminDashboard] Fetch Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Menghapus data dari users_profile. (Catatan: Auth Supabase mungkin perlu function khusus)
      const { error } = await supabase
        .from('users_profile')
        .delete()
        .eq('id', userToDelete.id);
        
      if (error) throw error;
      
      // Update UI
      setUsersList(usersList.filter(u => u.id !== userToDelete.id));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
    } catch (e) {
      console.warn('[AdminDashboard] Delete Error:', e);
    } finally {
      setUserToDelete(null);
    }
  };

  const openUserDetails = async (user) => {
    setSelectedUserDetail(user);
    setLoadingDetail(true);
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5); // 5 aktivitas terakhir
        
      if (!error && data) {
        setUserWorkouts(data);
      } else {
        setUserWorkouts([]);
      }
    } catch (e) {
      console.warn('[AdminDashboard] Fetch Detail Error:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExportData = () => {
    if (usersList.length === 0) return;
    
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      Alert.alert("Perhatian", "Fitur Export CSV hanya didukung di versi Web (PC).");
      return;
    }
    
    try {
      let csvContent = "data:text/csv;charset=utf-8,ID,Username,Email,Role,Tanggal Bergabung\n";
      
      usersList.forEach(user => {
        const date = user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : '';
        const row = `"${user.id}","${user.username || ''}","${user.email || ''}","${user.role || 'user'}","${date}"`;
        csvContent += row + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `GymVault_Users_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('[AdminDashboard] Export Error:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER NAVBAR */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ShieldAlert color="#CCFF00" size={28} />
          <Text style={styles.headerTitle}>CONTROL PANEL</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportData} activeOpacity={0.8}>
            <Download color="#000000" size={16} />
            <Text style={styles.exportText}>Export CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <LogOut color="#FF4444" size={18} />
            <Text style={styles.signOutText}>Keluar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        
        {loading ? (
          <View style={{ marginTop: 100 }}>
            <ActivityIndicator size="large" color="#CCFF00" />
          </View>
        ) : (
          <>
            {/* STATS OVERVIEW CARDS */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconBox}>
                  <Users color="#CCFF00" size={24} />
                </View>
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Player / User</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconBox}>
                  <Activity color="#CCFF00" size={24} />
                </View>
                <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
                <Text style={styles.statLabel}>Total Sesi Latihan</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconBox}>
                  <BarChart color="#CCFF00" size={24} />
                </View>
                <Text style={styles.statValue}>{stats.activeToday}</Text>
                <Text style={styles.statLabel}>Aktif Hari Ini (Est.)</Text>
              </View>
            </View>

            {/* USERS DATA TABLE */}
            <View style={styles.tableSection}>
              <Text style={styles.sectionTitle}>Database Pengguna</Text>
              
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>Username</Text>
                  <Text style={[styles.tableCell, styles.cellFlex2, styles.headerText]}>Email</Text>
                  <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Role</Text>
                  <Text style={[styles.tableCell, styles.cellFlex1, styles.headerText]}>Bergabung</Text>
                  <Text style={[styles.tableCell, styles.cellAction, styles.headerText, { textAlign: 'right', paddingRight: 24 }]}>Aksi</Text>
                </View>

                {/* Table Body */}
                {usersList.map((user, index) => {
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
          </>
        )}
      </ScrollView>

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

      {/* USER DETAIL MODAL */}
      <Modal
        visible={!!selectedUserDetail}
        transparent={true}
        animationType="fade"
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
              ) : userWorkouts.length > 0 ? (
                userWorkouts.map((session, idx) => (
                  <View key={session.id || idx} style={styles.workoutItem}>
                    <Activity color="#666" size={16} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.workoutName}>{session.workout_name || 'Latihan Custom'}</Text>
                      <Text style={styles.workoutDate}>{new Date(session.created_at).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.workoutDuration}>{session.duration ? `${Math.floor(session.duration / 60)} mnt` : '-'}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    height: 80,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    letterSpacing: 1,
  },
  adminBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  adminBadgeText: {
    color: '#CCFF00',
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#CCFF00',
    borderRadius: 100,
  },
  exportText: {
    color: '#000000',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  signOutText: {
    color: '#FF4444',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 40,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#888888',
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  tableSection: {
    flex: 1,
  },
  tableContainer: {
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  tableRowEven: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tableHeader: {
    backgroundColor: '#111111',
    paddingVertical: 20,
  },
  tableCell: {
    justifyContent: 'center',
  },
  cellFlex1: { flex: 1 },
  cellFlex2: { flex: 2 },
  cellAction: { width: 100 },
  headerText: {
    fontFamily: 'Inter_500Medium',
    color: '#888888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cellText: {
    fontFamily: 'Inter_400Regular',
    color: '#CCCCCC',
    fontSize: 14,
  },
  cellTextBold: {
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    fontSize: 14,
  },
  cellTextMuted: {
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    fontSize: 14,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  roleUser: {
    backgroundColor: '#1A1A1A',
  },
  roleAdmin: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  roleText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#888888',
    letterSpacing: 1,
  },
  roleTextAdmin: {
    color: '#CCFF00',
  },
  actionBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  actionBtnInfo: {
    padding: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
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
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 12,
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
    gap: 16,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    fontSize: 14,
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF4444',
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    width: '100%',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  detailSubtitle: {
    fontFamily: 'Inter_400Regular',
    color: '#888888',
    fontSize: 14,
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  detailBody: {
    width: '100%',
  },
  detailSectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    color: '#CCCCCC',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  workoutName: {
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    fontSize: 14,
  },
  workoutDate: {
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    fontSize: 12,
    marginTop: 2,
  },
  workoutDuration: {
    fontFamily: 'Inter_600SemiBold',
    color: '#CCFF00',
    fontSize: 14,
  },
  emptyDetailBox: {
    paddingVertical: 32,
    alignItems: 'center',
  }
});
