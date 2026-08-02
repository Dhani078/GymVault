import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Animated, Easing } from 'react-native';
import { Mail, Lock, User, AtSign, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react-native';
import { AppText, theme, styles } from '../theme';
import { supabase } from '../supabaseClient';
import GymVaultLogo from '../components/GymVaultLogo';
import SmoothScrollView from '../components/SmoothScrollView';

// ─── NOTIFICATION BANNER ───
const BANNER_TYPES = {
  success: { bg: '#0D3B0D', border: '#22C55E', icon: CheckCircle, iconColor: '#22C55E' },
  error: { bg: '#3B0D0D', border: '#EF4444', icon: XCircle, iconColor: '#EF4444' },
  warning: { bg: '#3B2F0D', border: '#F59E0B', icon: AlertTriangle, iconColor: '#F59E0B' },
  info: { bg: '#0D1F3B', border: '#3B82F6', icon: Info, iconColor: '#3B82F6' },
};

function NotifBanner({ type, title, message, visible }) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible && !title) return null;

  const config = BANNER_TYPES[type] || BANNER_TYPES.info;
  const IconComp = config.icon;

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      backgroundColor: config.bg,
      borderWidth: 1,
      borderColor: config.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      <IconComp color={config.iconColor} size={22} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <AppText weight="bold" style={{ fontSize: 15, color: '#FFFFFF', marginBottom: 4 }}>{title}</AppText>
        <AppText style={{ fontSize: 13, color: '#CCCCCC', lineHeight: 18 }}>{message}</AppText>
      </View>
    </Animated.View>
  );
}

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const [notif, setNotif] = useState({ visible: false, type: 'info', title: '', message: '' });

  // Premium Floating Logo Animation
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const showNotif = (type, title, message) => {
    setNotif({ visible: true, type, title, message });
  };

  const clearNotif = () => {
    setNotif({ visible: false, type: 'info', title: '', message: '' });
  };

  // ─── SIGN IN ───
  const handleSignIn = async () => {
    clearNotif();

    if (!identifier.trim() || !password.trim()) {
      showNotif('warning', 'Missing Info', 'Please enter your email/username and password.');
      return;
    }

    setLoading(true);
    let loginEmail = identifier.trim();

    // Username lookup
    if (!loginEmail.includes('@')) {
      showNotif('info', 'Looking up username...', `Searching for "${loginEmail}"...`);
      try {
        // Try RPC function first
        const { data, error } = await supabase.rpc('get_email_by_username', {
          lookup_username: loginEmail.toLowerCase(),
        });
        if (!error && data) {
          loginEmail = data;
        } else {
          // Fallback: query users_profile directly
          const { data: profileData, error: profileError } = await supabase
            .from('users_profile')
            .select('email')
            .eq('username', loginEmail.toLowerCase())
            .single();

          if (profileError || !profileData?.email) {
            setLoading(false);
            showNotif('error', 'Username Not Found', `No account found with username "${loginEmail}". Try using your email address instead.`);
            return;
          }
          loginEmail = profileData.email;
        }
      } catch {
        setLoading(false);
        showNotif('error', 'Lookup Failed', 'Could not look up username. Please try signing in with your email address.');
        return;
      }
    }

    showNotif('info', 'Signing In...', 'Connecting to server...');

    try {
      // CLEAR CACHED PRO STATUS BEFORE LOGIN TO PREVENT ACCOUNT OVERLAP
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.multiRemove([
        'is_premium', 'premium_until', 'premium_since',
        'ai_usage_count', 'ai_routine_daily', 'ai_nutrition_daily',
        'daily_water', 'daily_water_ml'
      ]);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password.trim(),
      });

      setLoading(false);

      if (error) {
        if (error.message.includes('Invalid login')) {
          showNotif('error', 'Login Failed', 'Wrong email/username or password. Double check and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          showNotif('warning', 'Email Not Verified', 'Please check your email inbox and click the verification link first, then try signing in again.');
        } else {
          showNotif('error', 'Login Failed', error.message);
        }
      } else if (data?.session) {
        // --- RESTORE PRO STATUS IF THEY HAVE A REDEEMED CODE ---
        try {
          const { data: promoData, error: promoError } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('used_by', data.session.user.id);
            
          if (!promoError && promoData && promoData.length > 0) {
            const premiumNow = new Date();
            const premiumUntil = new Date();
            premiumUntil.setDate(premiumUntil.getDate() + 30);
            
            const userId = data.session.user.id;
            await AsyncStorage.setItem(`premium_since_${userId}`, premiumNow.toISOString());
            await AsyncStorage.setItem(`premium_until_${userId}`, premiumUntil.toISOString());
            await AsyncStorage.setItem(`is_premium_${userId}`, 'true');
            await AsyncStorage.setItem(`@premium_status_${userId}`, 'active');
          }
        } catch (e) {}
        
        showNotif('success', 'Welcome Back!', 'You are now logged in. Redirecting to dashboard...');
        const { DeviceEventEmitter } = require('react-native');
        DeviceEventEmitter.emit('offline_login', data.session);
      } else {
        showNotif('error', 'No Session', 'The server did not return a session. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      showNotif('error', 'Connection Error', `Could not reach the server: ${err.message}`);
    }
  };

  // ─── SIGN UP ───
  const handleSignUp = async () => {
    clearNotif();

    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      showNotif('warning', 'Missing Info', 'Please fill in all 4 fields: Name, Username, Email, and Password.');
      return;
    }
    // Username: only lowercase letters, numbers, underscores; 3-20 chars
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username.trim().toLowerCase())) {
      showNotif('warning', 'Invalid Username', 'Username must be 3-20 characters using only letters, numbers, and underscores (no spaces or special characters).');
      return;
    }
    if (password.length < 6) {
      showNotif('warning', 'Weak Password', 'Your password must be at least 6 characters long.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showNotif('warning', 'Invalid Email', 'Please enter a valid email address (e.g. you@example.com).');
      return;
    }

    setLoading(true);
    showNotif('info', 'Creating Account...', 'Setting up your GymVault profile...');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            username: username.trim().toLowerCase(),
          },
        },
      });

      setLoading(false);

      if (error) {
        if (error.message.includes('already registered')) {
          showNotif('warning', 'Account Already Exists', 'This email is already registered. Switch to "Sign In" and log in with your password.');
        } else {
          showNotif('error', 'Sign Up Failed', error.message);
        }
      } else if (data?.user?.identities?.length === 0) {
        showNotif('warning', 'Account Already Exists', 'An account with this email already exists. Please switch to "Sign In".');
      } else if (data?.user) {
        // Save email + username to users_profile (fallback if trigger not set up)
        await supabase.from('users_profile').upsert({
          id: data.user.id,
          name: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim(),
        }, { onConflict: 'id' }).then(() => { });

        if (data.session) {
          // Auto-confirmed (email confirmation is OFF)
          showNotif('success', 'Account Created!', 'Welcome to GymVault! You are now logged in. Redirecting...');
        } else {
          // Email confirmation is ON → user needs to verify
          showNotif('success', 'Verification Email Sent!',
            `We sent a verification link to ${email.trim()}.\n\n` +
            '1. Open your email inbox\n' +
            '2. Click the verification link\n' +
            '3. Come back here and Sign In\n\n' +
            'Check your spam folder if you don\'t see it!'
          );
        }
      }
    } catch (err) {
      setLoading(false);
      showNotif('error', 'Connection Error', `Could not reach the server: ${err.message}`);
    }
  };

  // ─── OAUTH ───
  const handleOAuth = async (provider) => {
    clearNotif();
    showNotif('info', `Connecting to ${provider}...`, 'Opening authentication window...');
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) {
        showNotif('error', `${provider} Login Failed`, error.message);
      }
    } catch (err) {
      showNotif('error', 'Connection Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
    <SmoothScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
      {/* Animated Premium Logo */}
      <Animated.View style={{ alignItems: 'center', marginBottom: 40, transform: [{ translateY: floatAnim }] }}>
        <GymVaultLogo size={80} />
        <AppText weight="bold" style={{ fontSize: 36, marginTop: 20, letterSpacing: -1, color: theme.colors.text }}>GymVault</AppText>
        <AppText style={{ color: theme.colors.textMuted, fontSize: 14, marginTop: 4, letterSpacing: 2 }}>ELITE FITNESS</AppText>
      </Animated.View>

      {/* ═══ NOTIFICATION BANNER ═══ */}
      <NotifBanner
        visible={notif.visible}
        type={notif.type}
        title={notif.title}
        message={notif.message}
      />

      {/* Glassmorphism Toggle */}
      <View style={{ flexDirection: 'row', marginBottom: 32, backgroundColor: theme.colors.inputBg, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: theme.colors.border }}>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: isLogin ? theme.colors.card : 'transparent', borderRadius: 12, borderWidth: 1, borderColor: isLogin ? theme.colors.border : 'transparent' }}
          onPress={() => { setIsLogin(true); clearNotif(); }}
        >
          <AppText weight="bold" style={{ color: isLogin ? theme.colors.text : theme.colors.textMuted }}>Sign In</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: !isLogin ? theme.colors.card : 'transparent', borderRadius: 12, borderWidth: 1, borderColor: !isLogin ? theme.colors.border : 'transparent' }}
          onPress={() => { setIsLogin(false); clearNotif(); }}
        >
          <AppText weight="bold" style={{ color: !isLogin ? theme.colors.text : theme.colors.textMuted }}>Sign Up</AppText>
        </TouchableOpacity>
      </View>

      {/* ── SIGN UP FIELDS ── */}
      {!isLogin && (
        <>
          <View style={{ marginBottom: 16 }}>
            <View style={styles.inputWrapper}>
              <User color={theme.colors.textMuted} size={20} style={{ marginRight: 12 }} />
              <TextInput style={styles.textInput} placeholder="Full Name" placeholderTextColor={theme.colors.textMuted} value={fullName} onChangeText={setFullName} />
            </View>
          </View>
          <View style={{ marginBottom: 16 }}>
            <View style={styles.inputWrapper}>
              <AtSign color={theme.colors.textMuted} size={20} style={{ marginRight: 12 }} />
              <TextInput style={styles.textInput} placeholder="Username" placeholderTextColor={theme.colors.textMuted} value={username} onChangeText={(t) => setUsername(t.replace(/\s/g, '').toLowerCase())} autoCapitalize="none" />
            </View>
          </View>
          <View style={{ marginBottom: 16 }}>
            <View style={styles.inputWrapper}>
              <Mail color={theme.colors.textMuted} size={20} style={{ marginRight: 12 }} />
              <TextInput style={styles.textInput} placeholder="Email Address" placeholderTextColor={theme.colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>
        </>
      )}

      {/* ── SIGN IN FIELD ── */}
      {isLogin && (
        <View style={{ marginBottom: 16 }}>
          <View style={styles.inputWrapper}>
            <Mail color={theme.colors.textMuted} size={20} style={{ marginRight: 12 }} />
            <TextInput style={styles.textInput} placeholder="Email or Username" placeholderTextColor={theme.colors.textMuted} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" />
          </View>
        </View>
      )}

      {/* Password */}
      <View style={{ marginBottom: 24 }}>
        <View style={styles.inputWrapper}>
          <Lock color={theme.colors.textMuted} size={20} style={{ marginRight: 12 }} />
          <TextInput style={styles.textInput} placeholder="Password (min 6 chars)" placeholderTextColor={theme.colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
        onPress={isLogin ? handleSignIn : handleSignUp}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color={theme.colors.background} /> : (
          <AppText weight="bold" style={styles.btnPrimaryText}>{isLogin ? 'Sign In' : 'Create Account'}</AppText>
        )}
      </TouchableOpacity>

      {/* OAuth - Coming Soon */}
      <View style={{ alignItems: 'center', marginTop: 16, opacity: 0.5 }}>
        <AppText style={{ color: theme.colors.textMuted, fontSize: 12 }}>Google & Apple Sign-In coming soon</AppText>
      </View>
    </SmoothScrollView>
  </KeyboardAvoidingView>
  );
}
