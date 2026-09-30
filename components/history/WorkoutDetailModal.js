import React from 'react';
import { View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { X, RotateCcw, Share2, Trash2, AlertCircle } from 'lucide-react-native';
import { AppText, theme } from '../../theme';

export default function WorkoutDetailModal({
  visible,
  session,
  onClose,
  onRepeat,
  onShare,
  onDelete
}) {
  if (!visible || !session) return null;

  const renderWorkoutSetsBreakdown = (sess) => {
    const sets = sess.workout_sets || [];
    if (!sets || sets.length === 0) return null;

    let raw = sess.split_name || '';
    const parenMatch = raw.match(/\((.*?)\)/);
    if (parenMatch && parenMatch[1].includes(',')) {
      raw = parenMatch[1];
    }
    const splitExNames = raw
      .split(',')
      .map(s => s.replace(/\[.*?\]/g, '').trim())
      .filter(Boolean);

    // Detect if exercise names are distinct across sets or uniformly stuck on one exercise
    const rawNames = sets.map(s => s.exercise_name || s.exercises?.name).filter(Boolean);
    const distinctNames = new Set(rawNames);
    const isNamesUniformOrMissing = distinctNames.size <= 1;

    // Group sets sequentially by exercise
    const exerciseGroups = [];
    let currentExIdx = 0;
    let prevSetIndex = 0;
    let prevExId = null;

    sets.forEach((st, idx) => {
      const curSetNum = Number(st.set_index) || 1;
      const curExId = st.exercise_id || null;

      const setIndexReset = idx > 0 && (curSetNum <= prevSetIndex || curSetNum === 1);
      const exIdChanged = idx > 0 && curExId && prevExId && curExId !== prevExId;

      if (isNamesUniformOrMissing) {
        // Rely on sequential split_name order whenever set index resets or exercise ID changes
        if (setIndexReset || exIdChanged) {
          if (currentExIdx < splitExNames.length - 1) {
            currentExIdx++;
          }
        }
        const exName = splitExNames[currentExIdx] || splitExNames[0] || 'Latihan';
        
        let group = exerciseGroups[exerciseGroups.length - 1];
        if (!group || group.name !== exName) {
          group = { name: exName, sets: [] };
          exerciseGroups.push(group);
        }
        group.sets.push({ ...st, originalIndex: idx + 1 });
      } else {
        // Use individual exercise names if they are distinct
        let exName = st.exercise_name || st.exercises?.name || splitExNames[currentExIdx] || 'Latihan';
        let group = exerciseGroups[exerciseGroups.length - 1];
        if (!group || group.name !== exName) {
          group = { name: exName, sets: [] };
          exerciseGroups.push(group);
        }
        group.sets.push({ ...st, originalIndex: idx + 1 });
      }

      prevSetIndex = curSetNum;
      prevExId = curExId;
    });

    return exerciseGroups.map((group, gIdx) => {
      const exVol = group.sets.reduce((acc, curr) => acc + ((Number(curr.weight_kg) || 0) * (Number(curr.reps) || 0)), 0);

      return (
        <View key={gIdx} style={{ backgroundColor: theme.colors.background, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border, paddingBottom: 8 }}>
            <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text }}>{group.name}</AppText>
            <AppText style={{ fontSize: 11, color: theme.colors.textMuted }}>Vol: <AppText weight="bold" style={{ color: theme.colors.primary }}>{exVol} kg</AppText></AppText>
          </View>

          {group.sets.map((s, sIdx) => {
            const setNum = s.set_index || (sIdx + 1);
            const w = Number(s.weight_kg) || 0;
            const r = Number(s.reps) || 0;
            const vol = w * r;

            return (
              <View key={s.id || sIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: sIdx < group.sets.length - 1 ? 0.5 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
                    <AppText style={{ fontSize: 10, color: theme.colors.textMuted, fontWeight: 'bold' }}>{setNum}</AppText>
                  </View>
                  <AppText tabular weight="bold" style={{ fontSize: 13, color: theme.colors.text }}>
                    {w} kg <AppText style={{ color: theme.colors.textMuted, fontWeight: 'normal' }}>×</AppText> {r} reps
                  </AppText>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AppText tabular style={{ fontSize: 12, color: theme.colors.textMuted }}>{vol} kg</AppText>
                  <View style={{ backgroundColor: 'rgba(204, 255, 0, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <AppText style={{ fontSize: 10, color: theme.colors.primary, fontWeight: 'bold' }}>✓ Selesai</AppText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      );
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: theme.colors.card,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderWidth: 1,
          borderColor: theme.colors.border,
          maxHeight: '88%',
          paddingBottom: 24,
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.text }}>{session.split_name}</AppText>
              <AppText style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
                {session.date} · {session.time}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}
            >
              <X color={theme.colors.text} size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Stat Summary Cards */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              <View style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>Total Volume</AppText>
                <AppText weight="bold" tabular style={{ fontSize: 16, color: theme.colors.primary }}>
                  {session.totalVolume > 1000 ? `${(session.totalVolume / 1000).toFixed(1)}k` : (session.totalVolume || 0)} kg
                </AppText>
              </View>
              <View style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>Total Set</AppText>
                <AppText weight="bold" tabular style={{ fontSize: 16, color: theme.colors.text }}>
                  {session.completedSets || 0} Sets
                </AppText>
              </View>
              <View style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>Rata-rata/Set</AppText>
                <AppText weight="bold" tabular style={{ fontSize: 16, color: '#38BDF8' }}>
                  {session.completedSets > 0 ? `${Math.round(session.totalVolume / session.completedSets)} kg` : '0 kg'}
                </AppText>
              </View>
            </View>

            {/* If 0 Sets: Alert & Quick Actions */}
            {(!session.workout_sets || session.workout_sets.length === 0) ? (
              <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <AlertCircle color="#F59E0B" size={20} />
                  <AppText weight="bold" style={{ color: '#F59E0B', fontSize: 15 }}>Detail Set Belum Tersimpan</AppText>
                </View>
                <AppText style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                  Sesi ini tercatat di database dengan 0 set tersimpan (kemungkinan terjadi karena penolakan foreign key pada versi sebelumnya). Anda dapat mengulangi latihan ini ke Logger atau menghapusnya dari riwayat.
                </AppText>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      const sId = session.id;
                      if (onClose) onClose();
                      if (onDelete) onDelete(sId);
                    }}
                    style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', alignItems: 'center' }}
                  >
                    <AppText weight="bold" style={{ color: '#EF4444', fontSize: 12 }}>🗑️ Hapus Sesi</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const sess = session;
                      if (onClose) onClose();
                      if (onRepeat) onRepeat(sess);
                    }}
                    style={{ flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                  >
                    <AppText weight="bold" style={{ color: '#000', fontSize: 12 }}>🔄 Ulangi Latihan</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Grouped Sets Breakdown */
              <View style={{ marginBottom: 20 }}>
                <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                  RINCIAN SET & ANGKATAN
                </AppText>
                {renderWorkoutSetsBreakdown(session)}
              </View>
            )}

            {/* Bottom Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  const sess = session;
                  if (onClose) onClose();
                  if (onRepeat) onRepeat(sess);
                }}
                style={{ flex: 1, backgroundColor: theme.colors.surface, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
              >
                <RotateCcw color={theme.colors.text} size={15} />
                <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 13 }}>Ulangi Sesi</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onShare && onShare(session)}
                style={{ flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
              >
                <Share2 color="#000" size={15} />
                <AppText weight="bold" style={{ color: '#000', fontSize: 13 }}>Bagikan</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const sId = session.id;
                  if (onClose) onClose();
                  if (onDelete) onDelete(sId);
                }}
                style={{ paddingHorizontal: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', justifyContent: 'center', alignItems: 'center' }}
              >
                <Trash2 color="#EF4444" size={16} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
