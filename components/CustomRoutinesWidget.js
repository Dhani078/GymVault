import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Zap } from 'lucide-react-native';
import { AppText, theme } from '../theme';
import { supabase } from '../supabaseClient';
import { useDynamicIsland } from '../contexts/DynamicIslandContext';

export default function CustomRoutinesWidget({ session, dbReady, onStartRoutine }) {
  const [customRoutines, setCustomRoutines] = useState([]);
  const { showNotification } = useDynamicIsland();

  useEffect(() => {
    fetchCustomRoutines();
  }, [session, dbReady]);

  const fetchCustomRoutines = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      const routinesStr = await AsyncStorage.getItem('customRoutines');
      let localRoutines = [];
      if (routinesStr) {
        localRoutines = JSON.parse(routinesStr);
        setCustomRoutines(localRoutines);
      }

      if (session?.user?.id && dbReady) {
        const { data, error } = await supabase
          .from('users_profile')
          .select('custom_routines')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!error && data?.custom_routines) {
          const remoteRoutines = Array.isArray(data.custom_routines) ? data.custom_routines : [];
          
          if (remoteRoutines.length > 0) {
            setCustomRoutines(remoteRoutines);
            await AsyncStorage.setItem('customRoutines', JSON.stringify(remoteRoutines));
          } else if (localRoutines.length > 0) {
            await supabase
              .from('users_profile')
              .update({ custom_routines: localRoutines })
              .eq('id', session.user.id);
          }
        } else if (error) {

        }
      }
    } catch (e) {

    }
  };

  const deleteRoutine = async (routineId) => {
    try {
      const updated = customRoutines.filter(r => r.id !== routineId);
      setCustomRoutines(updated);
      
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('customRoutines', JSON.stringify(updated));

      if (session?.user?.id && dbReady) {
        const { error } = await supabase
          .from('users_profile')
          .update({ custom_routines: updated })
          .eq('id', session.user.id);
        if (error) console.warn("[CustomRoutines] Failed to sync routine deletion to Supabase:", error.message);
      }
      showNotification({
        type: 'success',
        title: 'Routine Deleted 🗑️',
        subtitle: 'The routine has been removed.',
        duration: 2500,
      });
    } catch (e) {

    }
  };

  if (customRoutines.length === 0) {
    return null;
  }

  return (
    <View style={{ marginTop: 8, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <AppText weight="bold" style={{ fontSize: 18 }}>My Routines</AppText>
        <View style={{ backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
          <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 12 }}>{customRoutines.length}</AppText>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
        {customRoutines.map((routine) => (
          <TouchableOpacity 
            key={routine.id}
            activeOpacity={0.8}
            style={{ 
              width: 260, 
              marginRight: 14, 
              padding: 20, 
              backgroundColor: theme.colors.card,
              borderRadius: 20,
              borderColor: theme.colors.border, 
              borderWidth: 1,
              position: 'relative'
            }}
            onPress={() => onStartRoutine(routine)}
            onLongPress={() => {
              Alert.alert(
                "Delete Routine 🗑️",
                `Are you sure you want to delete "${routine.name}"?`,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deleteRoutine(routine.id) }
                ]
              );
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <AppText weight="bold" style={{ fontSize: 16, color: theme.colors.text, flex: 1, paddingRight: 8 }} numberOfLines={1}>{routine.name}</AppText>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(204,255,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                <Zap color={theme.colors.primary} size={14} />
              </View>
            </View>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 14 }}>
              {routine.exercises.length} exercises
            </AppText>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {routine.exercises.slice(0, 2).map((ex, i) => (
                <View key={i} style={{ backgroundColor: theme.colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: theme.colors.border }}>
                  <AppText style={{ fontSize: 10, color: theme.colors.textMuted }} numberOfLines={1}>
                    {ex.name.length > 12 ? ex.name.substring(0, 12) + '…' : ex.name}
                  </AppText>
                </View>
              ))}
              {routine.exercises.length > 2 && (
                <View style={{ backgroundColor: 'rgba(204,255,0,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(204,255,0,0.15)' }}>
                  <AppText style={{ fontSize: 10, color: theme.colors.primary }}>+{routine.exercises.length - 2}</AppText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
