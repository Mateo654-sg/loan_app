import { StyleSheet, Text, View } from 'react-native';

import { FontWeight, Radius, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

interface StatusCardProps {
  label: string;
  value: string;
  tone: 'neutral' | 'success' | 'danger';
}

/**
 * Tarjeta de estado con acento de color lateral.
 * Solo presentación — nunca calcula valores financieros.
 */
export function StatusCard({ label, value, tone }: StatusCardProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  const accentColor =
    tone === 'success' ? c.success : tone === 'danger' ? c.danger : c.primary;
  const softBg =
    tone === 'success' ? c.successSoft : tone === 'danger' ? c.dangerSoft : c.primarySoft;

  return (
    <View style={[styles.card, { backgroundColor: softBg }]}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      width: '100%',
      borderRadius: Radius.card,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    accent: {
      width: 4,
      borderRadius: 999,
      marginVertical: 2,
      marginLeft: 2,
    },
    body: {
      flex: 1,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: 4,
    },
    label: {
      fontSize: Typography.base,
      color: c.textMuted,
      fontWeight: FontWeight.medium,
    },
    value: {
      fontSize: Typography.lg,
      fontWeight: FontWeight.bold,
    },
  });
