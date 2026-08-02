import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Canvas, Path, Skia, LinearGradient, vec, Circle, Text, matchFont } from '@shopify/react-native-skia';
import Animated, { 
  useSharedValue, 
  withTiming, 
  useDerivedValue,
  Easing 
} from 'react-native-reanimated';
import { AppText, theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

const IS_WEB = Platform.OS === 'web';

export const SkiaLineChart = ({
  data = [],
  dataKey = 'max1RM',
  color = theme.colors.primary,
  height = 160,
  showLabels = true
}) => {
  const { colors, darkMode, graphicsQuality } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const width = screenWidth - 88;
  
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = 0;
    animatedProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    });
  }, [data]);

  if (data.length < 1) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <AppText style={{ color: colors.textMuted, fontSize: 13 }}>Not enough workout logs to render chart.</AppText>
      </View>
    );
  }

  if (IS_WEB) {
    return (
      <View style={[styles.emptyChart, { height, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }]}>
        <AppText style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
          Interactive Charts require Native App (iOS/Android)
        </AppText>
      </View>
    );
  }

  const values = data.map(d => d[dataKey]);
  const maxVal = Math.max(...values) * 1.1 || 10;
  const minVal = Math.min(...values) * 0.9 || 0;
  const range = maxVal - minVal || 1;

  const chartHeight = height - 40;
  const spacing = data.length > 1 ? width / (data.length - 1) : width;

  const getPoint = (val, i) => {
    const x = i * spacing;
    const y = chartHeight - ((val - minVal) / range) * (chartHeight - 30) - 15;
    return { x, y };
  };

  // Create the main line path
  const path = Skia.Path.Make();
  if (data.length > 0) {
    const startPoint = getPoint(data[0][dataKey], 0);
    path.moveTo(startPoint.x, startPoint.y);
    for (let i = 1; i < data.length; i++) {
      const p = getPoint(data[i][dataKey], i);
      path.lineTo(p.x, p.y);
    }
  }

  // Create gradient fill path
  const fillPath = Skia.Path.MakeFromSVGString(path.toSVGString());
  if (data.length > 1) {
    const lastPoint = getPoint(data[data.length - 1][dataKey], data.length - 1);
    const firstPoint = getPoint(data[0][dataKey], 0);
    fillPath.lineTo(lastPoint.x, chartHeight);
    fillPath.lineTo(firstPoint.x, chartHeight);
    fillPath.close();
  }



  return (
    <View style={{ height, width: '100%', marginVertical: 10 }}>
      <Canvas style={{ width, height }}>
        {/* Baseline grid */}
        <Path
          path={`M 0 ${chartHeight - 15} L ${width} ${chartHeight - 15}`}
          style="stroke"
          strokeWidth={1}
          color={darkMode ? '#222' : '#E5E7EB'}
        />
        <Path
          path={`M 0 15 L ${width} 15`}
          style="stroke"
          strokeWidth={1}
          color={darkMode ? '#222' : '#E5E7EB'}
          strokeDasharray={[4, 4]}
        />

        {/* Fill Gradient (only on high graphics) */}
        {(graphicsQuality === 'extreme' || graphicsQuality === 'high') && data.length > 1 && (
          <Path path={fillPath} style="fill">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, chartHeight)}
              colors={[`${color}66`, `${color}00`]}
            />
          </Path>
        )}

        {/* Animated Line */}
        <Path
          path={path}
          style="stroke"
          strokeWidth={3}
          color={color}
          strokeCap="round"
          strokeJoin="round"
          end={animatedProgress}
        />

        {/* Data Points */}
        {data.map((d, i) => {
          const p = getPoint(d[dataKey], i);
          return (
            <Circle 
              key={`circle-${i}`}
              c={vec(p.x, p.y)} 
              r={4.5} 
              color={colors.card}
              style="fill"
            />
          );
        })}
        {data.map((d, i) => {
          const p = getPoint(d[dataKey], i);
          return (
            <Circle 
              key={`ring-${i}`}
              c={vec(p.x, p.y)} 
              r={4.5} 
              color={color}
              style="stroke"
              strokeWidth={2.5}
            />
          );
        })}
      </Canvas>
      
      {/* HTML/RN Views for Text (since Skia fonts require loading custom TTF which is async and can cause flickering) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {data.map((d, i) => {
          if (!showLabels || (i !== 0 && i !== data.length - 1 && data.length > 5)) return null;
          const p = getPoint(d[dataKey], i);
          const valLabel = dataKey === 'totalVolume' 
            ? (d[dataKey] >= 1000 ? `${(d[dataKey] / 1000).toFixed(1)}k` : `${Math.round(d[dataKey])}`)
            : `${d[dataKey]}kg`;
            
          return (
            <View key={`label-${i}`} style={{ position: 'absolute', left: p.x - 30, top: p.y - 25, width: 60, alignItems: 'center' }}>
              <AppText style={{ color: colors.text, fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>
                {valLabel}
              </AppText>
              <AppText style={{ color: colors.textMuted, fontSize: 9, textAlign: 'center', marginTop: chartHeight - p.y + 10 }}>
                {d.date}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default SkiaLineChart;
