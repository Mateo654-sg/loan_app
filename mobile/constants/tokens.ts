/**
 * Design tokens Premium v4 — PocketPal
 * Sistema unificado para una UX impecable, consistente y fluida.
 */
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  huge: 80,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  card: 20,
  cardLg: 28,
  input: 14,
  button: 14,
  badge: 999,
  fab: 999,
  avatar: 22,
  avatarLg: 28,
  pill: 999,
} as const;

export const Typography = {
  xxs: 10,
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
  hero: 40,
  display: 48,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const LetterSpacing = {
  tighter: -1.2,
  tight: -0.6,
  normal: 0,
  wide: 0.3,
  wider: 0.8,
  caps: 1.4,
  ultra: 2.8,
} as const;

export const LineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.45,
  relaxed: 1.6,
  loose: 1.8,
} as const;

export const Shadow = {
  xs: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
  },
  xl: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 36,
    elevation: 12,
  },
  gold: {
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 22,
    elevation: 8,
  },
  colored: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 0,
  },
} as const;

export const Animation = {
  instant: 60,
  fast: 120,
  normal: 220,
  slow: 340,
  slower: 480,
  spring: { damping: 18, stiffness: 180 },
  springSoft: { damping: 22, stiffness: 140 },
  springBouncy: { damping: 14, stiffness: 170 },
  springGentle: { damping: 26, stiffness: 120 },
} as const;

export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  modalOverlay: 299,
  toast: 400,
  tooltip: 500,
} as const;

export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const HitSlop = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

export const IconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  hero: 36,
} as const;

/** Backward compat */
export const Colors = {
  border: '#E0DFFF',
  textSecondaryOpacity: 0.58,
  success: '#0D9668',
  danger: '#DC2626',
  primary: '#3B2FBC',
  primarySoft: '#EEEFFF',
  successSoft: '#ECFDF5',
  dangerSoft: '#FEF2F2',
  onPrimary: '#FFFFFF',
  text: '#0C0C1A',
} as const;
