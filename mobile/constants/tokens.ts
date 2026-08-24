/**
 * Minimal design tokens for Phase 1 (DESIGN_SYSTEM.md §7, §8, §12).
 * The complete light/dark token set is defined in Phase 10; these values
 * exist so components never hardcode visual constants directly.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
} as const;

export const Radius = {
  card: 12,
  input: 8,
  button: 8,
} as const;

export const Colors = {
  border: '#9e9e9e',
  textSecondaryOpacity: 0.7,
  success: '#2e7d32',
  danger: '#c62828',
  primary: '#1a5fb4',
  primarySoft: '#e8f0fb',
  successSoft: '#e6f4ea',
  dangerSoft: '#fdecea',
  onPrimary: '#ffffff',
  text: '#1c1b1f',
} as const;
