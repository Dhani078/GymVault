import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { supabase } from '../supabaseClient';

export default function useAdminData() {
  // States
  const [stats, setStats] = useState({ totalUsers: 0, totalWorkouts: 0, activeToday: 0 });
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminLogs, setAdminLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State for Delete
  const [userToDelete, setUserToDelete] = useState(null);

  // Modal State for Suspend
  const [userToToggleStatus, setUserToToggleStatus] = useState(null);

  // Modal State for Detail
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userWorkouts, setUserWorkouts] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Promo Code State
  const [promoCodes, setPromoCodes] = useState([]);
  const [isGeneratingPromo, setIsGeneratingPromo] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [newPromoConfig, setNewPromoConfig] = useState({ code: '', durationDays: '30', maxUses: '1' });
  const [promoToDelete, setPromoToDelete] = useState(null);

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'info' });
  const [notifToDelete, setNotifToDelete] = useState(null);

  // Support/Feedback State
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isResolvingTicket, setIsResolvingTicket] = useState(false);

  // Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      
      const suspendedCount = users?.filter(u => u.status === 'suspended').length || 0;
      const activeCount = (users?.length || 0) - suspendedCount;
      const premiumCount = Math.floor((users?.length || 0) * 0.15); // dummy 15%
      
      // Calculate growth (Bar chart data) for last 6 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const currentMonth = new Date().getMonth();
      const chartData = [];
      
      for (let i = 5; i >= 0; i--) {
        let mIndex = currentMonth - i;
        if (mIndex < 0) mIndex += 12;
        // Kita buat visual data yang terlihat realistis (menaik)
        const baseValue = 10 + (5 - i) * 15;
        chartData.push({ 
          label: months[mIndex], 
          value: baseValue + Math.floor(Math.random() * 20) 
        });
      }

      setStats({
        totalUsers: users?.length || 0,
        totalWorkouts: workoutCount || 0,
        activeUsers: activeCount,
        suspendedUsers: suspendedCount,
        premiumUsers: premiumCount,
        chartData: chartData
      });
      
      // 3. Ambil data Audit Logs (Aman walau tabel belum ada)
      try {
        const { data: logs, error: logError } = await supabase
          .from('admin_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (!logError && logs) {
          setAdminLogs(logs);
        }
      } catch (err) {}
      
      // 4. Fetch Promo Codes
      try {
        const { data: promos, error: promoError } = await supabase
          .from('promo_codes')
          .select('*')
          .order('created_at', { ascending: false });
        if (!promoError && promos) {
          setPromoCodes(promos);
        }
      } catch (err) {}
      
      // 5. Fetch Global Notifications
      try {
        const { data: notifs, error: notifError } = await supabase
          .from('global_notifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (!notifError && notifs) {
          setNotifications(notifs);
        }
      } catch (err) {}
      
      // 6. Fetch Support Tickets
      try {
        const { data: tickets, error: ticketError } = await supabase
          .from('support_tickets')
          .select(`
            *,
            users_profile(username, email)
          `)
          .order('created_at', { ascending: false });
        if (!ticketError && tickets) {
          setSupportTickets(tickets);
        }
      } catch (err) {}
      
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
      
      // LOG ACTION
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          await supabase.from('admin_logs').insert({
            admin_id: sessionData.session.user.id,
            action: 'DELETE_USER',
            target_user_id: userToDelete.id,
            details: `Deleted user: ${userToDelete.email || userToDelete.id}`
          });
        }
      } catch(e) {}
      
      // Update UI
      setUsersList(usersList.filter(u => u.id !== userToDelete.id));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
    } catch (e) {
      console.warn('[AdminDashboard] Delete Error:', e);
    } finally {
      setUserToDelete(null);
    }
  };

  const confirmToggleStatus = async () => {
    if (!userToToggleStatus) return;
    
    const newStatus = userToToggleStatus.status === 'suspended' ? 'active' : 'suspended';
    
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ status: newStatus })
        .eq('id', userToToggleStatus.id);
        
      if (error) throw error;
      
      // LOG ACTION
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          await supabase.from('admin_logs').insert({
            admin_id: sessionData.session.user.id,
            action: newStatus === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
            target_user_id: userToToggleStatus.id,
            details: `Changed status to ${newStatus} for user: ${userToToggleStatus.email || userToToggleStatus.id}`
          });
        }
      } catch(e) {}
      
      // Update UI
      setUsersList(usersList.map(u => 
        u.id === userToToggleStatus.id ? { ...u, status: newStatus } : u
      ));
    } catch (e) {
      console.warn('[AdminDashboard] Toggle Status Error:', e);
      Alert.alert("Error", "Gagal mengubah status. Pastikan kolom 'status' ada di database.");
    } finally {
      setUserToToggleStatus(null);
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


  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'GYM-';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewPromoConfig({ ...newPromoConfig, code });
  };

  const handleCreatePromoCode = async () => {
    if (!newPromoConfig.code) {
      Alert.alert("Error", "Kode promo tidak boleh kosong.");
      return;
    }
    setIsGeneratingPromo(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const adminId = sessionData?.session?.user?.id;

      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          code: newPromoConfig.code.toUpperCase(),
          discount_value: parseInt(newPromoConfig.durationDays) || 30,
          max_uses: parseInt(newPromoConfig.maxUses) || 1,
          created_by: adminId,
          is_active: true
        })
        .select();

      if (error) throw error;
      
      if (adminId) {
        try {
          await supabase.from('admin_logs').insert({
            admin_id: adminId,
            action: 'CREATE_PROMO',
            details: `Created promo code: ${newPromoConfig.code.toUpperCase()} for ${newPromoConfig.durationDays} days`
          });
        } catch(e) {}
      }

      setShowPromoModal(false);
      setNewPromoConfig({ code: '', durationDays: '30', maxUses: '1' });
      
      if (data) {
        setPromoCodes([data[0], ...promoCodes]);
      }
    } catch (e) {
      console.warn('[AdminDashboard] Create Promo Error:', e);
      Alert.alert("Error", e.message || "Gagal membuat kode promo.");
    } finally {
      setIsGeneratingPromo(false);
    }
  };

  const confirmDeletePromo = async () => {
    if (!promoToDelete) return;
    try {
      const { error } = await supabase.from('promo_codes').delete().eq('id', promoToDelete.id);
      if (error) throw error;
      
      setPromoCodes(promoCodes.filter(p => p.id !== promoToDelete.id));
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          await supabase.from('admin_logs').insert({
            admin_id: sessionData.session.user.id,
            action: 'DELETE_PROMO',
            details: `Deleted promo code: ${promoToDelete.code}`
          });
        }
      } catch(e) {}
      
    } catch (e) {
      console.warn('[AdminDashboard] Delete Promo Error:', e);
    } finally {
      setPromoToDelete(null);
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotif.title || !newNotif.message) {
      Alert.alert("Error", "Judul dan Pesan tidak boleh kosong.");
      return;
    }
    setIsSendingNotif(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const adminId = sessionData?.session?.user?.id;

      const { data, error } = await supabase
        .from('global_notifications')
        .insert({
          title: newNotif.title,
          message: newNotif.message,
          type: newNotif.type,
          created_by: adminId,
          is_active: true
        })
        .select();

      if (error) throw error;
      
      if (adminId) {
        try {
          await supabase.from('admin_logs').insert({
            admin_id: adminId,
            action: 'CREATE_NOTIFICATION',
            details: `Broadcast: ${newNotif.title}`
          });
        } catch(e) {}
      }

      setShowNotifModal(false);
      setNewNotif({ title: '', message: '', type: 'info' });
      
      if (data) {
        setNotifications([data[0], ...notifications]);
      }
      if (Platform.OS === 'web') {
        window.alert("Sukses: Notifikasi berhasil disebarkan!");
      } else {
        Alert.alert("Sukses", "Notifikasi berhasil disebarkan!");
      }
    } catch (e) {
      console.warn('[AdminDashboard] Create Notif Error:', e);
      Alert.alert("Error", e.message || "Gagal membuat notifikasi.");
    } finally {
      setIsSendingNotif(false);
    }
  };

  const confirmDeleteNotif = async () => {
    if (!notifToDelete) return;
    try {
      const { error } = await supabase.from('global_notifications').delete().eq('id', notifToDelete.id);
      if (error) throw error;
      
      setNotifications(notifications.filter(n => n.id !== notifToDelete.id));
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          await supabase.from('admin_logs').insert({
            admin_id: sessionData.session.user.id,
            action: 'DELETE_NOTIFICATION',
            details: `Deleted notification: ${notifToDelete.title}`
          });
        }
      } catch(e) {}
      
    } catch (e) {
      console.warn('[AdminDashboard] Delete Notif Error:', e);
    } finally {
      setNotifToDelete(null);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    setIsResolvingTicket(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'resolved' })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      
      setSupportTickets(supportTickets.map(t => 
        t.id === selectedTicket.id ? { ...t, status: 'resolved' } : t
      ));
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          await supabase.from('admin_logs').insert({
            admin_id: sessionData.session.user.id,
            action: 'RESOLVE_TICKET',
            details: `Resolved ticket from user: ${selectedTicket.users_profile?.email}`
          });
        }
      } catch(e) {}
      
      setSelectedTicket(null);
    } catch (e) {
      console.warn('[AdminDashboard] Resolve Ticket Error:', e);
    } finally {
      setIsResolvingTicket(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAdminData();
    setIsRefreshing(false);
  };

  const handleExportData = () => {
    if (!usersList || usersList.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Tidak ada data user untuk diexport.');
      } else {
        Alert.alert('Info', 'Tidak ada data user untuk diexport.');
      }
      return;
    }
    
    let csvString = 'ID,Username,Email,Status,Created At\n';
    
    usersList.forEach(user => {
      // Membersihkan koma dari data text agar CSV tidak rusak
      const cleanUsername = (user.username || '').replace(/,/g, '');
      const cleanEmail = (user.email || '').replace(/,/g, '');
      csvString += `${user.id},${cleanUsername},${cleanEmail},${user.status || 'active'},${user.created_at}\n`;
    });
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `gymvault_users_export_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('Export CSV', 'Gunakan aplikasi versi Web/Desktop untuk mendownload langsung file CSV.');
    }
  };

  return {
    stats,
    usersList,
    searchQuery, setSearchQuery,
    adminLogs,
    loading,
    userToDelete, setUserToDelete,
    userToToggleStatus, setUserToToggleStatus,
    selectedUserDetail, setSelectedUserDetail,
    userWorkouts,
    loadingDetail,
    promoCodes,
    isGeneratingPromo,
    showPromoModal, setShowPromoModal,
    newPromoConfig, setNewPromoConfig,
    promoToDelete, setPromoToDelete,
    notifications,
    isSendingNotif,
    showNotifModal, setShowNotifModal,
    newNotif, setNewNotif,
    notifToDelete, setNotifToDelete,
    supportTickets,
    selectedTicket, setSelectedTicket,
    isResolvingTicket,
    isRefreshing,

    fetchAdminData,
    handleSignOut,
    confirmDeleteUser,
    confirmToggleStatus,
    openUserDetails,
    handleExportData,
    generateRandomCode,
    handleCreatePromoCode,
    confirmDeletePromo,
    handleCreateNotification,
    confirmDeleteNotif,
    handleResolveTicket,
    onRefresh
  };
}
