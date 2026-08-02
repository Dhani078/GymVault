import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateActiveColors } from '../theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkModeState] = useState(true);
  const [graphicsQuality, setGraphicsQualityState] = useState('high'); // 'extreme', 'high', 'medium', 'low', 'potato'
  const [fpsLimit, setFpsLimitState] = useState('60'); // '120', '90', '60', '30'
  const [isHydrated, setIsHydrated] = useState(false);

  // Overlay state for smooth transition animation
  const [overlayColor, setOverlayColor] = useState('#000000');
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const [proMode, setProModeState] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('gymvault_dark_mode');
        if (savedTheme !== null) setDarkModeState(savedTheme === 'true');
        
        const savedGraphics = await AsyncStorage.getItem('gymvault_graphics_quality');
        if (savedGraphics !== null) setGraphicsQualityState(savedGraphics);

        const savedFps = await AsyncStorage.getItem('gymvault_fps_limit');
        if (savedFps !== null) setFpsLimitState(savedFps);

        const savedProMode = await AsyncStorage.getItem('gymvault_pro_mode');
        if (savedProMode !== null) setProModeState(savedProMode === 'true');
      } catch (e) {
        console.warn('Failed to load settings:', e);
      } finally {
        setIsHydrated(true);
      }
    };
    loadSettings();
  }, []);

  const colors = {
    background: darkMode ? '#000000' : '#F8F9FA',
    surface: darkMode ? '#111112' : '#FFFFFF',
    border: darkMode ? '#222225' : '#E5E7EB',
    primary: '#CCFF00',
    text: darkMode ? '#FFFFFF' : '#121214',
    textMuted: darkMode ? '#8E8E93' : '#6C757D',
    card: darkMode ? '#0A0A0C' : '#FFFFFF',
    inputBg: darkMode ? '#1C1C22' : '#F1F3F5',
  };

  const setDarkMode = async (value) => {
    if (value === darkMode) return;
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    setOverlayColor(colors.background);
    overlayOpacity.setValue(1);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDarkModeState(value);
    try { await AsyncStorage.setItem('gymvault_dark_mode', String(value)); } catch (e) {}
    Animated.timing(overlayOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();
  };

  const setGraphicsQuality = async (value) => {
    setGraphicsQualityState(value);
    try { await AsyncStorage.setItem('gymvault_graphics_quality', value); } catch (e) {}
  };

  const setFpsLimit = async (value) => {
    setFpsLimitState(value);
    try { await AsyncStorage.setItem('gymvault_fps_limit', value); } catch (e) {}
  };

  const setProMode = async (value) => {
    setProModeState(value);
    try { await AsyncStorage.setItem('gymvault_pro_mode', String(value)); } catch (e) {}
  };

  updateActiveColors(colors);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, graphicsQuality, setGraphicsQuality, fpsLimit, setFpsLimit, proMode, setProMode, colors, isHydrated }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {children}
        {/* Permanently mounted overlay to avoid rendering batching lag */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: overlayColor,
              opacity: overlayOpacity,
              zIndex: 99999,
            },
          ]}
        />
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      darkMode: true,
      graphicsQuality: 'high',
      fpsLimit: '60',
      isHydrated: true,
      setDarkMode: () => {},
      setGraphicsQuality: () => {},
      setFpsLimit: () => {},
      colors: {
        background: '#000000',
        surface: '#111112',
        border: '#222225',
        primary: '#CCFF00',
        text: '#FFFFFF',
        textMuted: '#8E8E93',
        card: '#0A0A0C',
        inputBg: '#1C1C22',
      }
    };
  }
  return context;
}
