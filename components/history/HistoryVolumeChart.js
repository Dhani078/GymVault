import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { TrendingUp } from 'lucide-react-native';
import { AppText, theme } from '../../theme';

export default function HistoryVolumeChart({ chartData }) {
  if (!chartData || chartData.length < 2) return null;

  const volumes = chartData.map(d => d.vol);
  const max = Math.max(...volumes);
  const min = Math.min(...volumes);
  const range = max - min || 1;
  const totalVol = volumes.reduce((a, b) => a + b, 0);
  const avgVol = Math.round(totalVol / volumes.length);

  const screenW = Dimensions.get('window').width;
  const padH = 24;
  const cardPad = 20;
  const w = screenW - (padH * 2) - (cardPad * 2);
  const chartH = 90;
  const dateAreaH = 24;
  const svgH = chartH + dateAreaH + 10;

  const getY = (vol) => {
    if (max === min) return chartH / 2;
    return chartH - ((vol - min) / range) * (chartH * 0.75) - 12;
  };

  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * w;
    return `${x},${getY(d.vol)}`;
  }).join(' L ');

  const fmtVol = (v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`;

  return (
    <View style={{ marginHorizontal: padH, marginBottom: 20, backgroundColor: theme.colors.card, borderRadius: 20, padding: cardPad, borderWidth: 1, borderColor: theme.colors.border }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(204,255,0,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <TrendingUp color={theme.colors.primary} size={18} />
          </View>
          <View>
            <AppText weight="bold" style={{ fontSize: 15 }}>Volume Progression</AppText>
            <AppText style={{ fontSize: 11, color: theme.colors.textMuted }}>{chartData.length} sesi terakhir</AppText>
          </View>
        </View>
      </View>
      
      {/* Summary Stats Row */}
      <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
        {[
          { label: 'Total', value: `${fmtVol(totalVol)} kg` },
          { label: 'Rata-rata', value: `${fmtVol(avgVol)} kg` },
          { label: 'Tertinggi', value: `${fmtVol(max)} kg` },
        ].map((s, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
            <AppText style={{ fontSize: 10, color: theme.colors.textMuted, marginBottom: 2 }}>{s.label}</AppText>
            <AppText weight="bold" tabular style={{ fontSize: 13, color: theme.colors.primary }}>{s.value}</AppText>
          </View>
        ))}
      </View>

      {/* SVG Chart */}
      <Svg width="100%" height={svgH} viewBox={`-8 -20 ${w+16} ${svgH+20}`}>
        <Defs>
          <LinearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.25" />
            <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        
        {/* Gradient fill area */}
        <Path 
          d={`M 0,${chartH} L ${points} L ${w},${chartH} Z`} 
          fill="url(#volGrad)" 
        />
        {/* Line */}
        <Path 
          d={`M ${points}`} 
          fill="none" 
          stroke={theme.colors.primary} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* Points + Date labels */}
        {chartData.map((d, i) => {
          const cx = (i / (chartData.length - 1)) * w;
          const cy = getY(d.vol);
          const anchor = i === 0 ? "start" : i === chartData.length - 1 ? "end" : "middle";
          return (
            <React.Fragment key={i}>
              <Circle cx={cx} cy={cy} r="5" fill={theme.colors.background} stroke={theme.colors.primary} strokeWidth="2.5" />
              <SvgText x={cx} y={cy - 10} fontSize="9" fill={theme.colors.text} textAnchor={anchor} fontWeight="bold">
                {fmtVol(d.vol)}
              </SvgText>
              <SvgText x={cx} y={chartH + dateAreaH} fontSize="9" fill={theme.colors.textMuted} textAnchor={anchor}>
                {d.date}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
