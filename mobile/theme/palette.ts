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
  onHeroSuccess: string;
  onHeroDanger: string;

  // Gradientes & Visuales
  primaryGradient: [string, string];
  accentGradient: [string, string];
  heroGradient: [string, string, string];
  cardBorder: string;
  glassBg: string;
  chipBg: string;
}

export const lightPalette: Palette = {
  // Fondos — off-white con tinte índigo muy sutil
  background: '#F6F6FE',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Bordes — sutiles
  border: '#E2E2F0',
  borderSubtle: '#EEF0FA',
  cardBorder: 'rgba(226, 226, 240, 0.8)',

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
  success: '#10B981',
  successSoft: '#ECFDF5',
  onSuccess: '#FFFFFF',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  onDanger: '#FFFFFF',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  onHeroSuccess: '#A7F3D0',
  onHeroDanger: '#FECACA',

  // Gradientes & Visuales
  primaryGradient: ['#4F46E5', '#6366F1'],
  accentGradient: ['#7C3AED', '#9333EA'],
  heroGradient: ['#3730A3', '#4F46E5', '#7C3AED'],
  glassBg: 'rgba(255, 255, 255, 0.75)',
  chipBg: '#F1F3FB',
};

export const darkPalette: Palette = {
  // Fondos — azul-negro profundo
  background: '#0B0B16',
  surface: '#151528',
  surfaceElevated: '#1D1D36',

  // Bordes
  border: '#292947',
  borderSubtle: '#1F1F38',
  cardBorder: 'rgba(41, 41, 71, 0.8)',

  // Textos
  text: '#F3F4F6',
  textMuted: '#9CA3AF',
  textSubtle: '#6B7280',
  mutedOpacity: 0.55,

  // Primario — índigo claro sobre oscuro
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primarySoft: '#1E1B4B',
  primarySofter: '#191730',
  onPrimary: '#FFFFFF',

  // Acento — violeta claro
  accent: '#8B5CF6',
  accentSoft: '#2E1065',

  // Semánticos
  success: '#34D399',
  successSoft: '#064E3B',
  onSuccess: '#0E0E1C',
  danger: '#F87171',
  dangerSoft: '#450A0A',
  onDanger: '#0E0E1C',
  warning: '#FBBF24',
  warningSoft: '#451A03',
  onHeroSuccess: '#86EFAC',
  onHeroDanger: '#FCA5A5',

  // Gradientes & Visuales
  primaryGradient: ['#6366F1', '#818CF8'],
  accentGradient: ['#8B5CF6', '#A78BFA'],
  heroGradient: ['#1E1B4B', '#312E81', '#4C1D95'],
  glassBg: 'rgba(21, 21, 40, 0.75)',
  chipBg: '#1E1E36',
};
