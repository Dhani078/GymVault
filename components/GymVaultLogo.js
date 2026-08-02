import React from 'react';
import Svg, { Path, Polygon, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme } from '../theme';

export default function GymVaultLogo({ size = 72, color = '#CCFF00', secondaryColor = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor="#99FF00" />
        </LinearGradient>
        <LinearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="rgba(204, 255, 0, 0.08)" />
          <Stop offset="100%" stopColor="rgba(255, 255, 255, 0.01)" />
        </LinearGradient>
      </Defs>

      {/* Outer Cybernetic Hex Shield */}
      <Polygon
        points="50,6 90,29 90,71 50,94 10,71 10,29"
        fill="url(#shieldGrad)"
        stroke="url(#logoGrad)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* High-tech Corner Accent Lines */}
      <Path
        d="M 24,31 L 15,27 L 15,36 M 76,31 L 85,27 L 85,36 M 15,64 L 15,73 L 24,69 M 85,64 L 85,73 L 76,69"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />

      {/* Futuristic Dumbbell plates (Left & Right) */}
      <Path
        d="M 28,40 C 28,34 32,32 37,32 L 39,32 C 42,32 44,34 44,37 L 44,63 C 44,66 42,68 39,68 L 37,68 C 32,68 28,66 28,60 Z"
        fill={secondaryColor}
        opacity={0.9}
      />
      <Path
        d="M 72,40 C 72,34 68,32 63,32 L 61,32 C 58,32 56,34 56,37 L 56,63 C 56,66 58,68 61,68 L 63,68 C 68,68 72,66 72,60 Z"
        fill={secondaryColor}
        opacity={0.9}
      />

      {/* Central Connector bar */}
      <Path
        d="M 44,46 L 56,46 M 44,54 L 56,54"
        stroke={secondaryColor}
        strokeWidth="4"
        strokeLinecap="round"
        opacity={0.8}
      />

      {/* Lock Core Core (Center GymVault Vault Lock) */}
      <Circle cx="50" cy="50" r="9" fill="url(#logoGrad)" />
      <Circle cx="50" cy="50" r="4.5" fill="#000000" />
    </Svg>
  );
}
