import React from 'react';
import Svg, { Rect, Circle, G } from 'react-native-svg';

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

        {/* Center Vault Lock Disc */}
        <Circle cx="50" cy="50" r="14" fill="#0B0F17" stroke={color} strokeWidth="3.5" />
        <Circle cx="50" cy="50" r="5" fill={secondaryColor} />
      </G>
    </Svg>
  );
}
