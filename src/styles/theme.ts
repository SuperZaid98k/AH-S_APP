export const LIGHT_COLORS = {
  primary: '#1E293B',     // Deep Slate Navy
  primaryLight: '#334155',
  secondary: '#D97706',   // Warm Amber Gold
  secondaryLight: '#F59E0B',
  background: '#F8FAFC',  // Clean Off-White Slate
  cardBg: '#FFFFFF',
  text: '#0F172A',        // Dark Charcoal
  textMuted: '#64748B',   // Cool Grey
  border: '#E2E8F0',      // Soft Border
  success: '#059669',     // Emerald Green
  danger: '#E11D48',      // Rose Red
  warning: '#D97706',     // Amber
  info: '#2563EB',        // Royal Blue
  white: '#FFFFFF',
  black: '#000000',
  glass: 'rgba(255, 255, 255, 0.85)',
  shadowColor: 'rgba(15, 23, 42, 0.08)',
};

export const DARK_COLORS = {
  primary: '#FFFFFF',          // In dark mode we use white for primary headings
  primaryLight: '#CBD5E1',
  secondary: '#F59E0B',        // Warm Amber Gold (retains same identity)
  secondaryLight: '#FBBF24',
  background: '#111111',       // AMOLED Black
  cardBg: '#1A1A1A',           // Dark grey for cards
  text: '#F8FAFC',             // Off-white text
  textMuted: '#94A3B8',        // Cool grey text
  border: '#2A2E35',           // Subtle border
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
  glass: 'rgba(26, 26, 26, 0.85)',
  shadowColor: 'rgba(0, 0, 0, 0.4)',
};

// Fallback constant for static properties
export const COLORS = LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3.0,
    elevation: 3,
  },
  lg: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 6,
  },
  premium: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8.0,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  body: {
    fontSize: 14,
    color: COLORS.text,
  },
  bodyMuted: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: COLORS.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
};

export const getThemeColors = (isDarkMode: boolean) => {
  return isDarkMode ? DARK_COLORS : LIGHT_COLORS;
};

// Custom React Hook to subscribe to settings context and get active theme
import { useSettings } from '../context/SettingsContext';
export const useTheme = () => {
  const { isDarkMode } = useSettings();
  const colors = getThemeColors(isDarkMode);
  return { colors, isDarkMode };
};
