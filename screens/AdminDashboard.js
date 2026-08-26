import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Platform, Alert, TextInput, RefreshControl } from 'react-native';
import { Users, Activity, BarChart, LogOut, ShieldAlert, Trash2, Eye, Download, X, Ban, UserCheck, Star, TrendingUp, Ticket, Plus, Send, MessageSquare, CheckCircle, Search } from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import AdminStats from '../components/admin/AdminStats';
import UsersTable from '../components/admin/UsersTable';
import PaymentRequestsTable from '../components/admin/PaymentRequestsTable';
import SupportSystem from '../components/admin/SupportSystem';
import NotificationSystem from '../components/admin/NotificationSystem';
import PromoManager from '../components/admin/PromoManager';
import AuditLogs from '../components/admin/AuditLogs';
import AdminSkeleton from '../components/admin/AdminSkeleton';
import SystemHealthWidget from '../components/admin/SystemHealthWidget';

// Modals
import UserModals from '../components/admin/modals/UserModals';
import PromoModals from '../components/admin/modals/PromoModals';
import NotificationModals from '../components/admin/modals/NotificationModals';
import SupportModals from '../components/admin/modals/SupportModals';

import useAdminData from '../hooks/useAdminData';
export default function AdminDashboard() {
  const { colors } = useTheme();
  
  const {
    stats, usersList, searchQuery, setSearchQuery, adminLogs, loading,
    userToDelete, setUserToDelete, userToToggleStatus, setUserToToggleStatus,
    selectedUserDetail, setSelectedUserDetail, userWorkouts, loadingDetail,
    promoCodes, isGeneratingPromo, showPromoModal, setShowPromoModal,
    newPromoConfig, setNewPromoConfig, promoToDelete, setPromoToDelete,
    notifications, isSendingNotif, showNotifModal, setShowNotifModal,
    newNotif, setNewNotif, notifToDelete, setNotifToDelete,
    supportTickets, selectedTicket, setSelectedTicket, isResolvingTicket, isRefreshing,
    paymentRequests, actionLoadingId, handleApprovePayment, handleRejectPayment,
    
    handleSignOut, confirmDeleteUser, confirmToggleStatus, handleTogglePro,
    openUserDetails, handleExportData, generateRandomCode, handleCreatePromoCode,
    confirmDeletePromo, handleCreateNotification, confirmDeleteNotif,
    handleResolveTicket, onRefresh
  } = useAdminData();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'payments' | 'users' | 'promos' | 'notifications' | 'support' | 'audit'

  const pendingPaymentsCount = paymentRequests.filter(p => p.status === 'pending').length;

  return (
    <View style={styles.container}>
      {/* HEADER NAVBAR */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ShieldAlert color="#CCFF00" size={28} />
          <Text style={styles.headerTitle}>CONTROL PANEL</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN SUITE</Text>
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

      {/* ─── INTERACTIVE MODULE NAVIGATION TABS ─── */}
      <View style={styles.navTabsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navTabsScroll}>
          {[
            { key: 'overview', label: '🚀 Overview', count: null },
            { key: 'payments', label: '💳 Verifikasi QRIS', count: pendingPaymentsCount > 0 ? pendingPaymentsCount : null },
            { key: 'users', label: '👥 Database Lifter', count: usersList.length },
            { key: 'promos', label: '🎟️ Promo Engine', count: promoCodes.length },
            { key: 'notifications', label: '📢 Broadcast Push', count: notifications.length },
            { key: 'support', label: '💬 Support Desk', count: supportTickets.filter(t => t.status === 'open').length || null },
            { key: 'audit', label: '📜 Audit Logs', count: null },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.navTabBtn, activeTab === tab.key && styles.navTabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.navTabText, activeTab === tab.key && styles.navTabTextActive]}>
                {tab.label}
              </Text>
              {tab.count !== null && (
                <View style={[styles.navTabBadge, activeTab === tab.key && styles.navTabBadgeActive]}>
                  <Text style={[styles.navTabBadgeText, activeTab === tab.key && { color: '#000' }]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scrollArea} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor="#CCFF00" 
            colors={['#CCFF00']}
            progressBackgroundColor="#1A1A1A"
          />
        }
      >
        
        {loading ? (
          <AdminSkeleton />
        ) : (
          <>
            {/* OVERVIEW MODULE */}
            {activeTab === 'overview' && (
              <>
                {/* ─── LIVE APEX TELEMETRY BAR ─── */}
                <View style={{
                  backgroundColor: '#0D0D11',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#222',
                  padding: 16,
                  marginBottom: 20,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(204,255,0,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(204,255,0,0.25)' }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#CCFF00' }} />
                      <Text style={{ color: '#CCFF00', fontSize: 12, fontWeight: 'bold' }}>Gemini 3.7 Flash Cascade</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(56,189,248,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(56,189,248,0.25)' }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#38BDF8' }} />
                      <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: 'bold' }}>Telegram Super-Admin Bot</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setShowNotifModal(true)}
                      style={{ backgroundColor: 'rgba(204,255,0,0.12)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(204,255,0,0.3)', flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      <Send color="#CCFF00" size={14} />
                      <Text style={{ color: '#CCFF00', fontSize: 12, fontWeight: 'bold' }}>+ Broadcast</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowPromoModal(true)}
                      style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      <Ticket color="#F59E0B" size={14} />
                      <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: 'bold' }}>+ Promo</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <AdminStats stats={stats} />
                <SystemHealthWidget onPing={onRefresh} />
                <PaymentRequestsTable
                  paymentRequests={paymentRequests}
                  loading={loading}
                  onApprove={handleApprovePayment}
                  onReject={handleRejectPayment}
                  actionLoadingId={actionLoadingId}
                />
                <UsersTable 
                  usersList={usersList}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  openUserDetails={openUserDetails}
                  setUserToToggleStatus={setUserToToggleStatus}
                  setUserToDelete={setUserToDelete}
                  onTogglePro={handleTogglePro}
                />
                <AuditLogs adminLogs={adminLogs} />
              </>
            )}

            {/* PAYMENTS MODULE */}
            {activeTab === 'payments' && (
              <PaymentRequestsTable
                paymentRequests={paymentRequests}
                loading={loading}
                onApprove={handleApprovePayment}
                onReject={handleRejectPayment}
                actionLoadingId={actionLoadingId}
              />
            )}

            {/* USERS MODULE */}
            {activeTab === 'users' && (
              <UsersTable 
                usersList={usersList}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                openUserDetails={openUserDetails}
                setUserToToggleStatus={setUserToToggleStatus}
                setUserToDelete={setUserToDelete}
                onTogglePro={handleTogglePro}
              />
            )}

            {/* PROMO MODULE */}
            {activeTab === 'promos' && (
              <PromoManager 
                promoCodes={promoCodes}
                setShowPromoModal={setShowPromoModal}
                setPromoToDelete={setPromoToDelete}
              />
            )}

            {/* NOTIFICATIONS MODULE */}
            {activeTab === 'notifications' && (
              <NotificationSystem 
                notifications={notifications}
                setShowNotifModal={setShowNotifModal}
                setNotifToDelete={setNotifToDelete}
              />
            )}

            {/* SUPPORT MODULE */}
            {activeTab === 'support' && (
              <SupportSystem 
                supportTickets={supportTickets}
                setSelectedTicket={setSelectedTicket}
              />
            )}

            {/* AUDIT & TELEMETRY MODULE */}
            {activeTab === 'audit' && (
              <>
                <SystemHealthWidget onPing={onRefresh} />
                <AuditLogs adminLogs={adminLogs} />
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* USER MODALS */}
      <UserModals
        userToDelete={userToDelete}
        setUserToDelete={setUserToDelete}
        confirmDeleteUser={confirmDeleteUser}
        userToToggleStatus={userToToggleStatus}
        setUserToToggleStatus={setUserToToggleStatus}
        confirmToggleStatus={confirmToggleStatus}
        selectedUserDetail={selectedUserDetail}
        setSelectedUserDetail={setSelectedUserDetail}
        userWorkouts={userWorkouts}
        loadingDetail={loadingDetail}
      />

      {/* PROMO MODALS */}
      <PromoModals
        promoToDelete={promoToDelete}
        setPromoToDelete={setPromoToDelete}
        confirmDeletePromo={confirmDeletePromo}
        showPromoModal={showPromoModal}
        setShowPromoModal={setShowPromoModal}
        newPromoConfig={newPromoConfig}
        setNewPromoConfig={setNewPromoConfig}
        generateRandomCode={generateRandomCode}
        handleCreatePromoCode={handleCreatePromoCode}
        isGeneratingPromo={isGeneratingPromo}
      />

      {/* NOTIFICATION MODALS */}
      <NotificationModals
        showNotifModal={showNotifModal}
        setShowNotifModal={setShowNotifModal}
        newNotif={newNotif}
        setNewNotif={setNewNotif}
        handleCreateNotification={handleCreateNotification}
        isSendingNotif={isSendingNotif}
        notifToDelete={notifToDelete}
        setNotifToDelete={setNotifToDelete}
        confirmDeleteNotif={confirmDeleteNotif}
      />

      {/* SUPPORT TICKET MODAL */}
      <SupportModals
        selectedTicket={selectedTicket}
        setSelectedTicket={setSelectedTicket}
        handleResolveTicket={handleResolveTicket}
        isResolvingTicket={isResolvingTicket}
      />

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
  navTabsBar: {
    backgroundColor: '#0E0E14',
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E28',
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  navTabsScroll: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  navTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#14141E',
    borderWidth: 1,
    borderColor: '#222230',
  },
  navTabBtnActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderColor: '#CCFF00',
  },
  navTabText: {
    color: '#8E8E9F',
    fontSize: 13,
    fontWeight: 'bold',
  },
  navTabTextActive: {
    color: '#CCFF00',
  },
  navTabBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  navTabBadgeActive: {
    backgroundColor: '#CCFF00',
  },
  navTabBadgeText: {
    color: '#CCFF00',
    fontSize: 10,
    fontWeight: 'bold',
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
  chartSection: {
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
    marginBottom: 30,
  },
  chartSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 12,
    width: 300,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFF',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    outlineStyle: 'none',
  },
  chartTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  chartTrendText: {
    color: '#CCFF00',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 20,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  barTrack: {
    width: 40,
    height: 140,
    backgroundColor: '#111111',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#CCFF00',
    borderRadius: 8,
  },
  barLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#888888',
    marginTop: 12,
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  statusSuspended: {
    backgroundColor: 'rgba(255, 165, 0, 0.05)',
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  statusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  statusTextActive: {
    color: '#CCFF00',
  },
  statusTextSuspended: {
    color: '#FFA500',
  },
  actionBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  actionBtnWarning: {
    padding: 8,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.2)',
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
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    outlineStyle: 'none',
  },
  generateBtn: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateBtnText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#CCFF00',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#CCFF00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    fontFamily: 'Inter_700Bold',
    color: '#000000',
    fontSize: 16,
  }
});
