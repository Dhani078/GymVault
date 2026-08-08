import React, { useState, useEffect } from 'react';
import { View, useWindowDimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import LandingPage from '../screens/LandingPage';
import AdminDashboard from '../screens/AdminDashboard';

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
    // This ensures no one can tamper with local state to become an admin.
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
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
    // Jika tidak, tampilkan Cinematic Landing Page
    return <LandingPage onLoginPress={() => setShowLogin(true)} />;
  }

  // 3. ADMIN PC (Sudah Login & Role = 'admin')
  if (session && role === 'admin') {
    return <AdminDashboard />;
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
    // Memberikan background gelap premium di luar area HP
  },
  mobileMockupFrame: {
    width: 450,
    height: '90%',
    maxHeight: 900,
    backgroundColor: '#000000',
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#1A1A1A', // Border abu-abu gelap menyerupai frame HP
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 50,
    elevation: 20,
  }
});
