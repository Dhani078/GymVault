import React from 'react';
import { Text } from 'react-native';
import { useTheme } from './contexts/ThemeContext';

// --- ACTIVE COLOR STATE FOR DYNAMIC GETTERS ---
export let activeColors = {
  background: '#000000',
  surface: '#111112',
  border: '#222225',
  primary: '#CCFF00',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  card: '#0A0A0C',
  inputBg: '#1C1C22',
};

export const updateActiveColors = (newColors) => {
  activeColors.background = newColors.background;
  activeColors.surface = newColors.surface;
  activeColors.border = newColors.border;
  activeColors.primary = newColors.primary;
  activeColors.text = newColors.text;
  activeColors.textMuted = newColors.textMuted;
  activeColors.card = newColors.card;
  activeColors.inputBg = newColors.inputBg;
};

// --- STITCH DESIGN TOKENS ---
export const theme = {
  get colors() {
    return activeColors;
  },
  typography: { bold: '700', medium: '500', regular: '400' },
};

// --- AppText Component ---
export const AppText = ({ style, weight = 'regular', tabular = false, numberOfLines, children }) => {
  const { colors } = useTheme();
  const fontFamily = 
    weight === 'bold' ? 'Inter_700Bold' : 
    weight === 'medium' ? 'Inter_500Medium' : 
    'Inter_400Regular';

  return (
    <Text 
      numberOfLines={numberOfLines} 
      style={[
        { 
          color: colors.text, 
          fontFamily, 
          fontVariant: tabular ? ['tabular-nums'] : [] 
        }, 
        style
      ]}
    >
      {children}
    </Text>
  );
};

// --- Dynamic Shared Styles ---
export const styles = {
  get screen() { return { flex: 1 }; },

  /* Logo */
  get logoBox() {
    return {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: activeColors.surface,
      borderWidth: 1,
      borderColor: 'rgba(204,255,0,0.25)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: activeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    };
  },

  /* Cards */
  get card() {
    return {
      backgroundColor: activeColors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: activeColors.border,
      padding: 20,
    };
  },

  /* Inputs */
  get inputWrapper() {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      backgroundColor: activeColors.surface,
      borderWidth: 1,
      borderColor: activeColors.border,
      borderRadius: 16,
      paddingHorizontal: 20,
    };
  },
  get textInput() {
    return { flex: 1, color: activeColors.text, fontSize: 16 };
  },

  /* Search */
  get searchBox() {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      backgroundColor: activeColors.surface,
      borderWidth: 1,
      borderColor: activeColors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      gap: 12,
    };
  },
  get searchInput() {
    return { flex: 1, color: activeColors.text, fontSize: 16 };
  },

  /* Buttons */
  get btnPrimary() {
    return {
      backgroundColor: activeColors.primary,
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: activeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    };
  },
  get btnPrimaryText() {
    return { color: '#000000', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 };
  },
  get btnSecondary() {
    return {
      backgroundColor: activeColors.surface,
      height: 56,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: activeColors.border,
      justifyContent: 'center',
      alignItems: 'center',
    };
  },
  get btnSecondaryText() {
    return { color: activeColors.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 };
  },
  get btnGhost() {
    return { height: 56, justifyContent: 'center', alignItems: 'center' };
  },

  /* Lists */
  get listItem() {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: activeColors.border,
    };
  },

  /* Icon Button */
  get iconButton() {
    return {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: activeColors.background,
      borderWidth: 1,
      borderColor: activeColors.border,
      justifyContent: 'center',
      alignItems: 'center',
    };
  },

  /* Avatar */
  get avatarLarge() {
    return {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: activeColors.surface,
      borderWidth: 1,
      borderColor: activeColors.border,
      justifyContent: 'center',
      alignItems: 'center',
    };
  },

  /* A-Z Tracker */
  get azTracker() {
    return { width: 24, justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: 16 };
  },
  get azText() {
    return { fontSize: 10, color: activeColors.textMuted };
  },

  /* Logger */
  get colHeader() {
    return { flex: 1, textAlign: 'center', fontSize: 12, color: activeColors.textMuted, letterSpacing: 1 };
  },
  get setRow() {
    return { flexDirection: 'row', alignItems: 'center', marginVertical: 4 };
  },
  get setCell() {
    return { flex: 1, justifyContent: 'center', alignItems: 'center' };
  },
  get stepperControl() {
    return {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: activeColors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: activeColors.border,
      marginHorizontal: 4,
      height: 40,
    };
  },
  get stepperBtn() {
    return { width: 32, height: '100%', justifyContent: 'center', alignItems: 'center' };
  },
  get checkbox() {
    return {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: activeColors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: activeColors.background,
    };
  },
  get checkboxActive() {
    return { backgroundColor: activeColors.primary, borderColor: activeColors.primary };
  },
  get addBtn() {
    return {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: activeColors.border,
    };
  },

  /* Tab Bar */
  get tabBar() {
    return {
      flexDirection: 'row',
      width: '100%',
      backgroundColor: activeColors.background,
      borderTopWidth: 1,
      borderTopColor: activeColors.border,
      paddingBottom: 20,
      paddingTop: 12,
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    };
  },
  get tabItem() {
    return { flex: 1, justifyContent: 'center', alignItems: 'center', minWidth: 0 };
  },
  get tabLabel() {
    return { fontSize: 11, marginTop: 4, fontWeight: '500' };
  },
};
