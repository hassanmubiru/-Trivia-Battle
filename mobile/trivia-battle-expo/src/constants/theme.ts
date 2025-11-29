/**
 * Modern Design Theme
 * Professional, polished color scheme and typography standards
 */

export const Colors = {
  // Primary Colors
  primary: '#2E7D32', // Professional green
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',

  // Secondary Colors
  secondary: '#1976D2', // Professional blue
  secondaryLight: '#42A5F5',
  secondaryDark: '#1565C0',

  // Accent Colors
  accent: '#FF6F00', // Professional orange
  accentLight: '#FFB74D',
  accentDark: '#E65100',

  // Status Colors
  success: '#2E7D32',
  warning: '#FBC02D',
  error: '#D32F2F',
  info: '#1976D2',

  // Neutral Colors
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  onSurface: '#1F1F1F',
  onSurfaceVariant: '#49454E',
  outline: '#E0E0E0',
  outlineVariant: '#CAC4D0',

  // Dark Mode
  darkBackground: '#121212',
  darkSurface: '#1E1E1E',
  darkSurfaceVariant: '#2C2C2C',
  darkOnSurface: '#FFFFFF',
  darkOnSurfaceVariant: '#E0E0E0',
  darkOutline: '#383838',

  // Semantic
  text: {
    primary: '#1F1F1F',
    secondary: '#49454E',
    tertiary: '#7A7A7A',
    disabled: '#B8B8B8',
  },
  darkText: {
    primary: '#FFFFFF',
    secondary: '#E0E0E0',
    tertiary: '#A0A0A0',
    disabled: '#616161',
  },
};

export const Typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  none: {
    elevation: 0,
  },
  sm: {
    elevation: 2,
  },
  base: {
    elevation: 4,
  },
  md: {
    elevation: 8,
  },
  lg: {
    elevation: 12,
  },
  xl: {
    elevation: 16,
  },
};

export const Transitions = {
  fast: 100,
  base: 200,
  slow: 300,
  verySlow: 500,
};

export const ZIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Transitions,
  ZIndex,
};
