import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type Palette } from '@/theme/palette';

/**
 * Scheme-aware palette hook. Components call this once per render and
 * pass the palette into their style factory so content follows the
 * system theme (DESIGN_SYSTEM.md §66).
 */
export function usePalette(): Palette {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkPalette : lightPalette;
}

export type { Palette };
