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
    background: darkMode ? '#0E0E0F' : '#F5F5F2',
    surface: darkMode ? '#161618' : '#FFFFFF',
    border: darkMode ? '#252528' : '#E5E7EB',
    primary: '#D4F53C',
    text: darkMode ? '#FFFFFF' : '#121214',
    textMuted: darkMode ? '#909096' : '#6C757D',
    card: darkMode ? '#1A1A1D' : '#FFFFFF',
    inputBg: darkMode ? '#1E1E21' : '#F1F3F5',
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
        background: '#0E0E0F',
        surface: '#161618',
        border: '#252528',
        primary: '#D4F53C',
        text: '#FFFFFF',
        textMuted: '#909096',
        card: '#1A1A1D',
        inputBg: '#1E1E21',
      }
    };
  }
  return context;
}
