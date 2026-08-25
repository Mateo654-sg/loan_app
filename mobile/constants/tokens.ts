/**
 * Design tokens — PocketPal v2.
 * Espaciado, radios, tipografía, pesos y sombras.
 * Los componentes nunca deben hardcodear constantes visuales.
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 56,
} as const;

export const Radius = {
  sm: 8,
  card: 16,
  cardLg: 20,
  input: 12,
  button: 12,
  badge: 999,
  fab: 999,
} as const;

export const Typography = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

/** Sombras — iOS usa shadow*, Android usa elevation */
export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },
  lg: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 12,
  },
} as const;

/** Backward compat con código que importa Colors directamente */
export const Colors = {
  border: '#E2E2F0',
  textSecondaryOpacity: 0.6,
  success: '#059669',
  danger: '#DC2626',
  primary: '#4F46E5',
  primarySoft: '#EEF2FF',
  successSoft: '#D1FAE5',
  dangerSoft: '#FEE2E2',
  onPrimary: '#FFFFFF',
  text: '#0F0F1A',
} as const;
