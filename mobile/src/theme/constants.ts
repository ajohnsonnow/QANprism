/**
 * Project Prism - Theme Constants
 * 
 * MERGED & IMPROVED: Complete design system with:
 * - Color tokens for dark theme
 * - Spacing scale
 * - Typography
 * - Border radius
 * - Shadows
 * - Organization type colors
 */

export const COLORS = {
  // Primary brand colors
  primary: '#8A2BE2',           // Prism purple
  primaryLight: '#A855F7',
  primaryDark: '#6B21A8',
  primaryFaded: '#8A2BE220',
  
  // Background colors
  background: '#0a0a0a',        // Deep black
  surface: '#1a1a1a',           // Card background
  surfaceLight: '#2a2a2a',      // Elevated surface
  surfaceDark: '#0f0f0f',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',
  textInverse: '#000000',
  
  // Status colors
  success: '#4CAF50',
  successFaded: '#4CAF5020',
  warning: '#FFC107',
  warningFaded: '#FFC10720',
  danger: '#FF4444',
  dangerFaded: '#FF444420',
  info: '#2196F3',
  infoFaded: '#2196F320',
  
  // Semantic colors
  safe: '#FFD700',              // Gold for safe spaces
  verified: '#00BFFF',          // Blue for verified orgs
  community: '#FF69B4',         // Pink for community
  
  // Border colors
  border: '#222222',
  borderLight: '#333333',
  borderFocus: '#8A2BE2',
  
  // Special
  overlay: 'rgba(0,0,0,0.8)',
  overlayLight: 'rgba(0,0,0,0.5)',
  shimmer: '#2a2a2a',
  
  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#8A2BE2', '#6B21A8'],
  gradientRainbow: ['#FF6B6B', '#FFA500', '#FFD700', '#4CAF50', '#2196F3', '#8A2BE2'],
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const FONT_SIZES = {
  xxs: 10,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  title: 32,
  hero: 40,
};

export const FONT_WEIGHTS = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glowDanger: {
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Organization type colors for map markers
export const ORG_TYPE_COLORS: Record<string, string> = {
  nonprofit: '#8A2BE2',
  healthcare: '#FF6B6B',
  community: '#FF69B4',
  housing: '#4ECDC4',
  business_food: '#2E8B57',
  business_retail: '#2E8B57',
  business_service: '#2E8B57',
  legal: '#FFA500',
  education: '#2196F3',
  religious: '#9C27B0',
};

// Badge colors
export const BADGE_COLORS = {
  safe_space: {
    background: '#FFD70033',
    text: '#FFD700',
    border: '#FFD70066',
  },
  verified: {
    background: '#00BFFF33',
    text: '#00BFFF',
    border: '#00BFFF66',
  },
  pending: {
    background: '#88888833',
    text: '#888888',
    border: '#88888866',
  },
  unsafe: {
    background: '#FF444433',
    text: '#FF4444',
    border: '#FF444466',
  },
};

// Animation durations
export const DURATIONS = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

// Z-index layers
export const Z_INDEX = {
  base: 0,
  above: 1,
  dropdown: 10,
  sticky: 100,
  modal: 1000,
  toast: 1100,
  tooltip: 1200,
};

// Common hitSlop for touch targets (44pt minimum)
export const HIT_SLOP = {
  top: 10,
  right: 10,
  bottom: 10,
  left: 10,
};

// Safe area insets (defaults, actual values from SafeAreaContext)
export const SAFE_AREA_DEFAULTS = {
  top: 44,
  bottom: 34,
  left: 0,
  right: 0,
};
