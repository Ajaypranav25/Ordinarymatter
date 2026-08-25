/**
 * OrdinaryMatter — Design System
 *
 * Dark theme with electric blue/violet accents, glassmorphism cards,
 * and smooth micro-animations.
 */

export const colors = {
  // Base
  background: '#0A0E1A',
  surface: '#121829',
  surfaceElevated: '#1A2138',
  surfaceGlass: 'rgba(26, 33, 56, 0.85)',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',

  // Text
  textPrimary: '#EAEDF4',
  textSecondary: '#8B93A7',
  textMuted: '#5A6378',

  // Accent gradient
  accentPrimary: '#4F6EF7',
  accentSecondary: '#8B5CF6',
  accentGradientStart: '#4F6EF7',
  accentGradientEnd: '#8B5CF6',

  // Status colors
  statusActive: '#22C55E',
  statusActiveGlow: 'rgba(34, 197, 94, 0.3)',
  statusWorking: '#3B82F6',
  statusWorkingGlow: 'rgba(59, 130, 246, 0.3)',
  statusWaiting: '#F59E0B',
  statusWaitingGlow: 'rgba(245, 158, 11, 0.3)',
  statusError: '#EF4444',
  statusErrorGlow: 'rgba(239, 68, 68, 0.3)',
  statusIdle: '#6B7280',
  statusIdleGlow: 'rgba(107, 114, 128, 0.2)',
  statusCompleted: '#22C55E',

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Tab bar
  tabBarBackground: '#0D1220',
  tabBarBorder: 'rgba(255, 255, 255, 0.06)',
  tabActive: '#4F6EF7',
  tabInactive: '#5A6378',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  // Using system fonts for now — Inter can be added via expo-google-fonts
  fontFamily: undefined, // System default (San Francisco on iOS, Roboto on Android)

  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  mono: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: colors.textPrimary,
  },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  }),
};

// Pre-built card style for glassmorphism panels
export const cardStyle = {
  backgroundColor: colors.surfaceGlass,
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.lg,
  ...shadows.card,
};

// Status config map
export const statusConfig: Record<string, { label: string; color: string; glowColor: string; icon: string }> = {
  idle: {
    label: 'Idle',
    color: colors.statusIdle,
    glowColor: colors.statusIdleGlow,
    icon: '⏸️',
  },
  working: {
    label: 'Working',
    color: colors.statusWorking,
    glowColor: colors.statusWorkingGlow,
    icon: '🔄',
  },
  waiting_input: {
    label: 'Needs Input',
    color: colors.statusWaiting,
    glowColor: colors.statusWaitingGlow,
    icon: '✋',
  },
  error: {
    label: 'Error',
    color: colors.statusError,
    glowColor: colors.statusErrorGlow,
    icon: '❌',
  },
  completed: {
    label: 'Completed',
    color: colors.statusCompleted,
    glowColor: colors.statusActiveGlow,
    icon: '✅',
  },
};
