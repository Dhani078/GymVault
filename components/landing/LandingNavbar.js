import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Dumbbell, ArrowRight } from 'lucide-react-native';

export default function LandingNavbar({ onLoginPress, styles, isLarge }) {
  return (
    <View style={[styles.header, { paddingHorizontal: isLarge ? 80 : 24 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={styles.logoBadge}>
          <Dumbbell color="#D4F53C" size={24} />
        </View>
        <View>
          <Text style={styles.logoText}>GYMVAULT</Text>
          <Text style={styles.logoTagline}>THE ADAPTIVE ENGINE</Text>
        </View>
      </View>

      {isLarge && (
        <View style={styles.navLinks}>
          <View style={styles.statusLive}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>99.9% Uptime • Gemini 3.7 Multi-Model Cascade</Text>
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity style={styles.loginBtn} onPress={onLoginPress} activeOpacity={0.8}>
          <Text style={styles.loginBtnText}>Buka Web App</Text>
          <ArrowRight color="#000" size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
