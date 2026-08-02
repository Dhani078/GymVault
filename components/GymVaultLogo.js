import React from 'react';
import Svg, { Rect, Circle, Path, G } from 'react-native-svg';

export default function GymVaultLogo({ size = 90, color = '#CCFF00', secondaryColor = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <G>
        {/* Subtle Ambient Backdrop Glow Circle */}
        <Circle cx="50" cy="50" r="46" fill={color} opacity={0.06} />

        {/* Straight Horizontal Solid Steel Shaft */}
        <Rect x="8" y="43" width="84" height="14" rx="7" fill={secondaryColor} />

        {/* Left Solid Heavy Weight Plate */}
        <Rect x="18" y="16" width="16" height="68" rx="8" fill={color} />

        {/* Right Solid Heavy Weight Plate */}
        <Rect x="66" y="16" width="16" height="68" rx="8" fill={color} />

        {/* Center Vault Lock Outer Ring Disc */}
        <Circle cx="50" cy="50" r="14" fill="#0B0F17" stroke={color} strokeWidth="3.5" />

        {/* Real Vault Keyhole Icon Centerpiece */}
        <Path
          d="M 50 42 C 52.8 42 55 44.2 55 47 C 55 48.9 53.9 50.5 52.3 51.3 L 53.5 57.5 C 53.7 58.3 53 59 52.2 59 L 47.8 59 C 47 59 46.3 58.3 46.5 57.5 L 47.7 51.3 C 46.1 50.5 45 48.9 45 47 C 45 44.2 47.2 42 50 42 Z"
          fill={secondaryColor}
        />
      </G>
    </Svg>
  );
}
