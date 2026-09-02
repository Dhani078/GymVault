import React from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { AppText, theme } from '../theme';
import * as Haptics from 'expo-haptics';

const LoggerSetRow = ({
  set,
  index,
  proMode,
  isCurrentlyActive,
  activeSetIndex,
  curEx,
  adjust,
  updateSetValueText,
  toggleSetType,
  toggleSet,
  onSetPress,
}) => {
  const handleAdjust = (field, delta) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    adjust(set.id, field, delta);
  };

  const handleToggleType = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSetType(set.id, set.type);
  };

  const getTypeColor = () => {
    if (set.type === 'W') return '#F59E0B';
    if (set.type === 'D') return '#EF4444';
    if (set.type === 'F') return '#8B5CF6';
    return 'transparent';
  };

  const getTypeLabel = () => {
    if (set.type && set.type !== 'N') {
      return { W: 'W', D: 'D', F: 'F' }[set.type];
    }
    return index + 1;
  };

  const getTypeTextColor = () => {
    if (set.type && set.type !== 'N') return '#FFF';
    if (set.completed) return '#10B981';
    if (isCurrentlyActive) return theme.colors.primary;
    return theme.colors.textMuted;
  };

  return (
    <View
      key={set.id}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 10,
        borderRadius: 12,
        backgroundColor: set.completed
          ? 'rgba(16,185,129,0.08)'
          : isCurrentlyActive
          ? 'rgba(212,245,60,0.04)'
          : theme.colors.card,
        borderWidth: 1,
        borderColor: set.completed
          ? 'rgba(16,185,129,0.2)'
          : isCurrentlyActive
          ? theme.colors.primary
          : theme.colors.border,
      }}
    >
      {/* Set Number / Type */}
      <View style={{ width: 28, alignItems: 'center' }}>
        {proMode ? (
          <Pressable
            onPress={handleToggleType}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: getTypeColor(),
              justifyContent: 'center',
              alignItems: 'center',
            }}
            accessibilityLabel={`Tipe set ${index + 1}: ${getTypeLabel() === 'W' ? 'Warmup' : getTypeLabel() === 'D' ? 'Drop set' : getTypeLabel() === 'F' ? 'Failure' : 'Normal'}`}
            accessibilityRole="button"
          >
            <AppText
              weight="bold"
              style={{
                fontSize: 13,
                color: getTypeTextColor(),
              }}
            >
              {getTypeLabel()}
            </AppText>
          </Pressable>
        ) : (
          <AppText
            weight="bold"
            style={{
              fontSize: 13,
              color: getTypeTextColor(),
            }}
          >
            {index + 1}
          </AppText>
        )}
      </View>

      {/* KG Stepper — 44px Big Tap Target */}
      <View
        style={{
          flex: 1.1,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.inputBg,
          borderRadius: 10,
          height: 44,
          borderWidth: 1,
          borderColor: isCurrentlyActive ? theme.colors.primary : theme.colors.border,
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={() => handleAdjust('kg', -2.5)}
          style={({ pressed }) => ({
            width: 36,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: pressed ? theme.colors.border : 'transparent',
          })}
          hitSlop={6}
          accessibilityLabel={`Kurangi 2.5 kilogram untuk set ${index + 1}`}
          accessibilityRole="button"
        >
          <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.textMuted }}>
            -
          </AppText>
        </Pressable>

        <TextInput
          keyboardType="decimal-pad"
          selectTextOnFocus
          style={{
            flex: 1,
            minWidth: 0,
            color: theme.colors.text,
            fontSize: 16,
            fontFamily: 'Inter_700Bold',
            textAlign: 'center',
            paddingVertical: 0,
            paddingHorizontal: 0,
            includeFontPadding: false,
          }}
          value={String(set.kg)}
          onChangeText={(txt) => updateSetValueText(set.id, 'kg', txt)}
          accessibilityLabel={`Berat set ${index + 1}, saat ini ${set.kg} kilogram`}
          accessibilityRole="spinbutton"
          accessibilityValue={{ min: '0', max: '500', now: String(set.kg) }}
        />

        <Pressable
          onPress={() => handleAdjust('kg', 2.5)}
          style={({ pressed }) => ({
            width: 36,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: pressed ? theme.colors.border : 'transparent',
          })}
          hitSlop={6}
          accessibilityLabel={`Tambah 2.5 kilogram untuk set ${index + 1}`}
          accessibilityRole="button"
        >
          <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.primary }}>+</AppText>
        </Pressable>
      </View>

      {/* Reps Stepper — 44px Big Tap Target */}
      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.inputBg,
          borderRadius: 10,
          height: 44,
          borderWidth: 1,
          borderColor: isCurrentlyActive ? theme.colors.primary : theme.colors.border,
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={() => handleAdjust('reps', -1)}
          style={({ pressed }) => ({
            width: 36,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: pressed ? theme.colors.border : 'transparent',
          })}
          hitSlop={6}
          accessibilityLabel={`Kurangi 1 repetisi untuk set ${index + 1}`}
          accessibilityRole="button"
        >
          <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.textMuted }}>
            -
          </AppText>
        </Pressable>

        <TextInput
          keyboardType="number-pad"
          selectTextOnFocus
          style={{
            flex: 1,
            minWidth: 0,
            color: theme.colors.text,
            fontSize: 16,
            fontFamily: 'Inter_700Bold',
            textAlign: 'center',
            paddingVertical: 0,
            paddingHorizontal: 0,
            includeFontPadding: false,
          }}
          value={String(set.reps)}
          onChangeText={(txt) => updateSetValueText(set.id, 'reps', txt)}
          accessibilityLabel={`Repetisi set ${index + 1}, saat ini ${set.reps} rep`}
          accessibilityRole="spinbutton"
          accessibilityValue={{ min: '0', max: '100', now: String(set.reps) }}
        />

        <Pressable
          onPress={() => handleAdjust('reps', 1)}
          style={({ pressed }) => ({
            width: 36,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: pressed ? theme.colors.border : 'transparent',
          })}
          hitSlop={6}
          accessibilityLabel={`Tambah 1 repetisi untuk set ${index + 1}`}
          accessibilityRole="button"
        >
          <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.primary }}>+</AppText>
        </Pressable>
      </View>

      {/* RPE (Pro only) */}
      {proMode && (
        <View style={{ width: 44, alignItems: 'center' }}>
          <TextInput
            keyboardType="numeric"
            selectTextOnFocus
            style={{
              width: '100%',
              color: theme.colors.text,
              fontSize: 16,
              fontFamily: 'Inter_700Bold',
              textAlign: 'center',
              backgroundColor: theme.colors.inputBg,
              borderRadius: 10,
              height: 44,
              borderWidth: 1,
              borderColor: isCurrentlyActive ? theme.colors.primary : theme.colors.border,
              paddingVertical: 0,
              includeFontPadding: false,
            }}
            value={String(set.rpe || '')}
            onChangeText={(txt) => updateSetValueText(set.id, 'rpe', txt)}
            placeholder="RPE"
            placeholderTextColor={theme.colors.textMuted}
            accessibilityLabel={`RPE set ${index + 1}`}
            accessibilityRole="spinbutton"
            accessibilityValue={{ min: '1', max: '10', now: String(set.rpe || '') }}
          />
        </View>
      )}

      {/* Done Checkbox */}
      <View style={{ width: 36, alignItems: 'center' }}>
        <Pressable
          onPress={() => toggleSet?.(set.id)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: set.completed ? '#10B981' : 'transparent',
            borderWidth: 2,
            borderColor: set.completed ? '#10B981' : theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          hitSlop={6}
          accessibilityLabel={set.completed ? `Set ${index + 1} selesai, tap untuk batal` : `Tandai set ${index + 1} selesai`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: set.completed }}
        >
          {set.completed && (
            <AppText weight="bold" style={{ fontSize: 16, color: '#FFF' }}>
              ✓
            </AppText>
          )}
        </Pressable>
      </View>

      {/* Delete Set (if more than 1 set) */}
      {curEx.sets.length > 1 && (
        <Pressable
          onPress={() => onSetPress?.(set.id, 'delete')}
          style={{ width: 20, alignItems: 'center' }}
          accessibilityLabel={`Hapus set ${index + 1}`}
          accessibilityRole="button"
        >
          <AppText weight="bold" style={{ fontSize: 18, color: theme.colors.textMuted }}>
            ×
          </AppText>
        </Pressable>
      )}
    </View>
  );
};

export default React.memo(LoggerSetRow);