import React, { useState, useEffect, Suspense, lazy } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { Globe, Smartphone, ShieldCheck, ArrowLeft } from 'lucide-react-native';

// High-Performance Dynamic Code Splitting for Desktop Views
const LandingPage = lazy(() => import('../screens/LandingPage'));
const AdminDashboard = lazy(() => import('../screens/AdminDashboard'));

function DesktopFallbackLoader() {
  return (
    <View style={[styles.center, { backgroundColor: '#000000' }]}>
      <ActivityIndicator size="large" color="#D4F53C" />
    </View>
  );
}

export default function AdaptiveLayout({ children, session }) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(false);
  
  // View mode switcher on Desktop: 'auto' | 'landing' | 'app' | 'admin'
  const [desktopView, setDesktopView] = useState('auto');
  const [showLogin, setShowLogin] = useState(false);

  const isDesktop = width >= 768;

  // Ekstrak kondisi aktif per chip supaya tidak ada duplikasi logika
  const isLandingActive = desktopView === 'landing' || (desktopView === 'auto' && !session && !showLogin);
  const isAdminActive = desktopView === 'admin' || (desktopView === 'auto' && session && role === 'admin');
  const isAppActive = desktopView === 'app' || (desktopView === 'auto' && (session && role !== 'admin' || showLogin));

  useEffect(() => {
    // 🛡️ ANTI-HACK: Fetch role directly from Supabase DB on server-side
    const fetchUserRole = async () => {
      if (session?.user?.id && isDesktop) {
        setLoadingRole(true);
        try {
          const { data, error } = await supabase
            .from('users_profile')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          if (!error && data) {
            setRole(data.role); // e.g. 'admin' or 'user'
          }
        } catch (e) {

        } finally {
          setLoadingRole(false);
        }
      }
    };
    
    fetchUserRole();
  }, [session, isDesktop]);

  // 1. MOBILE VIEWPORT (< 768px)
  // Kembalikan 100% tampilan HP asli tanpa modifikasi apapun.
  if (!isDesktop) {
    return <>{children}</>;
  }

  // --- PC / DESKTOP VIEWPORT LOGIC (≥ 768px) ---

  if (loadingRole) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background || '#000000' }]}>
        <ActivityIndicator size="large" color="#D4F53C" />
      </View>
    );
  }

  // Top Floating Desktop View Mode Switcher
  const renderDesktopSwitcher = () => (
    <View style={styles.floatingSwitcher}>
      <TouchableOpacity
        style={[styles.switchChip, isLandingActive ? styles.switchChipActive : null]}
        onPress={() => { setDesktopView('landing'); setShowLogin(false); }}
      >
        <Globe size={13} color={isLandingActive ? '#000' : '#888'} />
        <Text style={[styles.switchChipText, isLandingActive ? styles.switchChipTextActive : null]}>
          Landing Page
        </Text>
      </TouchableOpacity>

      {session && role === 'admin' && (
        <TouchableOpacity
          style={[styles.switchChip, isAdminActive ? styles.switchChipActive : null]}
          onPress={() => setDesktopView('admin')}
        >
          <ShieldCheck size={13} color={isAdminActive ? '#000' : '#888'} />
          <Text style={[styles.switchChipText, isAdminActive ? styles.switchChipTextActive : null]}>
            Admin Panel
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.switchChip, isAppActive ? styles.switchChipActive : null]}
        onPress={() => { setDesktopView('app'); setShowLogin(true); }}
      >
        <Smartphone size={13} color={isAppActive ? '#000' : '#888'} />
        <Text style={[styles.switchChipText, isAppActive ? styles.switchChipTextActive : null]}>
          {session ? 'App View' : 'Login / App'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Forced View Mode Handlers
  if (desktopView === 'landing') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {renderDesktopSwitcher()}
        <Suspense fallback={<DesktopFallbackLoader />}>
          <LandingPage onLoginPress={() => { setDesktopView('app'); setShowLogin(true); }} />
        </Suspense>
      </View>
    );
  }

  if (desktopView === 'admin' && session && role === 'admin') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {renderDesktopSwitcher()}
        <Suspense fallback={<DesktopFallbackLoader />}>
          <AdminDashboard />
        </Suspense>
      </View>
    );
  }

  if (desktopView === 'app') {
    return (
      <View style={[styles.desktopContainer, { backgroundColor: '#0A0A0A' }]}>
        {renderDesktopSwitcher()}
        <View style={styles.mobileMockupFrame}>
          {children}
        </View>
      </View>
    );
  }

  // Auto Default Mode:
  // 2. GUEST PC (Belum Login)
  if (!session) {
    if (showLogin) {
      return (
        <View style={[styles.desktopContainer, { backgroundColor: '#0A0A0A' }]}>
          {renderDesktopSwitcher()}
          <View style={styles.mobileMockupFrame}>
            {children}
          </View>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {renderDesktopSwitcher()}
        <Suspense fallback={<DesktopFallbackLoader />}>
          <LandingPage onLoginPress={() => setShowLogin(true)} />
        </Suspense>
      </View>
    );
  }

  // 3. ADMIN PC (Sudah Login & Role = 'admin')
  if (session && role === 'admin') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {renderDesktopSwitcher()}
        <Suspense fallback={<DesktopFallbackLoader />}>
          <AdminDashboard />
        </Suspense>
      </View>
    );
  }

  // 4. REGULAR USER PC (Sudah Login & Role != 'admin')
  return (
    <View style={[styles.desktopContainer, { backgroundColor: '#0A0A0A' }]}>
      {renderDesktopSwitcher()}
      <View style={styles.mobileMockupFrame}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileMockupFrame: {
    width: 450,
    height: '90%',
    maxHeight: 900,
    backgroundColor: '#000000',
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#1A1A1A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 50,
    elevation: 20,
  },
  floatingSwitcher: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 15, 20, 0.92)', // sedikit lebih opaque: ganti backdropFilter yg tidak jalan di native
    padding: 5,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  switchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  switchChipActive: {
    backgroundColor: '#D4F53C',
  },
  switchChipText: {
    color: '#888888',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  switchChipTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  }
});
