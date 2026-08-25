/**
 * Paleta dual light/dark — PocketPal Design System v2.
 * Paleta índigo-violeta con tokens semánticos completos.
 * Los componentes consumen la paleta via usePalette().
 */
export interface Palette {
  // Fondos
  background: string;
  surface: string;
  surfaceElevated: string;

  // Bordes
  border: string;
  borderSubtle: string;

  // Textos
  text: string;
  textMuted: string;
  textSubtle: string;
  mutedOpacity: number;

  // Primario (índigo)
  primary: string;
  primaryDark: string;
  primarySoft: string;
  primarySofter: string;
  onPrimary: string;

  // Acento (violeta)
  accent: string;
  accentSoft: string;

  // Semánticos
  success: string;
  successSoft: string;
  onSuccess: string;
  danger: string;
  dangerSoft: string;
  onDanger: string;
  warning: string;
  warningSoft: string;
}

export const lightPalette: Palette = {
  // Fondos — off-white con tinte índigo muy sutil
  background: '#F4F4FF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Bordes — sutiles
  border: '#E2E2F0',
  borderSubtle: '#EBEBF8',

  // Textos
  text: '#0F0F1A',
  textMuted: '#64648A',
  textSubtle: '#9999BB',
  mutedOpacity: 0.6,

  // Primario — índigo
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primarySoft: '#EEF2FF',
  primarySofter: '#F5F3FF',
  onPrimary: '#FFFFFF',

  // Acento — violeta
  accent: '#7C3AED',
  accentSoft: '#F3F0FF',

  // Semánticos
  success: '#059669',
  successSoft: '#D1FAE5',
  onSuccess: '#FFFFFF',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  onDanger: '#FFFFFF',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
};

export const darkPalette: Palette = {
  // Fondos — azul-negro profundo
  background: '#0E0E1C',
  surface: '#18182E',
  surfaceElevated: '#1E1E3A',

  // Bordes
  border: '#2C2C50',
  borderSubtle: '#232342',

  // Textos
  text: '#EEEEFF',
  textMuted: '#9898CC',
  textSubtle: '#5E5E8A',
  mutedOpacity: 0.55,

  // Primario — índigo claro sobre oscuro
  primary: '#818CF8',
  primaryDark: '#6366F1',
  primarySoft: '#1E1B4B',
  primarySofter: '#191730',
  onPrimary: '#0E0E1C',

  // Acento — violeta claro
  accent: '#A78BFA',
  accentSoft: '#1D1535',

  // Semánticos
  success: '#34D399',
  successSoft: '#064E3B',
  onSuccess: '#0E0E1C',
  danger: '#F87171',
  dangerSoft: '#450A0A',
  onDanger: '#0E0E1C',
  warning: '#FCD34D',
  warningSoft: '#451A03',
};
