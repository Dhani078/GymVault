import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users, Activity, Star, Ban, TrendingUp } from 'lucide-react-native';

export default function AdminStats({ stats }) {
  return (
    <>
      {/* STATS OVERVIEW CARDS */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: 'rgba(204, 255, 0, 0.1)' }]}>
            <Users color="#CCFF00" size={24} />
          </View>
          <Text style={styles.statValue}>{stats.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Total Pengguna</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
            <Activity color="#22C55E" size={24} />
          </View>
          <Text style={styles.statValue}>{stats.activeUsers || 0}</Text>
          <Text style={styles.statLabel}>Aktif</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: 'rgba(255, 165, 0, 0.1)' }]}>
            <Star color="#FFA500" size={24} />
          </View>
          <Text style={styles.statValue}>{stats.premiumUsers || 0}</Text>
          <Text style={styles.statLabel}>Premium (Pro)</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: 'rgba(255, 68, 68, 0.1)' }]}>
            <Ban color="#FF4444" size={24} />
          </View>
          <Text style={styles.statValue}>{stats.suspendedUsers || 0}</Text>
          <Text style={styles.statLabel}>Suspended</Text>
        </View>
      </View>

      {/* ANALYTICS CHART SECTION */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.sectionTitle}>Pertumbuhan Pengguna</Text>
            <Text style={styles.chartSubtitle}>6 Bulan Terakhir</Text>
          </View>
          <View style={styles.chartTrend}>
            <TrendingUp color="#CCFF00" size={20} />
            <Text style={styles.chartTrendText}>+24%</Text>
          </View>
        </View>
        
        <View style={styles.chartContainer}>
          {stats.chartData?.map((item, index) => {
            const maxVal = Math.max(...(stats.chartData.map(d => d.value) || [1]));
            const heightPercent = maxVal === 0 ? 0 : (item.value / maxVal) * 100;
            return (
              <View key={index} style={styles.barCol}>
                <Text style={styles.barValue}>{item.value}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${heightPercent}%` }]} />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#888888',
  },
  chartSection: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 40,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  chartSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#888888',
  },
  chartTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  chartTrendText: {
    color: '#CCFF00',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 20,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  barTrack: {
    width: 40,
    height: 140,
    backgroundColor: '#111111',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#CCFF00',
    borderRadius: 8,
  },
  barLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#888888',
    marginTop: 12,
  },
});
