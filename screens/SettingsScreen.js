import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronRight, Shield, Eye, Cpu, Settings } from 'lucide-react-native';
import { AppText, theme, styles } from '../theme';
import SmoothScrollView from '../components/SmoothScrollView';

const SECTIONS = [
  { icon: Shield, title: 'Privacy & Legal Compliance', desc: 'Manage data, GDPR, and legal settings' },
  { icon: Eye, title: 'Accessibility & Inclusivity', desc: 'Visual, motor, and cognitive aids' },
  { icon: Cpu, title: 'Hardware & API Integration', desc: 'Connect wearables and external devices' },
  { icon: Settings, title: 'Micro-Config', desc: 'Fine-tune advanced preferences' },
];

export default function SettingsScreen() {
  return (
    <SmoothScrollView style={styles.screen} contentContainerStyle={{ padding: 24 }}>
      <AppText weight="bold" style={{ fontSize: 24, marginBottom: 4 }}>Settings</AppText>
      <AppText style={{ color: theme.colors.textMuted, marginBottom: 32 }}>
        Manage your system configurations and preferences.
      </AppText>

      {SECTIONS.map((section, i) => (
        <TouchableOpacity key={i} style={[styles.card, { marginBottom: 12, flexDirection: 'row', alignItems: 'center' }]}>
          <View style={styles.iconButton}>
            <section.icon color={theme.colors.primary} size={20} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppText weight="bold" style={{ fontSize: 16, marginBottom: 4 }}>{section.title}</AppText>
            <AppText style={{ fontSize: 13, color: theme.colors.textMuted }}>{section.desc}</AppText>
          </View>
          <ChevronRight color={theme.colors.border} size={20} />
        </TouchableOpacity>
      ))}
    </SmoothScrollView>
  );
}
