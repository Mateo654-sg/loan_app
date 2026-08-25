import { StyleSheet, Text, View } from 'react-native';

import { FontWeight, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

export type BadgeTone = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

/**
 * Badge/etiqueta de estado con tono semántico.
 * Se adapta automáticamente al esquema de color del sistema.
 */
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  return (
    <View style={[styles.container, styles[`bg_${tone}`]]}>
      <Text style={[styles.text, styles[`text_${tone}`]]}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: 'flex-start',
    },
    text: {
      fontSize: Typography.xs,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.4,
    },
    // Fondos
    bg_primary: { backgroundColor: c.primarySoft },
    bg_success: { backgroundColor: c.successSoft },
    bg_danger: { backgroundColor: c.dangerSoft },
    bg_warning: { backgroundColor: c.warningSoft },
    bg_neutral: { backgroundColor: c.borderSubtle },
    // Textos
    text_primary: { color: c.primary },
    text_success: { color: c.success },
    text_danger: { color: c.danger },
    text_warning: { color: c.warning },
    text_neutral: { color: c.textMuted },
  });
