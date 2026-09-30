import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Crown, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { FAQS } from './landingData';

export default function LandingPricingFaq({ onLoginPress, styles, isLarge }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      {/* ─── PRICING MATRIX ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.miniTag}>
            <Crown color="#D4F53C" size={14} />
            <Text style={styles.miniTagText}>TRANSPARENT PRICING</Text>
          </View>
          <Text style={styles.sectionHeading}>Investasi Terbaik untuk Fisik Anda</Text>
          <Text style={styles.sectionSub}>Pilih paket gratis atau nikmati AI tanpa batas via QRIS DANA 1-Click Instant Activation.</Text>
        </View>

        <View style={[styles.pricingRow, { flexDirection: isLarge ? 'row' : 'column', maxWidth: 920, alignSelf: 'center', width: '100%' }]}>
          {/* Free Tier */}
          <View style={[styles.pricingCard, { flex: 1 }]}>
            <Text style={styles.planName}>STARTER</Text>
            <Text style={styles.planPrice}>Rp 0 <Text style={styles.planPeriod}>/ selamanya</Text></Text>
            <Text style={styles.planDesc}>Semua fitur dasar pelacakan latihan & offline vault.</Text>
            
            <View style={{ gap: 12, marginVertical: 24 }}>
              {['Unlimited Workout Sessions', 'Skia 120 FPS Progress Charts', 'Offline-First Local Vault', 'Daily Check-In Scan Limits (15x AI)'].map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Check color="#D4F53C" size={16} />
                  <Text style={{ color: '#CCC', fontSize: 13 }}>{p}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.planBtnSecondary} onPress={onLoginPress}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Mulai Gratis</Text>
            </TouchableOpacity>
          </View>

          {/* Pro Tier */}
          <View style={[styles.pricingCard, styles.pricingCardPro, { flex: 1 }]}>
            <View style={styles.popularBadge}>
              <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>PALING POPULER</Text>
            </View>
            <Text style={[styles.planName, { color: '#D4F53C' }]}>PRO LIFTER</Text>
            <Text style={styles.planPrice}>Rp 29.900 <Text style={styles.planPeriod}>/ bulan</Text></Text>
            <Text style={styles.planDesc}>Akses unlimited ke Gemini 3.7 AI Coach & Instant Verifikasi.</Text>

            <View style={{ gap: 12, marginVertical: 24 }}>
              {[
                'Semua Fitur Starter',
                'Unlimited AI Meal Plan & Routine Generator',
                'Gemini 3.7 Multi-Model Reasoning AI',
                'Badge Eksklusif Pro Lifter di Global Leaderboard',
                'QRIS DANA 1-Click Instant Activation'
              ].map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Check color="#D4F53C" size={16} />
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>{p}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.planBtnPrimary} onPress={onLoginPress}>
              <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 15 }}>Upgrade ke Pro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── FAQS ─── */}
      <View style={[styles.sectionContainer, { paddingHorizontal: isLarge ? 80 : 20 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Pertanyaan Umum (FAQ)</Text>
        </View>

        <View style={{ width: '100%', maxWidth: 880, alignSelf: 'center', gap: 12 }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.faqCard}
                onPress={() => setOpenFaq(isOpen ? null : idx)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.faqQ}>{faq.q}</Text>
                  {isOpen ? <ChevronUp color="#D4F53C" size={20} /> : <ChevronDown color="#888" size={20} />}
                </View>
                {isOpen && (
                  <Text style={styles.faqA}>{faq.a}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}
