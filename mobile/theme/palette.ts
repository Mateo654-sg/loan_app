/**
 * Paleta Premium v3 — PocketPal Design System.
 * Índigo-violado profundo con acentos dorado/cobre para sensación premium.
 * Glassmorphism, gradientes multi-parada, sombras en capas.
 */
export interface Palette {
  // Fondos
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;

  // Bordes
  border: string;
  borderSubtle: string;
  borderGlass: string;

  // Textos
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;
  mutedOpacity: number;

  // Primario — Índigo profundo
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  primarySofter: string;
  onPrimary: string;

  // Acento — Violeta eléctrico
  accent: string;
  accentLight: string;
  accentSoft: string;

  // Premium — Dorado/Cobre (para highlights premium)
  gold: string;
  goldLight: string;
  goldSoft: string;
  copper: string;
  copperSoft: string;

  // Semánticos
  success: string;
  successLight: string;
  successSoft: string;
  onSuccess: string;
  danger: string;
  dangerLight: string;
  dangerSoft: string;
  onDanger: string;
  warning: string;
  warningLight: string;
  warningSoft: string;

  // Gradientes & Visuales
  primaryGradient: [string, string];
  primaryGradientDeep: [string, string, string, string];
  accentGradient: [string, string];
  goldGradient: [string, string];
  successGradient: [string, string];
  heroGradient: [string, string, string, string];
  heroGradientDark: [string, string, string, string];
  surfaceGradient: [string, string];
  glassBg: string;
  glassBorder: string;
  chipBg: string;
}

export const lightPalette: Palette = {
  // Fondos — off-white con tinte índigo muy sutil, capa base
  background: '#F5F4FF',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFF',
  surfaceGlass: 'rgba(255, 255, 255, 0.85)',

  // Bordes — sutiles con brillo
  border: '#E0DFFF',
  borderSubtle: '#EBE9F8',
  borderGlass: 'rgba(224, 223, 255, 0.6)',

  // Textos
  text: '#0C0C1A',
  textMuted: '#6B6B8D',
  textSubtle: '#A0A0BE',
  textInverse: '#FFFFFF',
  mutedOpacity: 0.55,

  // Primario — Índigo profundo
  primary: '#3B2FBC',
  primaryDark: '#2D2399',
  primaryLight: '#5A4FE8',
  primarySoft: '#EEEFFF',
  primarySofter: '#F6F5FF',
  onPrimary: '#FFFFFF',

  // Acento — Violeta eléctrico
  accent: '#7C3AED',
  accentLight: '#9333EA',
  accentSoft: '#F3F0FF',

  // Premium — Dorado/Cobre
  gold: '#C9A84C',
  goldLight: '#E8C85A',
  goldSoft: '#FEF8E7',
  copper: '#B87333',
  copperSoft: '#FDF3EB',

  // Semánticos
  success: '#0D9668',
  successLight: '#10B981',
  successSoft: '#ECFDF5',
  onSuccess: '#FFFFFF',
  danger: '#DC2626',
  dangerLight: '#EF4444',
  dangerSoft: '#FEF2F2',
  onDanger: '#FFFFFF',
  warning: '#D97706',
  warningLight: '#F59E0B',
  warningSoft: '#FFFBEB',

  // Gradientes & Visuales
  primaryGradient: ['#3B2FBC', '#5A4FE8'],
  primaryGradientDeep: ['#1E1B4B', '#3B2FBC', '#5A4FE8', '#7C3AED'],
  accentGradient: ['#7C3AED', '#A855F7'],
  goldGradient: ['#C9A84C', '#F0D97A'],
  successGradient: ['#0D9668', '#10B981'],
  heroGradient: ['#1E1B4B', '#312E81', '#4C1D95', '#7C3AED'],
  heroGradientDark: ['#0C0C1A', '#1E1B4B', '#312E81', '#4C1D95'],
  surfaceGradient: ['#FFFFFF', '#F6F5FF'],
  glassBg: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(224, 223, 255, 0.5)',
  chipBg: '#F0EFFF',
};

export const darkPalette: Palette = {
  // Fondos — azul-negro profundo con capas
  background: '#080812',
  surface: '#111020',
  surfaceElevated: '#1A1930',
  surfaceGlass: 'rgba(17, 16, 32, 0.85)',

  // Bordes
  border: '#2A2945',
  borderSubtle: '#1F1E35',
  borderGlass: 'rgba(42, 41, 69, 0.6)',

  // Textos
  text: '#F5F5FA',
  textMuted: '#9CA3B8',
  textSubtle: '#6B728A',
  textInverse: '#0C0C1A',
  mutedOpacity: 0.5,

  // Primario — Índigo brillante sobre oscuro
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primarySoft: '#1E1B4B',
  primarySofter: '#151430',
  onPrimary: '#FFFFFF',

  // Acento — Violeta brillante
  accent: '#A855F7',
  accentLight: '#C084FC',
  accentSoft: '#2E1065',

  // Premium — Dorado/Cobre sobre oscuro
  gold: '#E8C85A',
  goldLight: '#FDE68A',
  goldSoft: '#3D350B',
  copper: '#D98A4A',
  copperSoft: '#3D2A14',

  // Semánticos
  success: '#10B981',
  successLight: '#34D399',
  successSoft: '#064E3B',
  onSuccess: '#080814',
  danger: '#F87171',
  dangerLight: '#FCA5A5',
  dangerSoft: '#450A0A',
  onDanger: '#080814',
  warning: '#FBBF24',
  warningLight: '#FCD34D',
  warningSoft: '#451A03',

  // Gradientes & Visuales
  primaryGradient: ['#4F46E5', '#6366F1'],
  primaryGradientDeep: ['#0C0C1A', '#1E1B4B', '#312E81', '#4F46E5'],
  accentGradient: ['#9333EA', '#A855F7'],
  goldGradient: ['#C9A84C', '#F0D97A'],
  successGradient: ['#0D9668', '#10B981'],
  heroGradient: ['#0C0C1A', '#1E1B4B', '#312E81', '#5B21B6'],
  heroGradientDark: ['#05050A', '#0C0C1A', '#1E1B4B', '#312E81'],
  surfaceGradient: ['#1A1930', '#111020'],
  glassBg: 'rgba(17, 16, 32, 0.75)',
  glassBorder: 'rgba(42, 41, 69, 0.4)',
  chipBg: '#1E1D3A',
};