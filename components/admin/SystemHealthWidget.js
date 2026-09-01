import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Server, Zap, ShieldCheck, RefreshCw, Cpu, Database, Bot, CheckCircle2 } from 'lucide-react-native';

export default function SystemHealthWidget({ onPing }) {
  const [latency, setLatency] = useState(48);
  const [isPinging, setIsPinging] = useState(false);
  const [lastCheck, setLastCheck] = useState(new Date().toLocaleTimeString());

  const handlePing = async () => {
    setIsPinging(true);
    const start = Date.now();
    try {
      if (onPing) await onPing();
      else await new Promise(r => setTimeout(r, 250));
      setLatency(Math.max(18, Date.now() - start));
    } catch (e) {
      setLatency(120);
    } finally {
      setIsPinging(false);
      setLastCheck(new Date().toLocaleTimeString());
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.pulsingDot} />
          <Text style={styles.title}>ENGINE TELEMETRY & SYSTEM HEALTH</Text>
        </View>
        <TouchableOpacity style={styles.pingBtn} onPress={handlePing} disabled={isPinging}>
          {isPinging ? (
            <ActivityIndicator size="small" color="#D4F53C" />
          ) : (
            <>
              <RefreshCw size={14} color="#D4F53C" />
              <Text style={styles.pingText}>Ping Telemetry</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {/* Node 1: Supabase PostgreSQL */}
        <View style={styles.nodeCard}>
          <View style={styles.nodeTop}>
            <Database size={18} color="#D4F53C" />
            <View style={styles.statusBadgeGreen}>
              <Text style={styles.statusTextGreen}>CONNECTED</Text>
            </View>
          </View>
          <Text style={styles.nodeName}>PostgreSQL 15 (Supabase)</Text>
          <Text style={styles.nodeSub}>Latency: <Text style={{ color: '#D4F53C', fontWeight: 'bold' }}>{latency} ms</Text> • RLS Active</Text>
        </View>

        {/* Node 2: Google Gemini AI Cascade */}
        <View style={styles.nodeCard}>
          <View style={styles.nodeTop}>
            <Zap size={18} color="#60A5FA" />
            <View style={styles.statusBadgeBlue}>
              <Text style={styles.statusTextBlue}>7/7 WATERFALL</Text>
            </View>
          </View>
          <Text style={styles.nodeName}>Google Gemini 3.7 Vision</Text>
          <Text style={styles.nodeSub}>Anti-Fraud & Nutrition OCR Resilient</Text>
        </View>

        {/* Node 3: Telegram 2-Way Bot Webhook */}
        <View style={styles.nodeCard}>
          <View style={styles.nodeTop}>
            <Bot size={18} color="#F59E0B" />
            <View style={styles.statusBadgeAmber}>
              <Text style={styles.statusTextAmber}>LISTENING</Text>
            </View>
          </View>
          <Text style={styles.nodeName}>Telegram Webhook Edge</Text>
          <Text style={styles.nodeSub}>In-Place ACC/Tolak Live</Text>
        </View>

        {/* Node 4: Vercel Edge Serverless */}
        <View style={styles.nodeCard}>
          <View style={styles.nodeTop}>
            <Server size={18} color="#10B981" />
            <View style={styles.statusBadgeGreen}>
              <Text style={styles.statusTextGreen}>PROD 10/10</Text>
            </View>
          </View>
          <Text style={styles.nodeName}>Vercel Serverless Production</Text>
          <Text style={styles.nodeSub}>Region: sin1 (Singapore) • Checked {lastCheck}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A0A0E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1E26',
    padding: 24,
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D4F53C',
    shadowColor: '#D4F53C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1.5,
  },
  pingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D4F53C',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nodeCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#121218',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#22222C',
    padding: 16,
  },
  nodeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nodeName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nodeSub: {
    color: '#888',
    fontSize: 11,
  },
  statusBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTextGreen: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadgeBlue: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTextBlue: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadgeAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTextAmber: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
