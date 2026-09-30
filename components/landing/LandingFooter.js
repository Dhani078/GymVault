import React from 'react';
import { View, Text } from 'react-native';
import { Dumbbell } from 'lucide-react-native';

export default function LandingFooter({ styles, isLarge }) {
  return (
    <View style={[styles.footer, { paddingHorizontal: isLarge ? 80 : 24 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Dumbbell color="#D4F53C" size={24} />
        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>GYMVAULT</Text>
      </View>
      <Text style={styles.footerText}>
        © {new Date().getFullYear()} GymVault Inc. Engineered by Dhani078. All Rights Reserved.
      </Text>
    </View>
  );
}
