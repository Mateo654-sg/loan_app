import { StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/hooks/use-palette';
import { Radius, Spacing } from '@/constants/tokens';
import type { Palette } from '@/theme/palette';

interface StatusCardProps {
  label: string;
  value: string;
  tone: 'neutral' | 'success' | 'danger';
}

/**
 * Simple labeled status card. Presentation only: it never computes
 * financial values (UI_UX.md §68 — financial clarity).
 */
export function StatusCard({ label, value, tone }: StatusCardProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, toneStyles(c)[tone]]}>{value}</Text>
    </View>
  );
}

const toneStyles = (c: Palette) =>
  ({
    neutral: {},
    success: { color: c.success },
    danger: { color: c.danger },
  }) as const;

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      width: '100%',
      paddingVertical: Spacing.md,
      paddingHorizontal: 20,
      borderRadius: Radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      gap: 4,
    },
    label: {
      fontSize: 14,
      color: c.text,
      opacity: c.mutedOpacity,
    },
    value: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
    },
  });
