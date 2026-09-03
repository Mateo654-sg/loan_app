import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, type Palette } from '@/theme/palette';
import { useThemeStore } from '@/stores/theme-store';

export function usePalette(): Palette {
  const system = useColorScheme();
  const preference = useThemeStore((s) => s.preference);
  const effective = preference === 'system' ? system : preference;
  return effective === 'dark' ? darkPalette : lightPalette;
}

export type { Palette };
