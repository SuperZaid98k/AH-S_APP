export const COLORS = {
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
