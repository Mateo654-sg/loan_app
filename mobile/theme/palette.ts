/**
 * Paleta Premium v4 — PocketPal Design System
 * Obra maestra visual: índigo profundo + violeta + dorado cobre
 * Inspiración fintech premium: Revolut + Linear + Stripe Dashboard
 */
export interface Palette {
  // Fondos — capas con profundidad
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  surfaceHover: string;

  // Bordes — sutiles con brillo
  border: string;
  borderSubtle: string;
  borderGlass: string;
  borderStrong: string;

  // Textos — jerarquía impecable
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;
  textFaint: string;
  mutedOpacity: number;

  // Primario — Índigo profundo (marca)
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  primarySofter: string;
  primaryGhost: string;
  onPrimary: string;

  // Acento — Violeta eléctrico
  accent: string;
  accentLight: string;
  accentSoft: string;
  accentGhost: string;

  // Premium — Dorado / Cobre (highlights lujo)
  gold: string;
  goldLight: string;
  goldSoft: string;
  goldGhost: string;
  copper: string;
  copperSoft: string;

  // Semánticos
  success: string;
  successLight: string;
  successSoft: string;
  successGhost: string;
  onSuccess: string;
  danger: string;
  dangerLight: string;
  dangerSoft: string;
  dangerGhost: string;
  onDanger: string;
  warning: string;
  warningLight: string;
  warningSoft: string;
  warningGhost: string;
  info: string;
  infoSoft: string;

  // Gradientes & visuales premium
  primaryGradient: [string, string];
  primaryGradientDeep: [string, string, string, string];
  accentGradient: [string, string];
  goldGradient: [string, string];
  successGradient: [string, string];
  dangerGradient: [string, string];
  heroGradient: [string, string, string, string];
  heroGradientDark: [string, string, string, string];
  surfaceGradient: [string, string];
  shimmerGradient: [string, string, string];
  glassBg: string;
  glassBorder: string;
  chipBg: string;
  overlay: string;
}

export const lightPalette: Palette = {
  background: '#F6F5FF',
  backgroundSecondary: '#EDEBFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFF',
  surfaceGlass: 'rgba(255, 255, 255, 0.88)',
  surfaceHover: '#F0EFFF',

  border: '#E0DFFF',
  borderSubtle: '#EBE9F8',
  borderGlass: 'rgba(224, 223, 255, 0.65)',
  borderStrong: '#D1CDF5',

  text: '#0C0C1A',
  textMuted: '#6B6B8D',
  textSubtle: '#9AA0BE',
  textInverse: '#FFFFFF',
  textFaint: '#C2C2D6',
  mutedOpacity: 0.58,

  primary: '#3B2FBC',
  primaryDark: '#2D2399',
  primaryLight: '#5A4FE8',
  primarySoft: '#EEEFFF',
  primarySofter: '#F6F5FF',
  primaryGhost: 'rgba(59, 47, 188, 0.08)',
  onPrimary: '#FFFFFF',

  accent: '#7C3AED',
  accentLight: '#9333EA',
  accentSoft: '#F3F0FF',
  accentGhost: 'rgba(124, 58, 237, 0.08)',

  gold: '#C9A84C',
  goldLight: '#E8C85A',
  goldSoft: '#FEF8E7',
  goldGhost: 'rgba(201, 168, 76, 0.10)',
  copper: '#B87333',
  copperSoft: '#FDF3EB',

  success: '#0D9668',
  successLight: '#10B981',
  successSoft: '#ECFDF5',
  successGhost: 'rgba(13, 150, 104, 0.08)',
  onSuccess: '#FFFFFF',
  danger: '#DC2626',
  dangerLight: '#EF4444',
  dangerSoft: '#FEF2F2',
  dangerGhost: 'rgba(220, 38, 38, 0.08)',
  onDanger: '#FFFFFF',
  warning: '#D97706',
  warningLight: '#F59E0B',
  warningSoft: '#FFFBEB',
  warningGhost: 'rgba(217, 119, 6, 0.08)',
  info: '#2563EB',
  infoSoft: '#EFF6FF',

  primaryGradient: ['#3B2FBC', '#5A4FE8'],
  primaryGradientDeep: ['#1E1B4B', '#3B2FBC', '#5A4FE8', '#7C3AED'],
  accentGradient: ['#7C3AED', '#A855F7'],
  goldGradient: ['#C9A84C', '#F0D97A'],
  successGradient: ['#0D9668', '#10B981'],
  dangerGradient: ['#DC2626', '#F87171'],
  heroGradient: ['#1E1B4B', '#312E81', '#4C1D95', '#7C3AED'],
  heroGradientDark: ['#0C0C1A', '#1E1B4B', '#312E81', '#4C1D95'],
  surfaceGradient: ['#FFFFFF', '#F6F5FF'],
  shimmerGradient: ['#EBE9F8', '#F6F5FF', '#EBE9F8'],
  glassBg: 'rgba(255, 255, 255, 0.78)',
  glassBorder: 'rgba(224, 223, 255, 0.55)',
  chipBg: '#F0EFFF',
  overlay: 'rgba(12, 12, 26, 0.45)',
};

