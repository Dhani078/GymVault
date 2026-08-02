import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Canvas, Path, Skia, LinearGradient, vec } from '@shopify/react-native-skia';
import Animated, { 
  useSharedValue, 
  withTiming, 
  useDerivedValue,
  Easing 
} from 'react-native-reanimated';
import { AppText, theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

const IS_WEB = Platform.OS === 'web';

export const SkiaProgressRing = ({
  size = 120,
  strokeWidth = 12,
  progress = 0,
  primaryColor = theme.colors.primary,
  secondaryColor = theme.colors.darkGray,
  title = "",
  subtitle = "",
  label = "",
  value = "",
  gradientColors = null
}) => {
  const { graphicsQuality } = useTheme();
  
  if (IS_WEB) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size/2, borderWidth: strokeWidth, borderColor: primaryColor }]}>
        <View style={styles.centerTextContainer}>
          {title ? <AppText style={styles.valueText}>{title}</AppText> : null}
          {subtitle ? <AppText style={styles.labelText}>{subtitle}</AppText> : null}
          {value ? <AppText style={styles.valueText}>{value}</AppText> : null}
          {label ? <AppText style={styles.labelText}>{label}</AppText> : null}
        </View>
      </View>
    );
  }

  // Set default gradient if none provided
  const activeGradient = gradientColors || [primaryColor, primaryColor];
  
  // Calculate SVG arc paths
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1500,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    });
  }, [progress]);

  const path = Skia.Path.Make();
  path.addArc(
    { x: strokeWidth / 2, y: strokeWidth / 2, width: size - strokeWidth, height: size - strokeWidth },
    270, // Start angle (top)
    360 // Sweep angle
  );

  const backgroundPath = Skia.Path.Make();
  backgroundPath.addArc(
    { x: strokeWidth / 2, y: strokeWidth / 2, width: size - strokeWidth, height: size - strokeWidth },
    0, 360
  );

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={{ width: size, height: size }}>
        <Path 
          path={backgroundPath} 
          style="stroke" 
          strokeWidth={strokeWidth} 
          color={secondaryColor} 
        />
        {graphicsQuality === 'extreme' || graphicsQuality === 'high' ? (
          <Path 
            path={path} 
            style="stroke" 
            strokeWidth={strokeWidth} 
            strokeCap="round"
            end={animatedProgress}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(size, size)}
              colors={activeGradient}
            />
          </Path>
        ) : (
          <Path 
            path={path} 
            style="stroke" 
            strokeWidth={strokeWidth} 
            strokeCap="round"
            color={primaryColor}
            end={animatedProgress}
          />
        )}
      </Canvas>
      <View style={styles.centerTextContainer}>
        {title ? <AppText style={styles.valueText}>{title}</AppText> : null}
        {subtitle ? <AppText style={styles.labelText}>{subtitle}</AppText> : null}
        {value ? <AppText style={styles.valueText}>{value}</AppText> : null}
        {label ? <AppText style={styles.labelText}>{label}</AppText> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.white,
  },
  labelText: {
    fontSize: 10,
    color: theme.colors.lightGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  }
});

export default SkiaProgressRing;
