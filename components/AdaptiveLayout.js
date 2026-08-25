import React, { useState, useEffect, Suspense, lazy } from 'react';
import { View, useWindowDimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';

// High-Performance Dynamic Code Splitting for Desktop Views
const LandingPage = lazy(() => import('../screens/LandingPage'));
const AdminDashboard = lazy(() => import('../screens/AdminDashboard'));

function DesktopFallbackLoader() {
  return (
    <View style={[styles.center, { backgroundColor: '#000000' }]}>
      <ActivityIndicator size="large" color="#CCFF00" />
    </View>
  );
}

export default function AdaptiveLayout({ children, session }) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(false);
  
  // State khusus agar tamu (guest) di PC bisa masuk ke halaman Login HP
  const [showLogin, setShowLogin] = useState(false);

  const isDesktop = width >= 768;

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
          console.warn('[AdaptiveLayout] Error fetching role:', e);
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
        <ActivityIndicator size="large" color="#CCFF00" />
      </View>
    );
  }

  // 2. GUEST PC (Belum Login)
  if (!session) {
    // Jika user klik "Masuk / Login" di Landing Page, tampilkan halaman Auth (bawaan HP)
    if (showLogin) {
      return (
        <View style={[styles.desktopContainer, { backgroundColor: '#0A0A0A' }]}>
          <View style={styles.mobileMockupFrame}>
            {children}
          </View>
        </View>
      );
    }
    // Jika tidak, tampilkan Cinematic Landing Page with Suspense
    return (
      <Suspense fallback={<DesktopFallbackLoader />}>
        <LandingPage onLoginPress={() => setShowLogin(true)} />
      </Suspense>
    );
  }

  // 3. ADMIN PC (Sudah Login & Role = 'admin')
  if (session && role === 'admin') {
    return (
      <Suspense fallback={<DesktopFallbackLoader />}>
        <AdminDashboard />
      </Suspense>
    );
  }

  // 4. REGULAR USER PC (Sudah Login & Role != 'admin')
  // Menampilkan aplikasi HP di tengah layar desktop dengan border/bayangan (Mockup Style)
  return (
    <View style={[styles.desktopContainer, { backgroundColor: '#0A0A0A' }]}>
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
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 50,
    elevation: 20,
  }
});
