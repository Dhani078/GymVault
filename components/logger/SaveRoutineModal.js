import React, { useState } from 'react';
import { View, Pressable, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, theme } from '../../theme';
import { supabase } from '../../supabaseClient';

export default function SaveRoutineModal({
  visible,
  onClose,
  workoutData = [],
  session,
  dbReady,
  showNotification,
}) {
  const [routineName, setRoutineName] = useState('');
  const [saving, setSaving] = useState(false);

  if (!visible) return null;

  const handleSave = async () => {
    if (!routineName.trim() || workoutData.length === 0) return;
    setSaving(true);
    try {
      const existingStr = await AsyncStorage.getItem('customRoutines');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newRoutine = {
        id: Date.now().toString(),
        name: routineName.trim(),
        exercises: workoutData.map(ex => ({
          name: ex.name,
          image: ex.image,
          numSets: ex.sets?.length || 3
        }))
      };
      const updatedRoutines = [...existing, newRoutine];
      await AsyncStorage.setItem('customRoutines', JSON.stringify(updatedRoutines));
      
      if (session?.user?.id && dbReady) {
        const { error } = await supabase
          .from('users_profile')
          .update({ custom_routines: updatedRoutines })
          .eq('id', session.user.id);
        if (error) console.warn('[SaveRoutineModal] Failed to sync routine to Supabase:', error.message);
      }

      setRoutineName('');
      if (typeof showNotification === 'function') {
        showNotification({
          type: 'success',
          title: 'Routine Saved!',
          subtitle: `"${newRoutine.name}" ready on Dashboard`,
          duration: 3000
        });
      }
      if (typeof onClose === 'function') onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to save routine.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 24 }}>
      <View style={{ width: '100%', backgroundColor: theme.colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
        <AppText weight="bold" style={{ fontSize: 20, marginBottom: 8 }}>Save Routine</AppText>
        <AppText style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 20 }}>Quick-load this workout next time from Dashboard.</AppText>
        <TextInput
          placeholder="e.g. Push Day"
          placeholderTextColor={theme.colors.textMuted}
          style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20, fontSize: 16 }}
          value={routineName}
          onChangeText={setRoutineName}
          autoFocus
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}
            onPress={onClose}
            disabled={saving}
          >
            <AppText weight="bold" style={{ color: theme.colors.textMuted }}>Cancel</AppText>
          </Pressable>
          <Pressable
            style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', opacity: saving ? 0.7 : 1 }}
            onPress={handleSave}
            disabled={saving}
          >
            <AppText weight="bold" style={{ color: theme.colors.background }}>{saving ? 'Saving...' : 'Save'}</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
