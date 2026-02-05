/**
 * Project Prism - Theme Constants
 */

export const COLORS = {
  // Base colors
  background: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceElevated: '#252538',
  
  // Primary accent
  primary: '#a855f7',
  primaryDark: '#7c3aed',
  primaryLight: '#c084fc',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  textMuted: '#6b6b85',
  
  // Border and divider
  border: '#2a2a3e',
  divider: '#1f1f30',
  
  // Specific use cases
  mapMarker: '#a855f7',
  chatBubbleMine: '#7c3aed',
  chatBubbleTheirs: '#2a2a3e',
  tabBarActive: '#a855f7',
  tabBarInactive: '#6b6b85',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5,
  },
  small: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.4,
  },
  caption: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.3,
  },
} as const;

export const SHADOWS = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
} as const;

export const TRANSITIONS = {
  fast: '150ms ease-in-out',
  normal: '250ms ease-in-out',
  slow: '350ms ease-in-out',
} as const;
