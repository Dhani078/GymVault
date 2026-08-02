import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { AppText, theme, styles } from '../theme';

export default function LoginScreen({ onLogin, onCreateAccount }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View style={styles.logoBox}>
            <AppText weight="bold" style={{ fontSize: 28, color: theme.colors.primary }}>G</AppText>
          </View>
          <AppText weight="bold" style={{ fontSize: 32, marginTop: 16, letterSpacing: -1 }}>GymVault</AppText>
        </View>

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <View style={styles.inputWrapper}>
            <Mail color={theme.colors.textMuted} size={20} style={{ marginRight: 12 }} />
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Password */}
        <View style={{ marginBottom: 24 }}>
          <View style={styles.inputWrapper}>
            <Lock color={theme.colors.textMuted} size={20} style={{ marginRight: 12 }} />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.btnPrimary} onPress={onLogin}>
          <AppText weight="bold" style={styles.btnPrimaryText}>Sign in with Email</AppText>
        </TouchableOpacity>

        {/* Create Account */}
        <TouchableOpacity style={[styles.btnGhost, { marginTop: 16 }]} onPress={onCreateAccount}>
          <AppText weight="medium" style={{ color: theme.colors.textMuted }}>Create Account</AppText>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
