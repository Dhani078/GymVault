/**
 * ═══════════════════════════════════════════════════════════════════
 *  DynamicIsland: In-App Notification System
 * ═══════════════════════════════════════════════════════════════════
 *
 *  A floating, animated pill that mimics iOS Dynamic Island.
 *  Shows workout events: set complete, rest timer, PR, workout finish.
 *
 *  Usage:
 *    import { DynamicIslandProvider, useDynamicIsland } from './contexts/DynamicIslandContext';
 *    
 *    // In any screen:
 *    const { showNotification } = useDynamicIsland();
 *    showNotification({ type: 'success', title: 'Set Complete!', subtitle: '80kg × 12 reps' });
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Animated, Easing, Platform } from 'react-native';
import { CheckCircle, Trophy, Clock, Flame, Dumbbell, AlertCircle, Zap } from 'lucide-react-native';
import { AppText, theme } from '../theme';

const DynamicIslandContext = createContext(null);

// ─── Notification Config ─────────────────────────────────────────
const NOTIFICATION_TYPES = {
  success: { icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  pr: { icon: Trophy, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  rest: { icon: Clock, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  fire: { icon: Flame, color: '#CCFF00', bg: 'rgba(204,255,0,0.08)', border: 'rgba(204,255,0,0.20)' },
  workout: { icon: Dumbbell, color: '#CCFF00', bg: 'rgba(204,255,0,0.08)', border: 'rgba(204,255,0,0.20)' },
  warning: { icon: AlertCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  streak: { icon: Zap, color: '#A855F7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)' },
};

const DURATION_DEFAULT = 3000;

// ─── Provider ────────────────────────────────────────────────────
export function DynamicIslandProvider({ children }) {
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Animations
  const translateY = useRef(new Animated.Value(-100)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const expandWidth = useRef(new Animated.Value(0)).current;

  const dismissTimer = useRef(null);
  const queueRef = useRef([]);

  const dismissCurrent = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 400, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.8, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setIsVisible(false);
      setNotification(null);

      // Process queue
      if (queueRef.current.length > 0) {
        const next = queueRef.current.shift();
        setTimeout(() => presentNotification(next), 200);
      }
    });
  }, []);

  const presentNotification = useCallback((notif) => {
    setNotification(notif);
    setIsVisible(true);

    // Reset animations
    translateY.setValue(-100);
    scale.setValue(0.8);
    opacity.setValue(0);
    expandWidth.setValue(0);

    // Enter animation (bouncy spring)
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Progress bar animation
    Animated.timing(expandWidth, {
      toValue: 1,
      duration: notif.duration || DURATION_DEFAULT,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Auto-dismiss
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      dismissCurrent();
    }, notif.duration || DURATION_DEFAULT);
  }, [dismissCurrent]);

  const showNotification = useCallback((notif) => {
    if (isVisible) {
      // Queue it if one is already showing
      queueRef.current.push(notif);
    } else {
      presentNotification(notif);
    }
  }, [isVisible, presentNotification]);

  return (
    <DynamicIslandContext.Provider value={{ showNotification }}>
      {children}

      {/* ═══ Dynamic Island Overlay ═══ */}
      {isVisible && notification && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 60 : 40,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 9999,
            transform: [{ translateY }, { scale }],
            opacity,
          }}
        >
          <IslandPill notification={notification} expandWidth={expandWidth} />
        </Animated.View>
      )}
    </DynamicIslandContext.Provider>
  );
}

// ─── Island Pill Component ───────────────────────────────────────
function IslandPill({ notification, expandWidth }) {
  const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.success;
  const IconComponent = config.icon;

  return (
    <View style={{
      backgroundColor: '#0A0A0A',
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: config.border,
      paddingHorizontal: 20,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minWidth: 220,
      maxWidth: 340,
      shadowColor: config.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
      overflow: 'hidden',
    }}>
      {/* Glow Icon */}
      <View style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: config.bg,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <IconComponent color={config.color} size={20} />
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <AppText weight="bold" style={{ fontSize: 14, color: '#FFF', marginBottom: 2 }}>
          {notification.title}
        </AppText>
        {notification.subtitle && (
          <AppText style={{ fontSize: 12, color: '#888' }}>
            {notification.subtitle}
          </AppText>
        )}
      </View>

      {/* Progress Bar */}
      <Animated.View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 2,
        backgroundColor: config.color,
        borderRadius: 1,
        width: expandWidth.interpolate({
          inputRange: [0, 1],
          outputRange: ['100%', '0%'],
        }),
        opacity: 0.5,
      }} />
    </View>
  );
}

// ─── Consumer Hook ───────────────────────────────────────────────
export function useDynamicIsland() {
  const ctx = useContext(DynamicIslandContext);
  if (!ctx) throw new Error('useDynamicIsland must be used within <DynamicIslandProvider>');
  return ctx;
}
