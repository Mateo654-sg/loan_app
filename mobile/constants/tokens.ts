/**
 * Design tokens Premium v3 — PocketPal.
 * Espaciado, radios, tipografía, pesos, sombras en capas, animaciones.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
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
} as const;

export const Typography = {
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
  tight: -0.5,
  normal: 0,
  wide: 0.3,
  wider: 0.8,
  caps: 1.2,
} as const;

export const LineHeight = {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6,
} as const;

/** Sombras en capas — iOS usa shadow*, Android usa elevation */
export const Shadow = {
  // Capa 1: Sutil - para cards base
  xs: {
    shadowColor: '#3B2FBC',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  // Capa 2: Cards estándar
  sm: {
    shadowColor: '#3B2FBC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  // Capa 3: Cards elevadas, botones primarios
  md: {
    shadowColor: '#3B2FBC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  // Capa 4: Modals, FAB, hero cards
  lg: {
    shadowColor: '#3B2FBC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  // Capa 5: Premium - hero, floating elements
  xl: {
    shadowColor: '#3B2FBC',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 12,
  },
  // Dorada - para elementos premium
  gold: {
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  // Colored - para botones de acento
  colored: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;

/** Duraciones de animación premium */
export const Animation = {
  instant: 50,
  fast: 120,
  normal: 200,
  slow: 300,
  slower: 450,
  spring: { damping: 18, stiffness: 180 },
  springSoft: { damping: 20, stiffness: 140 },
  springBouncy: { damping: 14, stiffness: 160 },
} as const;

/** Z-index layers */
export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  modalOverlay: 299,
  toast: 400,
  tooltip: 500,
} as const;

/** Breakpoints para responsive */
export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** Backward compat */
export const Colors = {
  border: '#E0DFFF',
  textSecondaryOpacity: 0.55,
  success: '#0D9668',
  danger: '#DC2626',
  primary: '#3B2FBC',
  primarySoft: '#EEEFFF',
  successSoft: '#ECFDF5',
  dangerSoft: '#FEF2F2',
  onPrimary: '#FFFFFF',
  text: '#0C0C1A',
} as const;