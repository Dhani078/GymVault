import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { ShieldAlert, RefreshCw } from 'lucide-react-native';
import { AppText, theme } from '../theme';
import { useDynamicIsland } from '../contexts/DynamicIslandContext';

export default function OfflineSyncBanner({ session, onSyncComplete }) {
  const { showNotification } = useDynamicIsland();
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  const checkConnectivity = async () => {
    if (Platform.OS === 'web') {
      return navigator.onLine;
    }
    try {
      const fetchPromise = fetch('https://clients3.google.com/generate_204');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout Google')), 3000)
      );
      const res = await Promise.race([fetchPromise, timeoutPromise]);
      if (res.status === 204 || res.status === 200 || res.ok) {
        setConnectionError('');
        return true;
      }
      throw new Error(`Google status ${res.status}`);
    } catch (e) {
      try {
        const fetchPromise2 = fetch('https://sjrzhiigrcrcpgvnfixo.supabase.co');
        const timeoutPromise2 = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout Supabase')), 3000)
        );
        const res2 = await Promise.race([fetchPromise2, timeoutPromise2]);
        if (res2.status > 0) {
          setConnectionError('');
          return true;
        }
        throw new Error(`Supabase status ${res2.status}`);
      } catch (err) {
        setConnectionError(`G: ${e.message || e} | S: ${err.message || err}`);
        return false;
      }
    }
  };

  const loadOfflineQueueCount = async () => {
    try {
      if (!session?.user?.id) return [];
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const queueStr = await AsyncStorage.getItem(`offline_workouts_${session.user.id}`);
      if (queueStr) {
        const queue = JSON.parse(queueStr);
        setOfflineQueueCount(queue.length);
        return queue;
      }
    } catch (e) {

    }
    setOfflineQueueCount(0);
    return [];
  };

  const syncOfflineQueue = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      if (!session?.user?.id) return;
      const userId = session.user.id;
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;

      const queueStr = await AsyncStorage.getItem(`offline_workouts_${userId}`);
      if (!queueStr) return;
      
      const queue = JSON.parse(queueStr);
      if (queue.length === 0) return;

      const successfulIds = [];
      const { safeInsert, safeBatchInsert } = require('../supabaseClient');

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        try {
          if (!item.sessionPayload) continue;
          
          const payload = {
            ...item.sessionPayload,
            user_id: userId
          };
          
          const { data: sessionData, error: sessionErr } = await safeInsert('workout_sessions', payload);
          if (sessionErr || !sessionData) {

            continue;
          }

          const setRows = [];
          if (item.workoutData && Array.isArray(item.workoutData)) {
            item.workoutData.forEach((ex) => {
              if (ex.sets && Array.isArray(ex.sets)) {
                ex.sets.forEach((s, setIdx) => {
                  if (s.completed) {
                    setRows.push({
                      session_id: sessionData.id,
                      exercise_id: null,
                      weight_kg: s.kg,
                      reps: s.reps,
                      set_index: setIdx + 1,
                      is_checked: true
                    });
                  }
                });
              }
            });
          }

          if (setRows.length > 0) {
            const { error: setsErr } = await safeBatchInsert('workout_sets', setRows);
            if (setsErr) {

            }
          }

          successfulIds.push(i);
        } catch (err) {

        }
      }

      const remainingQueue = queue.filter((_, idx) => !successfulIds.includes(idx));
      if (remainingQueue.length === 0) {
        await AsyncStorage.removeItem(`offline_workouts_${userId}`);
        setOfflineQueueCount(0);
        showNotification({
          type: 'success',
          title: 'Sinkronisasi Selesai! ⚡',
          subtitle: `Berhasil mengunggah ${successfulIds.length} latihan offline.`,
          duration: 5000
        });
        if (onSyncComplete) onSyncComplete();
      } else {
        await AsyncStorage.setItem(`offline_workouts_${userId}`, JSON.stringify(remainingQueue));
        setOfflineQueueCount(remainingQueue.length);
        if (successfulIds.length > 0) {
          showNotification({
            type: 'warning',
            title: 'Sinkronisasi Parsial ⚠️',
            subtitle: `${successfulIds.length} terunggah, ${remainingQueue.length} tertunda.`,
            duration: 5000
          });
          if (onSyncComplete) onSyncComplete();
        }
      }
    } catch (e) {

    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const runCheck = async () => {
      const online = await checkConnectivity();
      if (!isMounted) return;
      setIsOnline(online);
      
      const queue = await loadOfflineQueueCount();
      if (!isMounted) return;

      if (online && queue && queue.length > 0 && !isSyncing) {
        await syncOfflineQueue();
      }
    };

    runCheck();
    intervalId = setInterval(runCheck, 15000);

    let handleOnline, handleOffline;
    if (Platform.OS === 'web') {
      handleOnline = () => {
        setIsOnline(true);
        setConnectionError('');
        loadOfflineQueueCount().then(queue => {
          if (queue && queue.length > 0 && !isSyncing) {
            syncOfflineQueue();
          }
        });
      };
      handleOffline = () => {
        setIsOnline(false);
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (Platform.OS === 'web' && handleOnline && handleOffline) {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [session]);

  if (isOnline && offlineQueueCount === 0) {
    return null;
  }

  return (
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
      padding: 16,
      marginBottom: 20,
      overflow: 'hidden'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {isSyncing ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : !isOnline ? (
              <ShieldAlert color="#EF4444" size={20} />
            ) : (
              <RefreshCw color="#10B981" size={18} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText weight="bold" style={{ fontSize: 14, color: isOnline ? '#10B981' : '#EF4444' }}>
                {!isOnline ? 'Mode Offline Aktif' : isSyncing ? 'Menyingkronkan...' : 'Antrean Latihan Tersimpan'}
              </AppText>
              {!isOnline && (
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#EF4444'
                }} />
              )}
            </View>
            <AppText style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2, lineHeight: 16 }}>
              {!isOnline 
                ? `Latihan Anda akan disimpan secara lokal. (${offlineQueueCount} antrean)${connectionError ? '\nDebug: ' + connectionError : ''}`
                : isSyncing 
                  ? 'Sedang mengirim data latihan Anda ke cloud...' 
                  : `${offlineQueueCount} latihan baru siap disinkronkan ke cloud.`
              }
            </AppText>
          </View>
        </View>
        
        {isOnline && offlineQueueCount > 0 && !isSyncing && (
          <TouchableOpacity
            onPress={syncOfflineQueue}
            activeOpacity={0.8}
            style={{
              backgroundColor: theme.colors.primary,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <AppText weight="bold" style={{ fontSize: 12, color: '#000' }}>Sync Now</AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
