import { StyleSheet, Text, View } from 'react-native';

import { FontWeight, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

export type BadgeTone = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  showDot?: boolean;
}

/**
 * Badge/etiqueta de estado estilizada con punto indicador semántico.
 */
export function Badge({ label, tone = 'neutral', showDot = true }: BadgeProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  return (
    <View style={[styles.container, styles[`bg_${tone}`]]}>
      {showDot ? <View style={[styles.dot, styles[`dot_${tone}`]]} /> : null}
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    text: {
      fontSize: Typography.xs,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.3,
    },
    // Fondos
    bg_primary: { backgroundColor: c.primarySoft },
    bg_success: { backgroundColor: c.successSoft },
    bg_danger: { backgroundColor: c.dangerSoft },
    bg_warning: { backgroundColor: c.warningSoft },
    bg_neutral: { backgroundColor: c.borderSubtle },
    // Puntos
    dot_primary: { backgroundColor: c.primary },
    dot_success: { backgroundColor: c.success },
    dot_danger: { backgroundColor: c.danger },
    dot_warning: { backgroundColor: c.warning },
    dot_neutral: { backgroundColor: c.textMuted },
    // Textos
    text_primary: { color: c.primary },
    text_success: { color: c.success },
    text_danger: { color: c.danger },
    text_warning: { color: c.warning },
    text_neutral: { color: c.textMuted },
  });
