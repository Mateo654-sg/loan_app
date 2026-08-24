/**
 * Dual light/dark palettes (DESIGN_SYSTEM.md §66: dedicated semantic
 * tokens, never simple color inversion).
 *
 * Screens consume the palette through usePalette(); Spacing/Radius stay
 * scheme-independent in constants/tokens.ts.
 */
export interface Palette {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  mutedOpacity: number;

  primary: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
}

export const lightPalette: Palette = {
  background: '#ffffff',
  surface: '#ffffff',
  border: '#9e9e9e',
  text: '#1c1b1f',
  textMuted: '#757575',
  mutedOpacity: 0.7,

  primary: '#1a5fb4',
  primarySoft: '#e8f0fb',
  onPrimary: '#ffffff',
  success: '#2e7d32',
  successSoft: '#e6f4ea',
  danger: '#c62828',
  dangerSoft: '#fdecea',
  warning: '#b26a00',
};

export const darkPalette: Palette = {
  background: '#121212',
  surface: '#1e1e1e',
  border: '#5a5a5a',
  text: '#e6e1e5',
  textMuted: '#a8a09b',
  mutedOpacity: 0.65,

  primary: '#8ab4f8',
  primarySoft: '#26364d',
  onPrimary: '#0b2545',
  success: '#81c995',
  successSoft: '#1e3a27',
  danger: '#f28b82',
  dangerSoft: '#4a2422',
  warning: '#fdd663',
};