export const darkPalette: Palette = {
  background: '#070711',
  backgroundSecondary: '#0E0E1E',
  surface: '#12122A',
  surfaceElevated: '#1A1938',
  surfaceGlass: 'rgba(18, 18, 42, 0.88)',
  surfaceHover: '#1E1D42',

  border: '#2A2950',
  borderSubtle: '#1E1D3A',
  borderGlass: 'rgba(42, 41, 80, 0.55)',
  borderStrong: '#34336A',

  text: '#F5F5FF',
  textMuted: '#9CA3C7',
  textSubtle: '#6B728A',
  textInverse: '#0C0C1A',
  textFaint: '#3A3A5C',
  mutedOpacity: 0.52,

  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primarySoft: '#1E1B4B',
  primarySofter: '#151430',
  primaryGhost: 'rgba(99, 102, 241, 0.14)',
  onPrimary: '#FFFFFF',

  accent: '#A855F7',
  accentLight: '#C084FC',
  accentSoft: '#2E1065',
  accentGhost: 'rgba(168, 85, 247, 0.14)',

  gold: '#E8C85A',
  goldLight: '#FDE68A',
  goldSoft: '#3D350B',
  goldGhost: 'rgba(232, 200, 90, 0.12)',
  copper: '#D98A4A',
  copperSoft: '#3D2A14',

  success: '#10B981',
  successLight: '#34D399',
  successSoft: '#064E3B',
  successGhost: 'rgba(16, 185, 129, 0.14)',
  onSuccess: '#070711',
  danger: '#F87171',
  dangerLight: '#FCA5A5',
  dangerSoft: '#450A0A',
  dangerGhost: 'rgba(248, 113, 113, 0.14)',
  onDanger: '#070711',
  warning: '#FBBF24',
  warningLight: '#FCD34D',
  warningSoft: '#451A03',
  warningGhost: 'rgba(251, 191, 36, 0.14)',
  info: '#60A5FA',
  infoSoft: '#1E293B',

  primaryGradient: ['#4F46E5', '#6366F1'],
  primaryGradientDeep: ['#070711', '#1E1B4B', '#312E81', '#4F46E5'],
  accentGradient: ['#9333EA', '#A855F7'],
  goldGradient: ['#E8C85A', '#FDE68A'],
  successGradient: ['#059669', '#10B981'],
  dangerGradient: ['#DC2626', '#F87171'],
  heroGradient: ['#070711', '#1E1B4B', '#312E81', '#5B21B6'],
  heroGradientDark: ['#020208', '#0C0C1A', '#1E1B4B', '#2A1A5E'],
  surfaceGradient: ['#1A1938', '#12122A'],
  shimmerGradient: ['#1E1D3A', '#25244A', '#1E1D3A'],
  glassBg: 'rgba(18, 18, 42, 0.78)',
  glassBorder: 'rgba(42, 41, 80, 0.45)',
  chipBg: '#1E1D3A',
  overlay: 'rgba(0, 0, 0, 0.55)',
};
