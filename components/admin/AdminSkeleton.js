import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function AdminSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Stats Skeleton */}
      <View style={styles.statsRow}>
        {[1, 2, 3].map((item) => (
          <Animated.View 
            key={`stat-${item}`} 
            style={[styles.statCard, { opacity: pulseAnim }]} 
          />
        ))}
      </View>

      {/* Table Skeleton */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Animated.View style={[styles.titleSkeleton, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.searchSkeleton, { opacity: pulseAnim }]} />
        </View>

        <View style={styles.tableHead}>
          <Animated.View style={[styles.headCellSkeleton, { width: '20%', opacity: pulseAnim }]} />
          <Animated.View style={[styles.headCellSkeleton, { width: '30%', opacity: pulseAnim }]} />
          <Animated.View style={[styles.headCellSkeleton, { width: '20%', opacity: pulseAnim }]} />
          <Animated.View style={[styles.headCellSkeleton, { width: '15%', opacity: pulseAnim }]} />
          <Animated.View style={[styles.headCellSkeleton, { width: '15%', opacity: pulseAnim }]} />
        </View>

        {[1, 2, 3, 4, 5].map((row) => (
          <View key={`row-${row}`} style={styles.tableRow}>
            <Animated.View style={[styles.rowCellSkeleton, { width: '20%', opacity: pulseAnim }]} />
            <Animated.View style={[styles.rowCellSkeleton, { width: '30%', opacity: pulseAnim }]} />
            <Animated.View style={[styles.rowCellSkeleton, { width: '20%', opacity: pulseAnim }]} />
            <Animated.View style={[styles.rowCellSkeleton, { width: '15%', opacity: pulseAnim }]} />
            <Animated.View style={[styles.rowCellSkeleton, { width: '15%', opacity: pulseAnim }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    height: 140,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
  },
  tableCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleSkeleton: {
    width: 150,
    height: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
  },
  searchSkeleton: {
    width: 300,
    height: 44,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
  },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: 16,
  },
  headCellSkeleton: {
    height: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: 16,
    alignItems: 'center',
  },
  rowCellSkeleton: {
    height: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
  }
});
