import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Switch, Modal, Image, Alert, Platform, Share, ImageBackground } from 'react-native';
import { User, Target, Activity, Zap, TrendingUp, AlertTriangle, CheckCircle, XCircle, Settings, Moon, Bell, Lock, LogOut, ChevronRight, X, Camera, Download, Trash2, Shield, Globe, Clock, Flame, Award, Crown, Share2, Check } from 'lucide-react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Polyline, Text as SvgText } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { AppText, styles, theme } from '../theme';
import { useProfileData } from '../hooks/useProfileData';
import { supabase, safeSelect } from '../supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDynamicIsland } from '../contexts/DynamicIslandContext';
import SmoothScrollView from '../components/SmoothScrollView';
import ViewShot from 'react-native-view-shot';
import DummyAdBanner from '../components/DummyAdBanner';

const parseLocalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateCheckInStreak = (historyList) => {
  if (!historyList || !Array.isArray(historyList) || historyList.length === 0) return 0;
  
  const uniqueDates = Array.from(new Set(historyList)).filter(Boolean).sort();
  if (uniqueDates.length === 0) return 0;

  const todayStr = getLocalDateString();
  const todayDate = parseLocalDate(todayStr);

  const latestDateStr = uniqueDates[uniqueDates.length - 1];
  const latestDate = parseLocalDate(latestDateStr);
  const diffDays = Math.round((todayDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));

  // If last check-in was 3+ days ago (missed 2+ consecutive days), streak resets
  if (diffDays > 2) {
    return 0;
  }

  // Count streak backwards, allowing 1 missed day (48h grace period)
  let streak = 1;
  for (let i = uniqueDates.length - 1; i > 0; i--) {
    const curr = parseLocalDate(uniqueDates[i]);
    const prev = parseLocalDate(uniqueDates[i - 1]);
    const gap = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (gap <= 2) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

const COMPARISON_ITEMS = [
  {
    "kg": 1,
    "name": "Last Quarter Moon Face",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f31c.png"
  },
  {
    "kg": 4,
    "name": "Hibiscus",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f33a.png"
  },
  {
    "kg": 7,
    "name": "Waxing Gibbous Moon",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f314.png"
  },
  {
    "kg": 10,
    "name": "Maple Leaf",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f341.png"
  },
  {
    "kg": 12,
    "name": "Bank",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3e6.png"
  },
  {
    "kg": 13,
    "name": "Thermometer",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f321.png"
  },
  {
    "kg": 15,
    "name": "Cherries",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f352.png"
  },
  {
    "kg": 18,
    "name": "Man’s Shoe",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f45e.png"
  },
  {
    "kg": 19,
    "name": "Green Apple",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f34f.png"
  },
  {
    "kg": 20,
    "name": "Ewe",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f411.png"
  },
  {
    "kg": 21,
    "name": "Beach With Umbrella",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3d6.png"
  },
  {
    "kg": 23,
    "name": "Hospital",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3e5.png"
  },
  {
    "kg": 26,
    "name": "Woman’s Clothes",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f45a.png"
  },
  {
    "kg": 29,
    "name": "Eggplant",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f346.png"
  },
  {
    "kg": 31,
    "name": "Full Moon",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f315.png"
  },
  {
    "kg": 33,
    "name": "Crown",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f451.png"
  },
  {
    "kg": 34,
    "name": "Dragon",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f409.png"
  },
  {
    "kg": 35,
    "name": "Tulip",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f337.png"
  },
  {
    "kg": 37,
    "name": "Tornado",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f32a.png"
  },
  {
    "kg": 40,
    "name": "Houses",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3d8.png"
  },
  {
    "kg": 43,
    "name": "Guitar",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3b8.png"
  },
  {
    "kg": 46,
    "name": "Backpack",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f392.png"
  },
  {
    "kg": 49,
    "name": "Bird",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f426.png"
  },
  {
    "kg": 50,
    "name": "House With Garden",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3e1.png"
  },
  {
    "kg": 52,
    "name": "Amphora",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3fa.png"
  },
  {
    "kg": 53,
    "name": "Racing Car",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3ce.png"
  },
  {
    "kg": 56,
    "name": "Tangerine",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f34a.png"
  },
  {
    "kg": 57,
    "name": "Jeans",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f456.png"
  },
  {
    "kg": 58,
    "name": "Camel",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f42a.png"
  },
  {
    "kg": 59,
    "name": "Shooting Star",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f320.png"
  },
  {
    "kg": 62,
    "name": "Pear",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f350.png"
  },
  {
    "kg": 64,
    "name": "Convenience Store",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3ea.png"
  },
  {
    "kg": 74,
    "name": "Ear Of Corn",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f33d.png"
  },
  {
    "kg": 84,
    "name": "Fork And Knife With Plate",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f37d.png"
  },
  {
    "kg": 96,
    "name": "Full Moon Face",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f31d.png"
  },
  {
    "kg": 110,
    "name": "Love Hotel",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3e9.png"
  },
  {
    "kg": 126,
    "name": "Custard",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f36e.png"
  },
  {
    "kg": 145,
    "name": "Clutch Bag",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f45d.png"
  },
  {
    "kg": 166,
    "name": "Deciduous Tree",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f333.png"
  },
  {
    "kg": 189,
    "name": "Cooked Rice",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f35a.png"
  },
  {
    "kg": 217,
    "name": "Tiger Face",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f42f.png"
  },
  {
    "kg": 248,
    "name": "Graduation Cap",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f393.png"
  },
  {
    "kg": 284,
    "name": "Pig Nose",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f43d.png"
  },
  {
    "kg": 325,
    "name": "Hamburger",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f354.png"
  },
  {
    "kg": 372,
    "name": "Hotel",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3e8.png"
  },
  {
    "kg": 425,
    "name": "Sun Behind Rain Cloud",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f326.png"
  },
  {
    "kg": 487,
    "name": "High-heeled Shoe",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f460.png"
  },
  {
    "kg": 557,
    "name": "Panda",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f43c.png"
  },
  {
    "kg": 637,
    "name": "Mouse Face",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f42d.png"
  },
  {
    "kg": 729,
    "name": "Closed Umbrella",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f302.png"
  },
  {
    "kg": 834,
    "name": "Baby Chick",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f424.png"
  },
  {
    "kg": 954,
    "name": "Handbag",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f45c.png"
  },
  {
    "kg": 1091,
    "name": "Bear",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f43b.png"
  },
  {
    "kg": 1249,
    "name": "Globe Showing Asia-Australia",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f30f.png"
  },
  {
    "kg": 1428,
    "name": "Headphone",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3a7.png"
  },
  {
    "kg": 1634,
    "name": "Dragon Face",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f432.png"
  },
  {
    "kg": 1870,
    "name": "Dango",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f361.png"
  },
  {
    "kg": 2139,
    "name": "Tomato",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f345.png"
  },
  {
    "kg": 2447,
    "name": "Purse",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f45b.png"
  },
  {
    "kg": 2799,
    "name": "Roller Coaster",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3a2.png"
  },
  {
    "kg": 3203,
    "name": "Fog",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f32b.png"
  },
  {
    "kg": 3664,
    "name": "Sushi",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f363.png"
  },
  {
    "kg": 4191,
    "name": "Globe With Meridians",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f310.png"
  },
  {
    "kg": 4795,
    "name": "Pot Of Food",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f372.png"
  },
  {
    "kg": 5486,
    "name": "Cyclone",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f300.png"
  },
  {
    "kg": 6276,
    "name": "Fork And Knife",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f374.png"
  },
  {
    "kg": 7179,
    "name": "Camping",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3d5.png"
  },
  {
    "kg": 8213,
    "name": "Banana",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f34c.png"
  },
  {
    "kg": 9396,
    "name": "Melon",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f348.png"
  },
  {
    "kg": 10749,
    "name": "Sunrise Over Mountains",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f304.png"
  },
  {
    "kg": 12297,
    "name": "Sun Behind Large Cloud",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f325.png"
  },
  {
    "kg": 14068,
    "name": "Japanese Castle",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3ef.png"
  },
  {
    "kg": 16094,
    "name": "Horse",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f40e.png"
  },
  {
    "kg": 18411,
    "name": "Roasted Sweet Potato",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f360.png"
  },
  {
    "kg": 21063,
    "name": "Woman’s Sandal",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f461.png"
  },
  {
    "kg": 24096,
    "name": "Polar Bear",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f43b_200d_2744.png"
  },
  {
    "kg": 27566,
    "name": "Desert Island",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3dd.png"
  },
  {
    "kg": 31535,
    "name": "Dress",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f457.png"
  },
  {
    "kg": 36076,
    "name": "Four Leaf Clover",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f340.png"
  },
  {
    "kg": 41272,
    "name": "First Quarter Moon",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f313.png"
  },
  {
    "kg": 47215,
    "name": "Pizza",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f355.png"
  },
  {
    "kg": 54014,
    "name": "Curry Rice",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f35b.png"
  },
  {
    "kg": 61792,
    "name": "Ant",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f41c.png"
  },
  {
    "kg": 70690,
    "name": "Fried Shrimp",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f364.png"
  },
  {
    "kg": 80869,
    "name": "Rice Ball",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f359.png"
  },
  {
    "kg": 92514,
    "name": "Post Office",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3e4.png"
  },
  {
    "kg": 105837,
    "name": "Rice Cracker",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f358.png"
  },
  {
    "kg": 121077,
    "name": "Glasses",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f453.png"
  },
  {
    "kg": 138512,
    "name": "Bread",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f35e.png"
  },
  {
    "kg": 158458,
    "name": "Mouse",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f401.png"
  },
  {
    "kg": 181276,
    "name": "Watermelon",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f349.png"
  },
  {
    "kg": 207380,
    "name": "Blowfish",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f421.png"
  },
  {
    "kg": 237243,
    "name": "Lollipop",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f36d.png"
  },
  {
    "kg": 271406,
    "name": "Top Hat",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f3a9.png"
  },
  {
    "kg": 310489,
    "name": "Waning Crescent Moon",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f318.png"
  },
  {
    "kg": 355199,
    "name": "Palm Tree",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f334.png"
  },
  {
    "kg": 406348,
    "name": "Ice Cream",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f368.png"
  },
  {
    "kg": 464862,
    "name": "Milky Way",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f30c.png"
  },
  {
    "kg": 531802,
    "name": "Pig",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f416.png"
  },
  {
    "kg": 608382,
    "name": "Boar",
    "url": "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f417.png"
  }
];

const getVolumeComparison = (volumeKg) => {
  // Find the heaviest item that is LESS THAN OR EQUAL to volumeKg
  const reversed = [...COMPARISON_ITEMS].reverse();
  let match = reversed.find(item => item.kg <= volumeKg);
  
  if (!match) {
    match = COMPARISON_ITEMS[0];
  }
  
  // Calculate multiplier as an integer (e.g., 1x, 2x) without decimals
  let qty = Math.floor(volumeKg / match.kg);
  if (qty < 1) qty = 1;
  
  return {
    item: match.name,
    kgPerItem: match.kg,
    qty: qty,
    imageUrl: match.url
  };
};

// --- Error Boundary Simulation & Toast ---
const Toast = ({ visible, type, message }) => {
  if (!visible) return null;
  const isError = type === 'error';
  return (
    <View style={{
      position: 'absolute', top: 50, left: 24, right: 24, zIndex: 999,
      backgroundColor: isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(204, 255, 0, 0.95)',
      padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
    }}>
      {isError ? <XCircle color="#FFF" size={24} /> : <CheckCircle color="#000" size={24} />}
      <AppText weight="bold" style={{ color: isError ? '#FFF' : '#000', flex: 1 }}>{message}</AppText>
    </View>
  );
};

// --- Skeleton Loader Component ---
const SkeletonBox = ({ width, height, borderRadius = 8, style }) => (
  <View style={[{ width, height, borderRadius, backgroundColor: theme.colors.border, overflow: 'hidden' }, style]}>
    <View style={{ width: '100%', height: '100%', backgroundColor: theme.colors.inputBg, opacity: 0.5 }} />
  </View>
);

const SettingItem = ({ icon: Icon, title, value, type = 'nav', onPress, toggleValue }) => (
  <TouchableOpacity
    activeOpacity={type === 'toggle' ? 1 : 0.7}
    onPress={onPress}
    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
  >
    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
      <Icon color={theme.colors.primary} size={18} />
    </View>
    <AppText weight="bold" style={{ flex: 1, color: theme.colors.text, fontSize: 16 }}>{title}</AppText>

    {type === 'nav' && (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {value && <AppText style={{ color: theme.colors.textMuted, marginRight: 8 }}>{value}</AppText>}
        <ChevronRight color={theme.colors.textMuted} size={20} />
      </View>
    )}

    {type === 'toggle' && (
      <Switch
        value={toggleValue}
        onValueChange={onPress}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={toggleValue ? '#000' : theme.colors.textMuted}
      />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen({ session, dbReady, onGoToHistory }) {
  const { profile, loading, error: hookError, sessions, updateProfile, injuryRisk, deloadSuggestion, stats, weightLogs, measurements, updateMeasurements, nutritionGoals, updateNutritionGoals } = useProfileData(session, dbReady);
  const { showNotification } = useDynamicIsland();

  const [toast, setToast] = useState({ visible: false, type: '', message: '' });
  const [editing, setEditing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [unitsModalVisible, setUnitsModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [editForm, setEditForm] = useState({ name: '', weight: '', height: '', chest: '', biceps: '', waist: '' });
  const [weightUnit, setWeightUnit] = useState('metric');
  const [tdeeModalVisible, setTdeeModalVisible] = useState(false);
  const [tdeeForm, setTdeeForm] = useState({ gender: 'male', age: '25', activity: '1.55', goal: 'maintain' });

  // Settings States
  const { darkMode, setDarkMode, graphicsQuality, setGraphicsQuality, fpsLimit, setFpsLimit, proMode, setProMode } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const [healthKitConnected, setHealthKitConnected] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [graphicsModalVisible, setGraphicsModalVisible] = useState(false);
  const [fpsModalVisible, setFpsModalVisible] = useState(false);
  const [shareVolumeModalVisible, setShareVolumeModalVisible] = useState(false);
  const [shareMode, setShareMode] = useState('lifetime'); // 'lifetime' or session ID
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const viewShotRef = useRef();

  // Daily Check-in States
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [checkInHistory, setCheckInHistory] = useState([]);
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false);

  const loadCheckInStatus = async () => {
    try {
      if (!session?.user?.id) return;
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const today = getLocalDateString();
      const historyStr = await AsyncStorage.getItem(`checkin_history_${session.user.id}`);
      const history = historyStr ? JSON.parse(historyStr) : [];
      setCheckInHistory(history);
      
      const isCheckedIn = history.includes(today);
      setCheckedInToday(isCheckedIn);

      if (!isCheckedIn) {
        setShowCheckInPrompt(true);
      }
      
      const streak = calculateCheckInStreak(history);
      setCheckInStreak(streak);
      await AsyncStorage.setItem(`checkin_streak_${session.user.id}`, String(streak));
    } catch (e) {}
  };

  const handleDailyCheckIn = async () => {
    try {
      if (!session?.user?.id) return;
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const today = getLocalDateString();
      const userId = session.user.id;
      
      if (checkInHistory.includes(today)) {
        Alert.alert("Sudah Check-In", "Anda sudah melakukan check-in hari ini! Kembali lagi besok.");
        return;
      }
      
      const newHistory = Array.from(new Set([...checkInHistory, today])).sort();
      await AsyncStorage.setItem(`checkin_history_${userId}`, JSON.stringify(newHistory));
      setCheckInHistory(newHistory);
      setCheckedInToday(true);
      
      const streak = calculateCheckInStreak(newHistory);
      setCheckInStreak(streak);
      await AsyncStorage.setItem(`checkin_streak_${userId}`, String(streak));
      
      // Rewards check
      if (streak === 7) {
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + 30);
        await AsyncStorage.setItem(`premium_until_${userId}`, premiumUntil.toISOString());
        await AsyncStorage.setItem(`is_premium_${userId}`, 'true');
        await AsyncStorage.setItem(`@premium_status_${userId}`, 'active');
        
        showNotification({
          type: 'streak',
          title: 'Premium 30 Hari Aktif! 👑',
          subtitle: 'Streak 7 hari tercapai! Selamat menikmati.',
          duration: 6000
        });

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Premium 30 Hari Aktif! 👑',
              body: 'Selamat! Streak 7 hari tercapai. Fitur Premium gratis selama 30 hari telah diaktifkan.',
              sound: true,
            },
            trigger: null, // immediate
          });
        } catch (e) {}
      } else if (streak === 3) {
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + 15);
        await AsyncStorage.setItem(`premium_until_${userId}`, premiumUntil.toISOString());
        await AsyncStorage.setItem(`is_premium_${userId}`, 'true');
        await AsyncStorage.setItem(`@premium_status_${userId}`, 'active');

        showNotification({
          type: 'streak',
          title: 'Premium 15 Hari Aktif! 🎁',
          subtitle: 'Streak 3 hari tercapai! Selamat menikmati.',
          duration: 6000
        });

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Premium 15 Hari Aktif! 🎁',
              body: 'Selamat! Streak 3 hari tercapai. Fitur Premium gratis selama 15 hari telah diaktifkan.',
              sound: true,
            },
            trigger: null, // immediate
          });
        } catch (e) {}
      } else {
        showNotification({
          type: 'fire',
          title: 'Check-In Sukses! 🔥',
          subtitle: `Streak ${streak} Hari • Limit AI 15x Aktif!`,
          duration: 5000
        });

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Check-In Sukses! 🔥',
              body: `Check-in hari ke-${streak} berhasil. Limit AI harian Anda telah ditingkatkan menjadi 15x hari ini!`,
              sound: true,
            },
            trigger: null,
          });
        } catch (e) {}
      }
    } catch (e) {
      Alert.alert("Gagal", "Terjadi kesalahan saat melakukan check-in.");
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        
        // 1. HealthKit / Google Fit Sync
        const healthVal = await AsyncStorage.getItem(`health_kit_connected_${session?.user?.id}`);
        setHealthKitConnected(healthVal === 'true');
        
        // 2. Notification setting
        const notifVal = await AsyncStorage.getItem('notifications_enabled');
        if (notifVal !== null) {
          setNotifications(notifVal === 'true');
        }
        
        // 3. Privacy Mode setting
        const privVal = await AsyncStorage.getItem('gymvault_private_mode');
        if (privVal !== null) {
          setPrivateMode(privVal === 'true');
        }
      } catch (e) {}
    };
    if (session?.user?.id) {
      loadSettings();
      loadCheckInStatus();
    }
  }, [session]);

  const [isPremium, setIsPremium] = useState(false);
  const [premiumSinceDate, setPremiumSinceDate] = useState('');
  const [premiumUntilDate, setPremiumUntilDate] = useState('');

  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        if (!session?.user?.id) {
          setIsPremium(false);
          setPremiumUntilDate('');
          setPremiumSinceDate('');
          return;
        }
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const userId = session.user.id;
        const premUntil = await AsyncStorage.getItem(`premium_until_${userId}`);
        const premSince = await AsyncStorage.getItem(`premium_since_${userId}`);
        const isPrem = await AsyncStorage.getItem(`is_premium_${userId}`);
        
        if (premUntil && new Date(premUntil) > new Date()) {
          setIsPremium(true);
          setPremiumUntilDate(new Date(premUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }));
          if (premSince) setPremiumSinceDate(new Date(premSince).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }));
        } else if (isPrem === 'true') {
          setIsPremium(true);
          setPremiumUntilDate('Lifetime / Expired');
        } else {
          // Fallback: Check Database if local cache is missing (e.g. after login)
          const { data, error } = await safeSelect('promo_codes', {
            filters: { used_by: userId },
            single: false
          });
          
          if (!error && data && data.length > 0) {
            // User HAS redeemed a code before, restore Pro Status!
            const premiumNow = new Date();
            const premiumUntil = new Date();
            premiumUntil.setDate(premiumUntil.getDate() + 30);
            
            await AsyncStorage.setItem(`premium_since_${userId}`, premiumNow.toISOString());
            await AsyncStorage.setItem(`premium_until_${userId}`, premiumUntil.toISOString());
            await AsyncStorage.setItem(`is_premium_${userId}`, 'true');
            await AsyncStorage.setItem(`@premium_status_${userId}`, 'active');
            
            setIsPremium(true);
            setPremiumSinceDate(premiumNow.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }));
            setPremiumUntilDate(premiumUntil.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }));
          } else {
            setIsPremium(false);
            setPremiumUntilDate('');
            setPremiumSinceDate('');
          }
        }
      } catch (e) {}
    };
    checkPremiumStatus();
  }, [redeemModalVisible, session]); // Re-check when modal closes or session changes

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!session?.user?.id) return;
      try {
        const { data, error } = await supabase.rpc('get_leaderboard');
        if (!error && data && data.length > 0) {
          const formatted = data.map(item => ({
            name: item.id === session.user.id ? 'You' : (item.name || 'Athlete'),
            score: parseInt(item.score) || 0,
            isUser: item.id === session.user.id
          }));
          setGlobalLeaderboard(formatted);
        }
      } catch (e) {
        // Silently fail and fallback to dummy if RPC not deployed
      }
    };
    if (dbReady) fetchLeaderboard();
  }, [dbReady, session]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        weight: profile.body_weight ? profile.body_weight.toString() : '',
        height: profile.height ? profile.height.toString() : '',
        chest: measurements?.chest || '',
        biceps: measurements?.biceps || '',
        waist: measurements?.waist || '',
      });
    }
  }, [profile, measurements]);

  const handleSeedDemoHistory = async () => {
    if (!session?.user?.id) {
      Alert.alert("Error", "Anda harus login terlebih dahulu.");
      return;
    }
    
    try {
      const userId = session.user.id;
      
      // 1. Seed Chest & Shoulder Workout Session (2 days ago)
      const date2DaysAgo = new Date();
      date2DaysAgo.setDate(date2DaysAgo.getDate() - 2);
      
      const { data: sess1, error: err1 } = await supabase.from('workout_sessions').insert({
        user_id: userId,
        started_at: date2DaysAgo.toISOString(),
        is_completed: true,
        split_name: 'Dada & Bahu (Demo)'
      }).select().single();
      
      if (err1) throw err1;
      
      const sets1 = [
        {
          session_id: sess1.id,
          exercise_id: '7f313e9b-eaf7-45f0-aa27-d34657bb3e17', // Barbell Bench Press (Chest)
          weight_kg: 80,
          reps: 8,
          set_index: 1,
          is_checked: true
        },
        {
          session_id: sess1.id,
          exercise_id: '65fa6683-49a0-4219-b29c-2e2f2f31eeac', // Overhead Press (Shoulder)
          weight_kg: 50,
          reps: 10,
          set_index: 1,
          is_checked: true
        }
      ];
      
      const { error: errSets1 } = await supabase.from('workout_sets').insert(sets1);
      if (errSets1) throw errSets1;
      
      // 2. Seed Leg & Hamstring Workout Session (4 days ago)
      const date4DaysAgo = new Date();
      date4DaysAgo.setDate(date4DaysAgo.getDate() - 4);
      
      const { data: sess2, error: err2 } = await supabase.from('workout_sessions').insert({
        user_id: userId,
        started_at: date4DaysAgo.toISOString(),
        is_completed: true,
        split_name: 'Kaki & Betis (Demo)'
      }).select().single();
      
      if (err2) throw err2;
      
      const sets2 = [
        {
          session_id: sess2.id,
          exercise_id: '7abe01a8-8883-4c9a-9208-9f286208e828', // Squat (Quads)
          weight_kg: 100,
          reps: 6,
          set_index: 1,
          is_checked: true
        },
        {
          session_id: sess2.id,
          exercise_id: '5c3e72a6-5f74-4ef7-b093-16694e5b85a8', // Romanian Deadlift (Hamstring)
          weight_kg: 90,
          reps: 8,
          set_index: 1,
          is_checked: true
        }
      ];
      
      const { error: errSets2 } = await supabase.from('workout_sets').insert(sets2);
      if (errSets2) throw errSets2;

      // 3. Seed Back & Lower Back Workout Session (3 days ago)
      const date3DaysAgo = new Date();
      date3DaysAgo.setDate(date3DaysAgo.getDate() - 3);

      const { data: sess3, error: err3 } = await supabase.from('workout_sessions').insert({
        user_id: userId,
        started_at: date3DaysAgo.toISOString(),
        is_completed: true,
        split_name: 'Punggung & Lats (Demo)'
      }).select().single();

      if (err3) throw err3;

      const sets3 = [
        {
          session_id: sess3.id,
          exercise_id: '9f922b32-a4c8-49ed-96cb-990b77d3c823', // Pull-Ups (Lats)
          weight_kg: 0,
          reps: 12,
          set_index: 1,
          is_checked: true
        },
        {
          session_id: sess3.id,
          exercise_id: '38029da4-ecfc-427b-a1dc-278295771943', // Deadlift (Lower Back)
          weight_kg: 140,
          reps: 5,
          set_index: 1,
          is_checked: true
        }
      ];

      const { error: errSets3 } = await supabase.from('workout_sets').insert(sets3);
      if (errSets3) throw errSets3;
      
      // Seed manual overrides for Biceps, Triceps, and Traps in AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const demoOverrides = {
        biceps: { percentage: 38, lastUpdated: new Date().toISOString() },
        triceps: { percentage: 22, lastUpdated: new Date().toISOString() },
        traps: { percentage: 60, lastUpdated: new Date().toISOString() },
      };
      await AsyncStorage.setItem(`muscle_recovery_overrides_${userId}`, JSON.stringify(demoOverrides));
      
      showNotification({
        type: 'success',
        title: 'Seeding Sukses! 🏋️‍♂️',
        subtitle: 'Riwayat latihan demo berhasil dimasukkan ke database.',
        duration: 4000
      });
      
      Alert.alert("Sukses", "Data latihan demo spesifik (termasuk Lower Back, Biceps, Triceps) berhasil disimpan! Silakan muat ulang (reload) halaman utama untuk melihat warna peta otot.");
    } catch (e) {
      console.warn("Seeding failed:", e);
      Alert.alert("Seeding Gagal", e.message || "Pastikan koneksi internet aktif.");
    }
  };

  const handleToggleProStatus = async () => {
    if (!session?.user?.id) {
      Alert.alert("Error", "Anda harus login terlebih dahulu.");
      return;
    }
    
    try {
      const userId = session.user.id;
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      if (isPremium) {
        await AsyncStorage.removeItem(`premium_until_${userId}`);
        await AsyncStorage.setItem(`is_premium_${userId}`, 'false');
        await AsyncStorage.setItem(`@premium_status_${userId}`, 'inactive');
        setIsPremium(false);
        setPremiumUntilDate('');
        showNotification({
          type: 'success',
          title: 'Akun Diubah ke FREE ❌',
          subtitle: 'Fitur premium dinonaktifkan.',
          duration: 3000
        });
      } else {
        const premiumUntil = new Date();
        premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
        await AsyncStorage.setItem(`premium_until_${userId}`, premiumUntil.toISOString());
        await AsyncStorage.setItem(`is_premium_${userId}`, 'true');
        await AsyncStorage.setItem(`@premium_status_${userId}`, 'active');
        setIsPremium(true);
        setPremiumUntilDate(premiumUntil.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }));
        showNotification({
          type: 'success',
          title: 'Akun Diubah ke PRO 👑',
          subtitle: 'Fitur premium diaktifkan.',
          duration: 3000
        });
      }
    } catch (e) {
      Alert.alert("Gagal", "Tidak bisa mengubah status premium.");
    }
  };

  const showToast = (type, message) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: '', message: '' }), 3000);
  };

  const handleSave = async () => {
    const weightNum = parseFloat(editForm.weight);
    const heightNum = parseFloat(editForm.height);

    if (isNaN(weightNum) || isNaN(heightNum) || !editForm.name.trim()) {
      showToast('error', t('toast_please_fill_all_fiel'));
      return;
    }

    setEditing(false);
    const { success, error } = await updateProfile({
      name: editForm.name.trim(),
      body_weight: weightNum,
      height: heightNum
    });

    if (success) {
      if (updateMeasurements) {
        updateMeasurements({
          chest: editForm.chest.trim(),
          biceps: editForm.biceps.trim(),
          waist: editForm.waist.trim()
        });
      }
      showToast('success', t('toast_profile_updated_succ'));
    } else {
      setEditing(true);
      showToast('error', error || 'Failed to save profile.');
    }
  };

  const handlePickAvatar = async () => {
    setSettingsVisible(false);

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      showToast('error', t('toast_permission_to_access'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const { success, error } = await updateProfile({ avatar_url: base64Image });

      if (success) {
        showToast('success', t('toast_avatar_success'));
      } else {
        showToast('error', error || t('toast_avatar_fail'));
      }
    }
  };

  const handleHealthKitToggle = async () => {
    const nextVal = !healthKitConnected;
    if (nextVal) {
      Alert.alert(
        Platform.OS === 'ios' ? 'Apple Health Integration' : 'Google Fit Integration',
        Platform.OS === 'ios' 
          ? 'GymVault would like to sync body weight, active energy burn, and workout history from Apple Health.'
          : 'GymVault would like to sync body weight, active calories, and activity logs from Google Health Connect.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Allow Sync',
            onPress: async () => {
              try {
                setHealthKitConnected(true);
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem(`health_kit_connected_${session?.user?.id}`, 'true');

                const baseWeight = profile.body_weight > 0 ? profile.body_weight : 78.0;
                const simulatedWeight = Number((baseWeight + (Math.random() * 0.4 - 0.2)).toFixed(1));

                await updateProfile({ body_weight: simulatedWeight });
                showToast('success', Platform.OS === 'ios' 
                  ? `Health Kit Synced! Imported weight (${simulatedWeight} kg) from Apple Health.`
                  : `Google Fit Synced! Imported weight (${simulatedWeight} kg) from Health Connect.`
                );
              } catch (err) {
                showToast('error', 'Health Kit sync failed.');
              }
            }
          }
        ]
      );
    } else {
      setHealthKitConnected(false);
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(`health_kit_connected_${session?.user?.id}`, 'false');
        showToast('success', 'Health Kit disconnected.');
      } catch (e) {}
    }
  };

  const handleResetPassword = async () => {
    const email = profile.email || session?.user?.email;
    if (!email) { showToast('error', t('toast_pass_req')); return; }
    setSettingsVisible(false);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) showToast('error', error.message);
    else showToast('success', t('toast_pass_sent'));
  };

  const clearLocalDataOnSignOut = async () => {
    try {
      if (!session?.user?.id) return;
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const userId = session.user.id;
      await AsyncStorage.removeItem(`is_premium_${userId}`);
      await AsyncStorage.removeItem(`premium_until_${userId}`);
      await AsyncStorage.removeItem(`premium_since_${userId}`);
      await AsyncStorage.removeItem(`ai_usage_count_${userId}`);
      await AsyncStorage.removeItem(`ai_routine_daily_${userId}`);
      await AsyncStorage.removeItem(`ai_nutrition_daily_${userId}`);
      await AsyncStorage.removeItem(`@premium_status_${userId}`);
      await AsyncStorage.removeItem(`@premium_data_${userId}`);
    } catch (e) {}
  };

  const handleSignOut = async () => {
    const doLogout = async () => {
      setSettingsVisible(false);
      await clearLocalDataOnSignOut();
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('@supabase.auth.token');
      } catch (e) {}
      await supabase.auth.signOut();
      const { DeviceEventEmitter } = require('react-native');
      DeviceEventEmitter.emit('offline_login', null);
    };

    if (Platform.OS === 'web') {
      await doLogout();
    } else {
      Alert.alert(t('alert_logout_title'), t('alert_logout_msg'), [
        { text: t('alert_cancel'), style: 'cancel' },
        { text: t('logout'), style: 'destructive', onPress: doLogout }
      ]);
    }
  };

  const handleExportData = async () => {
    setExportModalVisible(false); setSettingsVisible(false);
    try {
      const { data } = await safeSelect('workout_sessions', {
        columns: '*, workout_sets(weight_kg, reps, is_checked)',
        filters: { user_id: session.user.id, is_completed: true },
      });
      if (!data || data.length === 0) { showToast('error', t('export_empty')); return; }
      const json = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'gymvault_export.json'; a.click();
        URL.revokeObjectURL(url);
      } else {
        const FileSystem = require('expo-file-system');
        const Sharing = require('expo-sharing');
        const fileUri = FileSystem.documentDirectory + 'gymvault_export.json';
        await FileSystem.writeAsStringAsync(fileUri, json);
        await Sharing.shareAsync(fileUri);
      }
      showToast('success', t('export_success'));
    } catch (e) { showToast('error', e.message); }
  };

  const handleNotificationToggle = async () => {
    const next = !notifications;
    setNotifications(next);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('notifications_enabled', String(next));
      
      if (next) {
        if (Platform.OS === 'web') {
          showToast('success', (t('toast_notifications_on')) + ' (Web Mode)');
          return;
        }
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await Notifications.cancelAllScheduledNotificationsAsync();
          await Notifications.scheduleNotificationAsync({
            content: { title: t('notif_reminder'), body: t('notif_body'), sound: true },
            trigger: { type: 'daily', hour: 17, minute: 0 },
          });
          showToast('success', (t('toast_notifications_on')));
        } else {
          showToast('success', (t('toast_notifications_on__ch')));
        }
      } else {
        if (Platform.OS !== 'web') {
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
        showToast('success', (t('toast_notifications_off')));
      }
    } catch (err) {
      console.warn('Notification toggle error:', err);
      showToast('success', next ? 'Notifications ON' : 'Notifications OFF');
    }
  };

  const getBmi = () => {
    if (!profile.body_weight || !profile.height) return '0.0';
    const hM = profile.height / 100;
    return (profile.body_weight / (hM * hM)).toFixed(1);
  };

  if (hookError) {
    return (
      <View style={[styles.screen, { backgroundColor: darkMode ? '#000000' : '#F5F5F5', justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <AlertTriangle color="#EF4444" size={48} style={{ marginBottom: 16 }} />
        <AppText weight="bold" style={{ fontSize: 20, color: darkMode ? '#FFF' : '#000', marginBottom: 8, textAlign: 'center' }}>{t('system_error')}</AppText>
        <AppText style={{ color: '#888', textAlign: 'center' }}>{hookError}</AppText>
      </View>
    );
  }

  // --- Dynamic Theme Colors based on Dark Mode Toggle ---
  const bgColor = darkMode ? '#000000' : '#F9FAFB';
  const cardColor = darkMode ? '#0A0A0A' : '#FFFFFF';
  const textColor = darkMode ? '#FFFFFF' : '#111827';
  const borderColor = darkMode ? '#222222' : '#E5E7EB';
  const textMuted = darkMode ? '#888888' : '#6B7280';

  return (
    <View style={[styles.screen, { backgroundColor: bgColor }]}>
      <Toast {...toast} />

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 36, paddingBottom: 12 }}>
        <TouchableOpacity
          onPress={() => setSettingsVisible(true)}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center' }}
        >
          <Settings color={theme.colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      <SmoothScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60, paddingTop: 0 }}>

        {/* Header Section */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity
            onPress={handlePickAvatar}
            style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(204, 255, 0, 0.1)', borderWidth: 1, borderColor: '#CCFF00', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#CCFF00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10, overflow: 'hidden' }}
          >
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <User color="#CCFF00" size={40} />
            )}
            <View style={{ position: 'absolute', bottom: 0, width: '100%', height: 20, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
              <Camera color="#FFF" size={12} />
            </View>
          </TouchableOpacity>

          {loading ? (
            <SkeletonBox width={150} height={24} style={{ marginBottom: 8 }} />
          ) : (
            <AppText weight="bold" style={{ fontSize: 24, color: textColor, marginBottom: 4 }}>{profile.name}</AppText>
          )}

          {loading ? (
            <SkeletonBox width={200} height={16} />
          ) : (
            <AppText style={{ color: textMuted, fontSize: 14 }}>{profile.email}</AppText>
          )}

          {isPremium ? (
            <>
              <View style={{ backgroundColor: 'rgba(204, 255, 0, 0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#CCFF00', flexDirection: 'row', alignItems: 'center' }}>
                <Award color="#CCFF00" size={14} style={{ marginRight: 6 }} />
                <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 12, letterSpacing: 1 }}>PRO MEMBER</AppText>
              </View>
              {(premiumSinceDate || premiumUntilDate) && (
                <View style={{ marginTop: 12, alignItems: 'center', backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }}>
                  {premiumSinceDate && <AppText style={{ color: textMuted, fontSize: 12, marginBottom: 2 }}>Mulai: <AppText weight="bold" style={{ color: textColor, fontSize: 12 }}>{premiumSinceDate}</AppText></AppText>}
                  {premiumUntilDate && <AppText style={{ color: textMuted, fontSize: 12 }}>Berakhir: <AppText weight="bold" style={{ color: darkMode ? '#CCFF00' : '#10B981', fontSize: 12 }}>{premiumUntilDate}</AppText></AppText>}
                </View>
              )}
            </>
          ) : (
            <View style={{ backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: darkMode ? '#666' : '#CCC', flexDirection: 'row', alignItems: 'center' }}>
              <AppText weight="bold" style={{ color: darkMode ? '#CCC' : '#666', fontSize: 12, letterSpacing: 1 }}>FREE MEMBER</AppText>
            </View>
          )}
        </View>

        {/* Biometrics Card */}
        <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: borderColor, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: darkMode ? 0 : 0.05, shadowRadius: 8, elevation: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <AppText weight="bold" style={{ color: textColor, fontSize: 18 }}>{t('biometrics')}</AppText>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setTdeeModalVisible(true)} style={{ backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 12 }}>TDEE Calc</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditing(true)}>
                <AppText weight="bold" style={{ color: '#CCFF00', marginTop: 4 }}>{t('edit_profile')}</AppText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center' }}>
              <AppText style={{ color: textMuted, fontSize: 12, marginBottom: 8 }}>{t('weight')}</AppText>
              {loading ? <SkeletonBox width={60} height={24} /> : (
                <AppText weight="bold" style={{ color: textColor, fontSize: 20, fontVariant: ['tabular-nums'] }}>{profile.body_weight || '--'} <AppText style={{ fontSize: 14, color: textMuted }}>kg</AppText></AppText>
              )}
            </View>

            <View style={{ width: 1, backgroundColor: borderColor }} />

            <View style={{ alignItems: 'center' }}>
              <AppText style={{ color: textMuted, fontSize: 12, marginBottom: 8 }}>{t('height')}</AppText>
              {loading ? <SkeletonBox width={60} height={24} /> : (
                <AppText weight="bold" style={{ color: textColor, fontSize: 20, fontVariant: ['tabular-nums'] }}>{profile.height || '--'} <AppText style={{ fontSize: 14, color: textMuted }}>cm</AppText></AppText>
              )}
            </View>

            <View style={{ width: 1, backgroundColor: borderColor }} />

            <View style={{ alignItems: 'center' }}>
              <AppText style={{ color: textMuted, fontSize: 12, marginBottom: 8 }}>{t('bmi')}</AppText>
              {loading ? <SkeletonBox width={50} height={24} /> : (
                <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 20, fontVariant: ['tabular-nums'] }}>{getBmi()}</AppText>
              )}
            </View>
          </View>

          {/* Measurements */}
          <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: borderColor, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <AppText style={{ color: textMuted, fontSize: 11, marginBottom: 8 }}>CHEST</AppText>
              <AppText weight="bold" style={{ color: textColor, fontSize: 16 }}>{measurements?.chest || '--'} <AppText style={{fontSize: 10, color: textMuted}}>cm</AppText></AppText>
            </View>
            <View style={{ width: 1, backgroundColor: borderColor, height: 30, alignSelf: 'center' }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <AppText style={{ color: textMuted, fontSize: 11, marginBottom: 8 }}>BICEPS</AppText>
              <AppText weight="bold" style={{ color: textColor, fontSize: 16 }}>{measurements?.biceps || '--'} <AppText style={{fontSize: 10, color: textMuted}}>cm</AppText></AppText>
            </View>
            <View style={{ width: 1, backgroundColor: borderColor, height: 30, alignSelf: 'center' }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <AppText style={{ color: textMuted, fontSize: 11, marginBottom: 8 }}>WAIST</AppText>
              <AppText weight="bold" style={{ color: textColor, fontSize: 16 }}>{measurements?.waist || '--'} <AppText style={{fontSize: 10, color: textMuted}}>cm</AppText></AppText>
            </View>
          </View>
        </View>

        {/* --- WEIGHT PROGRESS CHART --- */}
        {weightLogs && weightLogs.length >= 2 && (
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: borderColor, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <AppText weight="bold" style={{ color: textColor, fontSize: 16 }}>Weight Progress</AppText>
              <AppText style={{ color: '#CCFF00', fontSize: 12 }}>Last {weightLogs.length} logs</AppText>
            </View>
            <View style={{ height: 120, width: '100%' }}>
              <Svg width="100%" height="100%">
                {/* Find min/max for scaling */}
                {(() => {
                  const weights = weightLogs.map(l => parseFloat(l.weight) || 0).filter(w => w > 0);
                  const minW = Math.min(...weights) - 2;
                  const maxW = Math.max(...weights) + 2;
                  const range = maxW - minW || 1;
                  const wSpacing = 300 / Math.max(weights.length - 1, 1);
                  
                  const points = weights.map((w, i) => {
                    const x = i * wSpacing;
                    const y = 100 - ((w - minW) / range) * 80;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <Polyline points={points} fill="none" stroke="#CCFF00" strokeWidth="3" />
                      {weights.map((w, i) => {
                        const x = i * wSpacing;
                        const y = 100 - ((w - minW) / range) * 80;
                        return (
                          <React.Fragment key={i}>
                            <Circle cx={x} cy={y} r="4" fill={cardColor} stroke="#CCFF00" strokeWidth="2" />
                            {i === weights.length - 1 && (
                              <SvgText x={x - 10} y={y - 12} fill={textColor} fontSize="10" fontWeight="bold">
                                {w}kg
                              </SvgText>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </>
                  );
                })()}
              </Svg>
            </View>
          </View>
        )}

        {/* AI COACH ENGINE */}
        <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 12, marginTop: 8 }}>{t('ai_coach')}</AppText>

        {/* Daily Check-In Panel */}
        <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: checkedInToday ? 'rgba(204,255,0,0.3)' : borderColor, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: checkedInToday ? 'rgba(204,255,0,0.1)' : 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }}>
                <Flame color={checkedInToday ? '#CCFF00' : '#888'} size={22} fill={checkedInToday ? '#CCFF00' : 'none'} />
              </View>
              <View>
                <AppText weight="bold" style={{ color: textColor, fontSize: 15 }}>Daily Check-In</AppText>
                <AppText style={{ color: textMuted, fontSize: 11 }}>{checkedInToday ? 'Limit 15x AI Aktif' : 'Ambil limit 15x AI scan harian'}</AppText>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(204,255,0,0.2)' }}>
              <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 12 }}>{checkInStreak} Hari Streak</AppText>
            </View>
          </View>

          {/* 7-Day Journey Dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 }}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const activeDays = checkInStreak % 7 === 0 && checkInStreak > 0 ? 7 : checkInStreak % 7;
              const isCompleted = day <= activeDays;
              const isTodayUnclaimed = day === activeDays + 1 && !checkedInToday;
              
              // Special rewards indicators
              const isGiftDay = day === 3 || day === 7;
              const giftLabel = day === 3 ? '+15d' : '+30d';

              return (
                <View key={day} style={{ alignItems: 'center', flex: 1 }}>
                  {/* Bubble */}
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isCompleted ? '#CCFF00' : (isTodayUnclaimed ? 'rgba(204,255,0,0.1)' : 'rgba(255,255,255,0.05)'),
                    borderWidth: isTodayUnclaimed ? 2 : 1,
                    borderColor: isCompleted || isTodayUnclaimed ? '#CCFF00' : '#444',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 6,
                    position: 'relative'
                  }}>
                    {isCompleted ? (
                      <CheckCircle color="#000" size={16} />
                    ) : (
                      <AppText weight="bold" style={{ color: isTodayUnclaimed ? '#CCFF00' : '#888', fontSize: 11 }}>{day}</AppText>
                    )}

                    {/* Small Gift Tag on Day 3 & Day 7 */}
                    {isGiftDay && (
                      <View style={{
                        position: 'absolute',
                        top: -12,
                        backgroundColor: '#FF007F',
                        paddingHorizontal: 4,
                        paddingVertical: 1,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: '#000'
                      }}>
                        <AppText weight="bold" style={{ color: '#FFF', fontSize: 7 }}>{giftLabel}</AppText>
                      </View>
                    )}
                  </View>
                  <AppText style={{ color: isCompleted ? '#CCFF00' : '#888', fontSize: 9 }}>D{day}</AppText>
                </View>
              );
            })}
          </View>

          {/* Button */}
          {checkedInToday ? (
            <View
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.03)',
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#333',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8
              }}
            >
              <CheckCircle color="#CCFF00" size={16} />
              <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 13 }}>Sudah Check-In Hari Ini</AppText>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleDailyCheckIn}
              activeOpacity={0.8}
              style={{
                width: '100%',
                backgroundColor: '#CCFF00',
                paddingVertical: 12,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#CCFF00',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4
              }}
            >
              <AppText weight="bold" style={{ color: '#000', fontSize: 13 }}>Klaim Check-In Hari Ini</AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* Deload Suggester (CNS) */}
        <View style={{ backgroundColor: darkMode ? 'rgba(204, 255, 0, 0.05)' : '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: deloadSuggestion.status === 'Danger' ? '#EF4444' : (darkMode ? 'rgba(204, 255, 0, 0.2)' : '#E5E7EB'), marginBottom: 16, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: deloadSuggestion.status === 'Danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(204, 255, 0, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            {deloadSuggestion.status === 'Danger' ? <AlertTriangle color="#EF4444" size={24} /> : <Zap color="#CCFF00" size={24} />}
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" style={{ color: textColor, fontSize: 16, marginBottom: 4 }}>{t('recovery_status')}</AppText>
            {loading ? <SkeletonBox width="80%" height={16} /> : (
              <AppText style={{ color: textMuted, fontSize: 13, lineHeight: 18 }}>{t('deload_optimal_fallback') || deloadSuggestion.text}</AppText>
            )}
          </View>
        </View>

        {/* Injury Risk Aggregator */}
        <View style={{ backgroundColor: darkMode ? 'rgba(204, 255, 0, 0.05)' : '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: injuryRisk.risk === 'High' ? '#EF4444' : (darkMode ? 'rgba(204, 255, 0, 0.2)' : '#E5E7EB'), marginBottom: 24, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: injuryRisk.risk === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(204, 255, 0, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Activity color={injuryRisk.risk === 'High' ? '#EF4444' : '#CCFF00'} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" style={{ color: textColor, fontSize: 16, marginBottom: 4 }}>{t('injury_risk')}: {loading ? '...' : injuryRisk.risk}</AppText>
            {loading ? <SkeletonBox width="80%" height={16} /> : (
              <AppText style={{ color: textMuted, fontSize: 13, lineHeight: 18 }}>{t('injury_optimal_fallback') || injuryRisk.message}</AppText>
            )}
          </View>
        </View>

        {/* Lifetime Stats */}
        <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 12 }}>{t('lifetime_stats')}</AppText>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
          <View style={{ flex: 1, backgroundColor: cardColor, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: borderColor }}>
            <Target color="#CCFF00" size={20} style={{ marginBottom: 12 }} />
            {loading ? <SkeletonBox width={40} height={24} style={{ marginBottom: 4 }} /> : (
              <AppText weight="bold" style={{ color: textColor, fontSize: 24, fontVariant: ['tabular-nums'], marginBottom: 2 }}>{stats.totalWorkouts}</AppText>
            )}
            <AppText style={{ color: textMuted, fontSize: 12 }}>{t('total_sessions')}</AppText>
          </View>

          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setShareVolumeModalVisible(true)}
            style={{ flex: 1, backgroundColor: cardColor, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: borderColor }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <TrendingUp color="#CCFF00" size={20} />
              <View style={{ backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 10 }}>SHARE</AppText>
              </View>
            </View>
            {loading ? <SkeletonBox width={60} height={24} style={{ marginBottom: 4 }} /> : (
              <AppText weight="bold" style={{ color: textColor, fontSize: 24, fontVariant: ['tabular-nums'], marginBottom: 2 }}>{(stats.totalVolume / 1000).toFixed(1)}k</AppText>
            )}
            <AppText style={{ color: textMuted, fontSize: 12 }}>{t('volume')}</AppText>
          </TouchableOpacity>
        </View>

        {/* 🏅 Gamification / Trophies */}
        <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 12 }}>{t('trophy_cabinet')}</AppText>
        <ScrollView horizontal removeClippedSubviews={true} showsHorizontalScrollIndicator={false} style={{ marginBottom: 32, marginHorizontal: -24, paddingHorizontal: 24 }}>
          {[
            { id: 'first_blood', name: 'First Blood', desc: '1st Workout', icon: '1f3c5', achieved: stats.totalWorkouts >= 1 },
            { id: 'consistency', name: 'Consistency King', desc: '10 Workouts', icon: '1f3c6', achieved: stats.totalWorkouts >= 10 },
            { id: 'iron_addict', name: 'Iron Addict', desc: '50 Workouts', icon: '1f98d', achieved: stats.totalWorkouts >= 50 }, // Gorilla
            { id: 'elephant', name: 'The Elephant', desc: '10,000 kg Vol', icon: '1f418', achieved: stats.totalVolume >= 10000 },
            { id: 'hulk', name: 'Titan Strength', desc: '50,000 kg Vol', icon: '1f5ff', achieved: stats.totalVolume >= 50000 }, // Moai
            { id: 'streak', name: 'Streak Master', desc: '7 Days Streak', icon: '1f525', achieved: checkInStreak >= 7 },
          ].map((trophy, idx, arr) => (
            <View key={trophy.id} style={{ 
              width: 130, 
              backgroundColor: cardColor, 
              borderRadius: 20, 
              padding: 16, 
              borderWidth: 1, 
              borderColor: trophy.achieved ? '#CCFF00' : borderColor, 
              alignItems: 'center', 
              marginRight: idx === arr.length - 1 ? 48 : 16, 
              opacity: trophy.achieved ? 1 : 0.4, 
              shadowColor: trophy.achieved ? '#CCFF00' : '#000', 
              shadowOffset: {width: 0, height: 4}, 
              shadowOpacity: trophy.achieved ? 0.25 : 0.1, 
              shadowRadius: 8, 
              elevation: 4 
            }}>
              <ExpoLinearGradient
                colors={trophy.achieved ? ['#2A3300', '#1A2000'] : [theme.colors.inputBg, theme.colors.inputBg]}
                style={{ width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: trophy.achieved ? 'rgba(204,255,0,0.3)' : 'transparent' }}
              >
                <Image 
                  source={{ uri: `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u${trophy.icon}.png` }} 
                  style={{ width: 40, height: 40, transform: [{ scale: trophy.achieved ? 1.15 : 1 }] }} 
                />
              </ExpoLinearGradient>
              <AppText weight="bold" style={{ color: textColor, fontSize: 13, textAlign: 'center', marginBottom: 4, lineHeight: 16 }}>{trophy.name}</AppText>
              <AppText style={{ color: textMuted, fontSize: 11, textAlign: 'center' }}>{trophy.desc}</AppText>
            </View>
          ))}
        </ScrollView>

        {/* Muscle Recovery Map (Pro Feature) */}
        {proMode && (
          <View style={{ backgroundColor: cardColor, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: borderColor, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Flame color="#EF4444" size={24} style={{ marginRight: 12 }} />
              <View>
                <AppText weight="bold" style={{ color: textColor, fontSize: 18 }}>Muscle Recovery</AppText>
                <AppText style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>Estimated Readiness</AppText>
              </View>
            </View>

            <View style={{ gap: 16, marginTop: 8 }}>
              {[
                { name: 'Chest & Triceps', p: 85, color: '#10B981', desc: 'Fully Recovered' },
                { name: 'Back & Biceps', p: 40, color: '#F59E0B', desc: 'Needs Rest' },
                { name: 'Legs', p: 15, color: '#EF4444', desc: 'Fatigued' },
                { name: 'Shoulders', p: 95, color: '#10B981', desc: 'Prime Condition' },
                { name: 'Core', p: 60, color: '#CCFF00', desc: 'Recovering' },
              ].map((m, i) => (
                <View key={i}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <AppText weight="bold" style={{ color: textColor, fontSize: 13 }}>{m.name}</AppText>
                      <AppText style={{ color: textMuted, fontSize: 10 }}>({m.desc})</AppText>
                    </View>
                    <AppText style={{ color: m.color, fontSize: 13, fontWeight: 'bold' }}>{m.p}%</AppText>
                  </View>
                  <View style={{ width: '100%', height: 6, backgroundColor: theme.colors.inputBg, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${m.p}%`, height: '100%', backgroundColor: m.color, borderRadius: 3 }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}



        {/* View History Button */}
        <TouchableOpacity
          style={{ backgroundColor: cardColor, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: borderColor, marginBottom: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
          onPress={onGoToHistory}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.inputBg, justifyContent: 'center', alignItems: 'center' }}>
              <Clock color={textColor} size={22} />
            </View>
            <View>
              <AppText weight="bold" style={{ color: textColor, fontSize: 16 }}>{t('history_title')}</AppText>
              <AppText style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>{t('history_desc')}</AppText>
            </View>
          </View>
          <ChevronRight color={textMuted} size={20} />
        </TouchableOpacity>

      </SmoothScrollView>

      {/* --- SETTINGS MODAL --- */}
      <Modal visible={settingsVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: bgColor }}>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: borderColor }}>
            <AppText weight="bold" style={{ fontSize: 20, color: textColor }}>{t('settings')}</AppText>
            <TouchableOpacity onPress={() => setSettingsVisible(false)} style={{ padding: 8 }}>
              <X color={textColor} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 8 }}>{t('appearance')}</AppText>

            <View style={{ backgroundColor: cardColor, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: borderColor, marginBottom: 24 }}>
              <SettingItem
                icon={Globe}
                title={t('language')}
                value={language.toUpperCase()}
                onPress={() => {
                  setSettingsVisible(false);
                  setLanguageModalVisible(true);
                }}
              />
              <SettingItem
                icon={Zap}
                title="Graphics Quality"
                value={graphicsQuality === 'extreme' ? 'Extreme' : graphicsQuality === 'high' ? 'High' : graphicsQuality === 'medium' ? 'Medium' : graphicsQuality === 'potato' ? 'Potato' : 'Low'}
                onPress={() => {
                  setSettingsVisible(false);
                  setGraphicsModalVisible(true);
                }}
              />
              <SettingItem
                icon={Activity}
                title="Framerate (FPS)"
                value={`${fpsLimit} FPS`}
                onPress={() => {
                  setSettingsVisible(false);
                  setFpsModalVisible(true);
                }}
              />
              <SettingItem
                icon={Target}
                title="Pro Lifter Mode (RPE, Set Tags)"
                type="toggle"
                toggleValue={proMode}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setProMode(!proMode);
                }}
              />
              <SettingItem
                icon={Moon}
                title={t('dark_mode')}
                type="toggle"
                toggleValue={darkMode}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDarkMode(!darkMode);
                  showToast('success', !darkMode ? t('toast_dark_mode_activated') : t('toast_light_mode_activated'));
                }}
              />
              <SettingItem
                icon={Bell}
                title={t('notifications')}
                type="toggle"
                toggleValue={notifications}
                onPress={handleNotificationToggle}
              />
              <SettingItem
                icon={Shield}
                title={t('privacy')}
                type="toggle"
                toggleValue={privateMode}
                onPress={async () => {
                  const nextPriv = !privateMode;
                  setPrivateMode(nextPriv);
                  try {
                    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                    await AsyncStorage.setItem('gymvault_private_mode', String(nextPriv));
                    if (session?.user?.id) {
                      await updateProfile({ is_private: nextPriv });
                    }
                  } catch (e) {}
                  showToast('success', nextPriv ? t('toast_workout_logs_are_now') : t('toast_workout_logs_are_publ'));
                }}
              />
              <SettingItem
                icon={Settings}
                title={t('units')}
                value={weightUnit === 'metric' ? 'Metric' : 'Imperial'}
                onPress={() => setUnitsModalVisible(true)}
              />
              <SettingItem
                icon={Activity}
                title={Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit Connect'}
                type="toggle"
                toggleValue={healthKitConnected}
                onPress={handleHealthKitToggle}
              />
            </View>

            <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 8 }}>PREMIUM & SUPPORT</AppText>
            <View style={{ backgroundColor: cardColor, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: borderColor, marginBottom: 24 }}>
              <SettingItem
                icon={Award}
                title="Redeem Premium Code"
                onPress={() => {
                  setSettingsVisible(false);
                  setRedeemModalVisible(true);
                }}
              />
              <SettingItem
                icon={Activity}
                title="Support Developer (DANA)"
                onPress={() => {
                  Alert.alert('Support GymVault ☕', 'Terima kasih telah menggunakan GymVault! Fitur ini bisa Anda gunakan gratis. Jika Anda ingin mendukung biaya server, silakan scan QRIS Dhani pada menu AI Routine.');
                }}
              />
            </View>

            <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 8 }}>{t('data_privacy')}</AppText>
            <View style={{ backgroundColor: cardColor, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: borderColor, marginBottom: 24 }}>
              <SettingItem
                icon={Download}
                title={t('export_data')}
                onPress={() => setExportModalVisible(true)}
              />
              <SettingItem
                icon={Trash2}
                title={t('clear_cache')}
                onPress={() => showToast('success', t('toast_local_cache_cleared'))}
              />
            </View>

            <AppText weight="bold" style={{ fontSize: 14, color: textMuted, letterSpacing: 1, marginBottom: 8 }}>{t('account')}</AppText>

            <View style={{ backgroundColor: cardColor, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: borderColor, marginBottom: 40 }}>
              <SettingItem
                icon={Camera}
                title={t('change_avatar')}
                onPress={handlePickAvatar}
              />
              <SettingItem
                icon={User}
                title={t('edit_name')}
                onPress={() => {
                  setSettingsVisible(false);
                  setEditModalVisible(true);
                }}
              />
              <SettingItem
                icon={Lock}
                title={t('reset_password')}
                onPress={handleResetPassword}
              />
              <SettingItem
                icon={LogOut}
                title={t('logout')}
                onPress={handleSignOut}
              />
            </View>
          </ScrollView>

        </View>
      </Modal>

      {/* EDIT PROFILE MODAL */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: borderColor }}>
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, marginBottom: 24 }}>{t('edit_profile_title')}</AppText>
            <AppText style={{ color: textMuted, fontSize: 13, marginBottom: 6 }}>{t('name_label')}</AppText>
            <TextInput style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1, borderColor: borderColor, marginBottom: 16, fontFamily: 'Inter_600SemiBold' }} value={editForm.name} onChangeText={v => setEditForm(p => ({ ...p, name: v }))} placeholder={t('placeholder_name')} placeholderTextColor="#555" />
            <AppText style={{ color: textMuted, fontSize: 13, marginBottom: 6 }}>{t('weight_label')}</AppText>
            <TextInput style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1, borderColor: borderColor, marginBottom: 16, fontFamily: 'Inter_600SemiBold' }} value={editForm.weight} onChangeText={v => setEditForm(p => ({ ...p, weight: v }))} keyboardType="numeric" />
            <AppText style={{ color: textMuted, fontSize: 13, marginBottom: 6 }}>{t('height_label')}</AppText>
            <TextInput style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1, borderColor: borderColor, marginBottom: 24, fontFamily: 'Inter_600SemiBold' }} value={editForm.height} onChangeText={v => setEditForm(p => ({ ...p, height: v }))} keyboardType="numeric" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center' }}>
                <AppText weight="bold" style={{ color: textMuted }}>{t('cancel')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditModalVisible(false); handleSave(); }} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#CCFF00', alignItems: 'center' }}>
                <AppText weight="bold" style={{ color: '#000' }}>{t('save')}</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* WEIGHT UNITS MODAL */}
      <Modal visible={unitsModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: borderColor }}>
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, marginBottom: 24 }}>{t('units_title')}</AppText>
            {['metric', 'imperial'].map(u => (
              <TouchableOpacity key={u} onPress={() => { setWeightUnit(u); setUnitsModalVisible(false); showToast('success', u === 'metric' ? t('unit_metric') : t('unit_imperial')); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: weightUnit === u ? 'rgba(204,255,0,0.15)' : 'transparent', borderWidth: 1, borderColor: weightUnit === u ? '#CCFF00' : borderColor, marginBottom: 12 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: weightUnit === u ? '#CCFF00' : '#555', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  {weightUnit === u && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCFF00' }} />}
                </View>
                <AppText weight="bold" style={{ color: textColor, fontSize: 16 }}>{u === 'metric' ? t('unit_metric') : t('unit_imperial')}</AppText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setUnitsModalVisible(false)} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center', marginTop: 8 }}>
              <AppText weight="bold" style={{ color: textMuted }}>{t('cancel')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LANGUAGE SELECTOR MODAL */}
      <Modal visible={languageModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: borderColor }}>
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, marginBottom: 24 }}>{t('language')}</AppText>
            {[
              { code: 'en', label: 'English (US)', flag: '🇺🇸' },
              { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
              { code: 'es', label: 'Español', flag: '🇪🇸' },
              { code: 'fr', label: 'Français', flag: '🇫🇷' },
              { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
              { code: 'it', label: 'Italiano', flag: '🇮🇹' },
              { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
              { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
              { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
            ].map(l => (
              <TouchableOpacity 
                key={l.code} 
                onPress={() => { 
                  setLanguage(l.code); 
                  setLanguageModalVisible(false); 
                  showToast('success', `${t('toast_lang_changed')} ${l.label}`); 
                }} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: language === l.code ? 'rgba(204,255,0,0.15)' : 'transparent', 
                  borderWidth: 1, 
                  borderColor: language === l.code ? '#CCFF00' : borderColor, 
                  marginBottom: 12 
                }}
              >
                <AppText style={{ fontSize: 20, marginRight: 14 }}>{l.flag}</AppText>
                <AppText weight="bold" style={{ color: textColor, fontSize: 16, flex: 1 }}>{l.label}</AppText>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: language === l.code ? '#CCFF00' : '#555', justifyContent: 'center', alignItems: 'center' }}>
                  {language === l.code && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCFF00' }} />}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setLanguageModalVisible(false)} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center', marginTop: 8 }}>
              <AppText weight="bold" style={{ color: textMuted }}>{t('cancel')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* GRAPHICS QUALITY MODAL */}
      <Modal visible={graphicsModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: borderColor }}>
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, marginBottom: 24 }}>Graphics Quality</AppText>
            {[
              { code: 'extreme', label: 'Extreme', desc: 'World-class cinematic animations, heavy 3D effects' },
              { code: 'high', label: 'High', desc: 'Smooth animations, blur effects, full transitions' },
              { code: 'medium', label: 'Medium', desc: 'Optimized transitions, fewer heavy effects' },
              { code: 'low', label: 'Low', desc: 'No heavy animations, aggressive memory savings' },
              { code: 'potato', label: 'Potato', desc: 'Absolute minimum rendering, maximum speed' },
            ].map(g => (
              <TouchableOpacity 
                key={g.code} 
                onPress={() => { 
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setGraphicsQuality(g.code); 
                  setGraphicsModalVisible(false); 
                  showToast('success', `Graphics set to ${g.label}`); 
                }} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: graphicsQuality === g.code ? 'rgba(204,255,0,0.15)' : 'transparent', 
                  borderWidth: 1, 
                  borderColor: graphicsQuality === g.code ? '#CCFF00' : borderColor, 
                  marginBottom: 12 
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{ color: textColor, fontSize: 16, marginBottom: 4 }}>{g.label}</AppText>
                  <AppText style={{ color: textMuted, fontSize: 12 }}>{g.desc}</AppText>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: graphicsQuality === g.code ? '#CCFF00' : '#555', justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                  {graphicsQuality === g.code && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCFF00' }} />}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setGraphicsModalVisible(false)} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center', marginTop: 8 }}>
              <AppText weight="bold" style={{ color: textMuted }}>{t('cancel')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FPS LIMIT MODAL */}
      <Modal visible={fpsModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: borderColor }}>
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, marginBottom: 24 }}>Framerate Limit</AppText>
            {[
              { code: '120', label: '120 FPS', desc: 'Ultra smooth, requires capable display' },
              { code: '90', label: '90 FPS', desc: 'Very smooth, great balance for high-end' },
              { code: '60', label: '60 FPS', desc: 'Standard smooth experience' },
              { code: '30', label: '30 FPS', desc: 'Battery saver' },
            ].map(f => (
              <TouchableOpacity 
                key={f.code} 
                onPress={() => { 
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFpsLimit(f.code); 
                  setFpsModalVisible(false); 
                  showToast('success', `FPS set to ${f.label}`); 
                }} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: fpsLimit === f.code ? 'rgba(204,255,0,0.15)' : 'transparent', 
                  borderWidth: 1, 
                  borderColor: fpsLimit === f.code ? '#CCFF00' : borderColor, 
                  marginBottom: 12 
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{ color: textColor, fontSize: 16, marginBottom: 4 }}>{f.label}</AppText>
                  <AppText style={{ color: textMuted, fontSize: 12 }}>{f.desc}</AppText>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: fpsLimit === f.code ? '#CCFF00' : '#555', justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                  {fpsLimit === f.code && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCFF00' }} />}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setFpsModalVisible(false)} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center', marginTop: 8 }}>
              <AppText weight="bold" style={{ color: textMuted }}>{t('cancel')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SHARE TOTAL VOLUME MODAL */}
      <Modal visible={shareVolumeModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          
          {!showSessionSelector && (
            <TouchableOpacity onPress={() => setShowSessionSelector(true)} style={{ flexDirection: 'row', backgroundColor: '#222', borderRadius: 12, padding: 14, marginBottom: 20, width: '100%', maxWidth: 360, justifyContent: 'space-between', alignItems: 'center' }}>
               <AppText weight="bold" style={{ color: '#FFF', fontSize: 14 }}>
                 {shareMode === 'lifetime' ? 'Rekor Keseluruhan (Semua Waktu)' : (() => {
                    const s = sessions?.find(x => x.id === shareMode);
                    if (!s) return 'Pilih Sesi...';
                    const dObj = new Date((s.started_at || '').replace(' ', 'T'));
                    return !isNaN(dObj.getTime()) ? `Sesi: ${dObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Sesi Terpilih';
                 })()}
               </AppText>
               <ChevronRight color="#888" size={20} />
            </TouchableOpacity>
          )}

          {showSessionSelector ? (
            <View style={{ width: '100%', maxWidth: 360, backgroundColor: '#1A1A1A', borderRadius: 16, flex: 1, maxHeight: 450, borderWidth: 1, borderColor: '#333', overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' }}>
                <AppText weight="bold" style={{ color: '#FFF', fontSize: 16 }}>Pilih Data</AppText>
                <TouchableOpacity onPress={() => setShowSessionSelector(false)}>
                  <X color="#888" size={20} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={true}>
                <TouchableOpacity onPress={() => { setShareMode('lifetime'); setShowSessionSelector(false); }} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#333', backgroundColor: shareMode === 'lifetime' ? 'rgba(204,255,0,0.1)' : 'transparent' }}>
                  <AppText weight="bold" style={{ color: shareMode === 'lifetime' ? '#CCFF00' : '#FFF' }}>Rekor Keseluruhan (Semua Waktu)</AppText>
                </TouchableOpacity>
                {(sessions || []).slice(0, 30).map((s, idx) => {
                  const dObj = new Date((s.started_at || '').replace(' ', 'T'));
                  const label = !isNaN(dObj.getTime()) ? dObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : `Sesi ${idx+1}`;
                  return (
                    <TouchableOpacity key={s.id} onPress={() => { setShareMode(s.id); setShowSessionSelector(false); }} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#333', backgroundColor: shareMode === s.id ? 'rgba(204,255,0,0.1)' : 'transparent' }}>
                      <AppText weight="bold" style={{ color: shareMode === s.id ? '#CCFF00' : '#FFF' }}>{label}</AppText>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          ) : (
            <>
              <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }} style={{ borderRadius: 32, overflow: 'hidden', width: '100%', maxWidth: 360, aspectRatio: 4/5 }}>
                {(() => {
                  const isLifetime = shareMode === 'lifetime';
                  const selectedSession = sessions?.find(s => s.id === shareMode);

                  let displayVolume = stats.totalVolume;
                  let dateText = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                  let subtitle = 'TOTAL ANGKATAN KESELURUHAN';

                  if (!isLifetime && selectedSession) {
                    let sVol = 0;
                    (selectedSession.workout_sets || []).forEach(set => {
                      if (set.is_checked) sVol += (set.weight_kg || 0) * (set.reps || 0);
                    });
                    displayVolume = sVol;
                    const safeStr = (selectedSession.started_at || '').replace(' ', 'T');
                    const dObj = new Date(safeStr);
                    if (!isNaN(dObj.getTime())) {
                      dateText = dObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
                    }
                    subtitle = 'TOTAL ANGKATAN SESI INI';
                  }

                  const comp = getVolumeComparison(displayVolume);

                  return (
                    <ExpoLinearGradient colors={['#1F1F24', '#0A0A0C']} style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
                      
                      {/* Top Strava-like Profile Header */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Image source={{ uri: profile.avatar_url || 'https://ui-avatars.com/api/?name=Gym+Athlete&background=CCFF00&color=000' }} style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#333' }} />
                        <View style={{ flex: 1 }}>
                          <AppText weight="bold" style={{ color: '#FFFFFF', fontSize: 16 }}>{profile.name || 'GymVault Athlete'}</AppText>
                          <AppText style={{ color: '#888888', fontSize: 12, marginTop: 2 }}>{dateText}</AppText>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#CCFF00' }} />
                            <AppText weight="bold" style={{ color: '#FFFFFF', letterSpacing: 1, fontSize: 12 }}>GYMVAULT</AppText>
                          </View>
                        </View>
                      </View>

                      {/* Center Floating Object */}
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 10 }}>
                        <Image source={{ uri: comp.imageUrl }} style={{ width: '100%', height: 220, resizeMode: 'contain', 
                          shadowColor: '#CCFF00', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 30 
                        }} />
                        <AppText weight="bold" style={{ color: '#FFFFFF', fontSize: 28, textAlign: 'center', marginTop: 16, letterSpacing: 1 }}>{comp.qty}x {comp.item.toUpperCase()}</AppText>
                        <AppText style={{ color: '#888', fontSize: 12, textAlign: 'center', marginTop: 6, letterSpacing: 2 }}>{subtitle}</AppText>
                      </View>

                      {/* Bottom Stats (Only Total Volume) */}
                      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20, justifyContent: 'center' }}>
                        <View style={{ alignItems: 'center' }}>
                          <AppText style={{ color: '#888', fontSize: 11, marginBottom: 4, letterSpacing: 1 }}>VOLUME TOTAL</AppText>
                          <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 32 }}>{displayVolume >= 1000 ? (displayVolume / 1000).toFixed(1) + 'k' : displayVolume} <AppText style={{ fontSize: 18, color: '#FFF' }}>kg</AppText></AppText>
                        </View>
                      </View>

                    </ExpoLinearGradient>
                  );
                })()}
              </ViewShot>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%', maxWidth: 360 }}>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const uri = await viewShotRef.current.capture();
                      if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your GymVault Record!' });
                      } else {
                        Alert.alert("Error", "Sharing is not available on this device.");
                      }
                    } catch (e) {
                      console.warn("Share error", e);
                    }
                  }}
                  style={{ flex: 1, backgroundColor: '#CCFF00', borderRadius: 14, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
                >
                  <Share2 color="#000" size={20} />
                  <AppText weight="bold" style={{ color: '#000000', fontSize: 16 }}>Share IG Story</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const uri = await viewShotRef.current.capture();
                      const { status } = await MediaLibrary.requestPermissionsAsync();
                      if (status === 'granted') {
                        await MediaLibrary.saveToLibraryAsync(uri);
                        Alert.alert("Tersimpan!", "Gambar berhasil disimpan ke Galeri HP Anda.");
                      } else {
                        Alert.alert("Error", "Izin akses galeri dibutuhkan untuk menyimpan gambar.");
                      }
                    } catch (e) {
                      console.warn("Save error", e);
                      Alert.alert("Gagal menyimpan", "Terjadi kesalahan saat memproses gambar.");
                    }
                  }}
                  style={{ backgroundColor: '#333', borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Download color="#FFF" size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShareVolumeModalVisible(false);
                    setShowSessionSelector(false);
                  }}
                  style={{ backgroundColor: '#222', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' }}
                >
                  <X color="#FFF" size={24} />
                </TouchableOpacity>
              </View>
            </>
          )}
          
        </View>
      </Modal>

      {/* REDEEM PREMIUM MODAL */}
      <Modal visible={redeemModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: theme.colors.primary }}>
            <Award color={theme.colors.primary} size={48} style={{ marginBottom: 16, alignSelf: 'center' }} />
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, marginBottom: 8, textAlign: 'center' }}>Redeem Premium</AppText>
            <AppText style={{ color: textMuted, fontSize: 13, marginBottom: 24, textAlign: 'center', lineHeight: 20 }}>
              Masukkan kode rahasia dari admin (via WhatsApp) untuk mengaktifkan AI tanpa batas!
            </AppText>
            
            <TextInput 
              style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 10, padding: 14, fontSize: 18, borderWidth: 1, borderColor: borderColor, marginBottom: 24, fontFamily: 'Inter_600SemiBold', textAlign: 'center', textTransform: 'uppercase' }} 
              value={redeemCode} 
              onChangeText={setRedeemCode} 
              placeholder="CONTOH: GV-A8F2" 
              placeholderTextColor="#555" 
              autoCapitalize="characters"
            />
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center' }} onPress={() => setRedeemModalVisible(false)}>
                <AppText style={{ color: textColor, textAlign: 'center' }}>Batal</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#CCFF00', alignItems: 'center' }} onPress={async () => {
                if (!redeemCode.trim()) return;
                try {
                  const codeToRedeem = redeemCode.trim().toUpperCase();
                  // Check code in Supabase
                  const { data, error } = await supabase
                    .from('promo_codes')
                    .select('*')
                    .eq('code', codeToRedeem)
                    .single();

                  if (error || !data) {
                    setRedeemModalVisible(false);
                    showToast('error', 'Ops! Kode tidak ditemukan atau salah ❌');
                    return;
                  }

                  if (data.is_used) {
                    setRedeemModalVisible(false);
                    showToast('error', 'Ops! Kode ini sudah pernah dipakai oleh orang lain ⚠️');
                    return;
                  }

                  // Mark as used
                  const { error: updateErr } = await supabase
                    .from('promo_codes')
                    .update({ is_used: true, used_by: session.user.id })
                    .eq('id', data.id);

                  if (updateErr) {
                    setRedeemModalVisible(false);
                    showToast('error', 'Terjadi kesalahan sistem database. Coba lagi.');
                    return;
                  }

                  // Success
                  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                  const premiumNow = new Date();
                  const premiumUntil = new Date();
                  premiumUntil.setDate(premiumUntil.getDate() + 30);
                  
                  const userId = session.user.id;
                  await AsyncStorage.setItem(`premium_since_${userId}`, premiumNow.toISOString());
                  await AsyncStorage.setItem(`premium_until_${userId}`, premiumUntil.toISOString());
                  await AsyncStorage.setItem(`is_premium_${userId}`, 'true'); // For backwards compatibility if any
                  await AsyncStorage.setItem(`@premium_status_${userId}`, 'active');
                  setRedeemModalVisible(false);
                  setRedeemCode('');
                  showToast('success', 'Selamat! Akun Premium Anda aktif selama 1 Bulan 👑');
                } catch (e) {
                  setRedeemModalVisible(false);
                  showToast('error', 'Terjadi kesalahan jaringan.');
                }
              }}>
                <AppText weight="bold" style={{ color: '#000' }}>Aktivasi</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EXPORT CONFIRM MODAL */}
      <Modal visible={exportModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: borderColor }}>
            <Download color="#CCFF00" size={40} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <AppText weight="bold" style={{ fontSize: 20, color: textColor, textAlign: 'center', marginBottom: 8 }}>{t('export_title')}</AppText>
            <AppText style={{ color: textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>{t('export_confirm')}</AppText>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setExportModalVisible(false)} style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: borderColor, alignItems: 'center' }}>
                <AppText weight="bold" style={{ color: textMuted }}>{t('cancel')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleExportData} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#CCFF00', alignItems: 'center' }}>
                <AppText weight="bold" style={{ color: '#000' }}>{t('confirm')}</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- TDEE CALCULATOR MODAL --- */}
      <Modal visible={tdeeModalVisible} animationType="slide" transparent={true} onRequestClose={() => setTdeeModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: cardColor, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, height: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <AppText weight="bold" style={{ color: textColor, fontSize: 20 }}>TDEE Calculator</AppText>
              <TouchableOpacity onPress={() => setTdeeModalVisible(false)} style={{ padding: 8, backgroundColor: darkMode ? '#333' : '#F3F4F6', borderRadius: 20 }}>
                <X color={textColor} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <AppText style={{ color: textMuted, marginBottom: 24 }}>
                Hitung kebutuhan kalori harian Anda berdasarkan berat {profile?.body_weight || 0} kg dan tinggi {profile?.height || 0} cm.
              </AppText>

              {/* Gender */}
              <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Gender</AppText>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <TouchableOpacity onPress={() => setTdeeForm({...tdeeForm, gender: 'male'})} style={{ flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: tdeeForm.gender === 'male' ? '#CCFF00' : borderColor, backgroundColor: tdeeForm.gender === 'male' ? 'rgba(204,255,0,0.1)' : 'transparent', alignItems: 'center' }}>
                  <AppText weight="bold" style={{ color: tdeeForm.gender === 'male' ? '#CCFF00' : textColor }}>Pria</AppText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTdeeForm({...tdeeForm, gender: 'female'})} style={{ flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: tdeeForm.gender === 'female' ? '#CCFF00' : borderColor, backgroundColor: tdeeForm.gender === 'female' ? 'rgba(204,255,0,0.1)' : 'transparent', alignItems: 'center' }}>
                  <AppText weight="bold" style={{ color: tdeeForm.gender === 'female' ? '#CCFF00' : textColor }}>Wanita</AppText>
                </TouchableOpacity>
              </View>

              {/* Age */}
              <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Umur (Tahun)</AppText>
              <TextInput style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 16, marginBottom: 20, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: borderColor }} value={tdeeForm.age} onChangeText={v => setTdeeForm({...tdeeForm, age: v})} keyboardType="numeric" />

              {/* Activity Level */}
              <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Level Aktivitas (Olahraga)</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {[
                  { value: '1.2', label: 'Jarang (Sedentary)' },
                  { value: '1.375', label: '1-3x Seminggu' },
                  { value: '1.55', label: '3-5x Seminggu' },
                  { value: '1.725', label: '6-7x Seminggu' }
                ].map(act => (
                  <TouchableOpacity key={act.value} onPress={() => setTdeeForm({...tdeeForm, activity: act.value})} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: tdeeForm.activity === act.value ? '#CCFF00' : borderColor, backgroundColor: tdeeForm.activity === act.value ? 'rgba(204,255,0,0.1)' : 'transparent', marginBottom: 8 }}>
                    <AppText style={{ color: tdeeForm.activity === act.value ? '#CCFF00' : textColor }}>{act.label}</AppText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Goal */}
              <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Tujuan (Goal)</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                {[
                  { value: 'cut', label: 'Cutting (-500 kcal)' },
                  { value: 'maintain', label: 'Maintain (TDEE)' },
                  { value: 'bulk', label: 'Bulking (+500 kcal)' }
                ].map(g => (
                  <TouchableOpacity key={g.value} onPress={() => setTdeeForm({...tdeeForm, goal: g.value})} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: tdeeForm.goal === g.value ? '#CCFF00' : borderColor, backgroundColor: tdeeForm.goal === g.value ? 'rgba(204,255,0,0.1)' : 'transparent', marginBottom: 8 }}>
                    <AppText style={{ color: tdeeForm.goal === g.value ? '#CCFF00' : textColor }}>{g.label}</AppText>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={{ backgroundColor: '#CCFF00', padding: 16, borderRadius: 16, marginTop: 16, marginBottom: 32, alignItems: 'center', shadowColor: '#CCFF00', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }} onPress={() => {
                const w = parseFloat(profile?.body_weight) || 70;
                const h = parseFloat(profile?.height) || 170;
                const a = parseFloat(tdeeForm.age) || 25;
                // Mifflin-St Jeor
                let bmr = (10 * w) + (6.25 * h) - (5 * a);
                bmr += (tdeeForm.gender === 'male' ? 5 : -161);
                
                let tdee = bmr * parseFloat(tdeeForm.activity);
                
                if (tdeeForm.goal === 'cut') tdee -= 500;
                if (tdeeForm.goal === 'bulk') tdee += 500;
                
                const targetCalories = Math.round(tdee);
                const targetProtein = Math.round(w * 2.2); // ~2.2g per kg bodyweight
                
                if (updateNutritionGoals) {
                  updateNutritionGoals({ target_calories: targetCalories, target_protein: targetProtein });
                  showToast('success', `Target diset: ${targetCalories} kcal, ${targetProtein}g Protein`);
                  setTdeeModalVisible(false);
                }
              }}>
                <AppText weight="bold" style={{ color: '#000', fontSize: 16, textAlign: 'center' }}>Hitung & Simpan Target</AppText>
              </TouchableOpacity>
              
              {nutritionGoals?.target_calories > 0 && (
                 <View style={{ marginTop: 24, padding: 16, backgroundColor: 'rgba(204,255,0,0.05)', borderRadius: 12, borderWidth: 1, borderColor: '#CCFF00' }}>
                   <AppText style={{ color: '#CCFF00', textAlign: 'center', marginBottom: 8 }}>Target Saat Ini</AppText>
                   <AppText weight="bold" style={{ color: textColor, fontSize: 24, textAlign: 'center' }}>{nutritionGoals.target_calories} kcal</AppText>
                   <AppText style={{ color: textMuted, textAlign: 'center' }}>Protein: {nutritionGoals.target_protein}g</AppText>
                 </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- EDIT PROFILE MODAL --- */}
      <Modal visible={editing} animationType="slide" transparent={true} onRequestClose={() => setEditing(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: cardColor, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, height: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <AppText weight="bold" style={{ color: textColor, fontSize: 20 }}>{t('edit_profile')}</AppText>
              <TouchableOpacity onPress={() => setEditing(false)} style={{ padding: 8, backgroundColor: theme.colors.inputBg, borderRadius: 20 }}>
                <X color={textColor} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Nama Lengkap</AppText>
              <TextInput style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 16, marginBottom: 16, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: borderColor }} value={editForm.name} onChangeText={v => setEditForm({...editForm, name: v})} placeholder="Nama Anda" placeholderTextColor="#888" />

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Berat Badan (kg)</AppText>
                  <TextInput style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 16, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: borderColor }} value={editForm.weight} onChangeText={v => setEditForm({...editForm, weight: v})} keyboardType="numeric" placeholder="70" placeholderTextColor="#888" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{ color: textColor, marginBottom: 8 }}>Tinggi Badan (cm)</AppText>
                  <TextInput style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 16, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: borderColor }} value={editForm.height} onChangeText={v => setEditForm({...editForm, height: v})} keyboardType="numeric" placeholder="170" placeholderTextColor="#888" />
                </View>
              </View>

              <AppText weight="bold" style={{ color: textMuted, marginBottom: 12, marginTop: 8 }}>BODY MEASUREMENTS (OPSIONAL)</AppText>
              
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
                <View style={{ flex: 1 }}>
                  <AppText style={{ color: textColor, fontSize: 12, marginBottom: 6 }}>Chest (cm)</AppText>
                  <TextInput style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', borderWidth: 1, borderColor: borderColor }} value={editForm.chest} onChangeText={v => setEditForm({...editForm, chest: v})} keyboardType="numeric" placeholder="--" placeholderTextColor="#888" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ color: textColor, fontSize: 12, marginBottom: 6 }}>Biceps (cm)</AppText>
                  <TextInput style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', borderWidth: 1, borderColor: borderColor }} value={editForm.biceps} onChangeText={v => setEditForm({...editForm, biceps: v})} keyboardType="numeric" placeholder="--" placeholderTextColor="#888" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ color: textColor, fontSize: 12, marginBottom: 6 }}>Waist (cm)</AppText>
                  <TextInput style={{ backgroundColor: theme.colors.inputBg, color: textColor, borderRadius: 12, padding: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', borderWidth: 1, borderColor: borderColor }} value={editForm.waist} onChangeText={v => setEditForm({...editForm, waist: v})} keyboardType="numeric" placeholder="--" placeholderTextColor="#888" />
                </View>
              </View>

              <TouchableOpacity style={{ backgroundColor: '#CCFF00', padding: 16, borderRadius: 16, marginTop: 16, marginBottom: 32, alignItems: 'center', shadowColor: '#CCFF00', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }} onPress={() => {
                handleSave();
                setEditing(false);
              }}>
                <AppText weight="bold" style={{ color: '#000', fontSize: 16, textAlign: 'center' }}>Simpan Perubahan</AppText>
              </TouchableOpacity>
              
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══ AUTO DAILY CHECK-IN PROMPT MODAL ═══ */}
      <Modal visible={showCheckInPrompt} transparent animationType="fade" onRequestClose={() => setShowCheckInPrompt(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#0A0A0C', borderRadius: 24, borderWidth: 1.5, borderColor: '#CCFF00', width: '100%', maxWidth: 360, padding: 24, alignItems: 'center', shadowColor: '#CCFF00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 20 }}>
            
            <TouchableOpacity onPress={() => setShowCheckInPrompt(false)} style={{ position: 'absolute', top: 16, right: 16, padding: 4 }}>
              <X color="#888" size={20} />
            </TouchableOpacity>

            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(204,255,0,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, marginTop: 12, borderWidth: 1, borderColor: 'rgba(204,255,0,0.3)' }}>
              <Flame color="#CCFF00" size={32} fill="#CCFF00" />
            </View>

            <AppText weight="bold" style={{ fontSize: 22, color: '#FFF', textAlign: 'center', marginBottom: 8, letterSpacing: 0.5 }}>
              Daily Check-In
            </AppText>
            
            <AppText style={{ color: '#A1A1AA', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 }}>
              Klaim <AppText weight="bold" style={{ color: '#CCFF00' }}>Hari ke-{checkInStreak + 1}</AppText> untuk membuka <AppText weight="bold" style={{ color: '#FFF' }}>15x Scan AI</AppText> harian dan lanjutkan perjalanan menuju bonus Premium!
            </AppText>

            {/* Visual 7-Day Journey Preview */}
            <View style={{ width: '100%', backgroundColor: '#111115', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#222', marginBottom: 24 }}>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const targetDay = checkInStreak + 1;
                  const isPast = day < targetDay;
                  const isCurrent = day === targetDay;
                  
                  const isGift = day === 3 || day === 7;

                  return (
                    <View key={day} style={{ alignItems: 'center' }}>
                      <View style={{
                        width: 34, height: 34, borderRadius: 17,
                        backgroundColor: isPast ? '#CCFF00' : (isCurrent ? 'rgba(204,255,0,0.15)' : 'rgba(255,255,255,0.05)'),
                        borderWidth: isCurrent ? 2 : 1,
                        borderColor: isPast ? '#CCFF00' : (isCurrent ? '#CCFF00' : '#333'),
                        justifyContent: 'center', alignItems: 'center',
                        shadowColor: isCurrent ? '#CCFF00' : 'transparent',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: isCurrent ? 0.5 : 0,
                        shadowRadius: 8,
                        elevation: isCurrent ? 4 : 0
                      }}>
                        {isPast ? (
                          <Check color="#000" size={16} />
                        ) : isGift ? (
                          <Award color={isCurrent ? '#CCFF00' : '#888'} size={16} />
                        ) : (
                          <AppText weight="bold" style={{ fontSize: 13, color: isCurrent ? '#CCFF00' : '#888' }}>{day}</AppText>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Connecting Line Background (Fake Line) */}
              <View style={{ position: 'absolute', top: 36, left: 35, right: 35, height: 2, backgroundColor: '#333', zIndex: -1 }} />

              <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#222' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Award color="#FF007F" size={14} />
                  <AppText style={{ color: '#A1A1AA', fontSize: 12 }}>Hari 3: <AppText weight="bold" style={{ color: '#FF007F' }}>Pro Trial 15 Hari</AppText></AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Crown color="#CCFF00" size={14} />
                  <AppText style={{ color: '#A1A1AA', fontSize: 12 }}>Hari 7: <AppText weight="bold" style={{ color: '#CCFF00' }}>Pro Trial 30 Hari</AppText></AppText>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowCheckInPrompt(false);
                handleDailyCheckIn();
              }}
              style={{
                backgroundColor: '#CCFF00',
                width: '100%',
                paddingVertical: 14,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#CCFF00',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4
              }}
            >
              <AppText weight="bold" style={{ color: '#000', fontSize: 15 }}>Klaim Sekarang</AppText>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowCheckInPrompt(false)} style={{ marginTop: 14 }}>
              <AppText style={{ color: '#666', fontSize: 13 }}>Nanti Saja</AppText>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      <DummyAdBanner />
    </View>
  );
}
