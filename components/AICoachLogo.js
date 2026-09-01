import React from 'react';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function AICoachLogo({ size = 36, color = '#D4F53C', secondaryColor = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="aiGymGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor="#00FFCC" />
        </LinearGradient>
        <LinearGradient id="plateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#2E2E38" />
          <Stop offset="100%" stopColor="#121215" />
        </LinearGradient>
      </Defs>

      {/* Barbell Bar (Running through the back of the head) */}
      <Rect x="10" y="46" width="80" height="8" rx="4" fill="url(#aiGymGrad)" opacity={0.8} />
      
      {/* Left Dumbbell Heavy Weight Plates */}
      <Rect x="14" y="26" width="6" height="48" rx="2.5" fill="url(#plateGrad)" stroke={color} strokeWidth="1.5" />
      <Rect x="22" y="32" width="4" height="36" rx="2" fill="url(#plateGrad)" stroke={color} strokeWidth="1" />
      
      {/* Right Dumbbell Heavy Weight Plates */}
      <Rect x="80" y="26" width="6" height="48" rx="2.5" fill="url(#plateGrad)" stroke={color} strokeWidth="1.5" />
      <Rect x="74" y="32" width="4" height="36" rx="2" fill="url(#plateGrad)" stroke={color} strokeWidth="1" />

      {/* Cybernetic Trainer Head Frame */}
      <Circle cx="50" cy="50" r="25" fill="#0A0A0C" stroke="url(#aiGymGrad)" strokeWidth="2.5" />

      {/* Athletic Smart Visor / Sunglasses HUD */}
      <Path
        d="M 33,46 Q 50,39 67,46 L 65,54 Q 50,60 35,54 Z"
        fill="rgba(0, 255, 204, 0.15)"
        stroke={color}
        strokeWidth="2"
      />

      {/* Visor glowing laser eyes */}
      <Path
        d="M 41,50 L 46,50 M 54,50 L 59,50"
        stroke={secondaryColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Forehead Sweatband (Classic Gym Fitness Accessory) */}
      <Path
        d="M 31,34 Q 50,29 69,34"
        stroke="url(#aiGymGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Sweatband center line detail */}
      <Path
        d="M 45,34 L 55,34"
        stroke="#0A0A0C"
        strokeWidth="1.5"
      />

      {/* Cybernetic jaw plate notches */}
      <Path
        d="M 43,71 L 50,75 L 57,71"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
