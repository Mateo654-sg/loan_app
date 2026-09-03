import { StyleSheet, Text, View } from 'react-native';
import { FontWeight, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

export type BadgeTone = 'primary' | 'success' | 'danger' | 'warning' | 'neutral' | 'gold' | 'premium' | 'info';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ label, tone = 'neutral', showDot = true, size = 'md' }: BadgeProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  const cfg: Record<BadgeTone, { bg: string; dot: string; text: string }> = {
    primary: { bg: c.primarySoft, dot: c.primary, text: c.primary },
    success: { bg: c.successSoft, dot: c.success, text: c.success },
    danger: { bg: c.dangerSoft, dot: c.danger, text: c.danger },
    warning: { bg: c.warningSoft, dot: c.warning, text: c.warning },
    neutral: { bg: c.chipBg, dot: c.textMuted, text: c.textMuted },
    gold: { bg: c.goldSoft, dot: c.gold, text: c.gold },
    premium: { bg: c.goldSoft, dot: c.gold, text: c.gold },
    info: { bg: c.infoSoft, dot: c.info, text: c.info },
  };

  const t = cfg[tone];
  const sizeStyle = size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }, sizeStyle]} accessibilityRole="text" accessibilityLabel={label}>
      {showDot ? <View style={[styles.dot, { backgroundColor: t.dot }]} /> : null}
      <Text style={[styles.text, { color: t.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      borderRadius: 999,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    text: {
      fontSize: Typography.xs,
      fontWeight: FontWeight.bold as any,
      letterSpacing: 0.35,
    },
    sizeSm: { paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
    sizeMd: { paddingHorizontal: 10, paddingVertical: 5, gap: 5 },
    sizeLg: { paddingHorizontal: 14, paddingVertical: 7, gap: 6 },
  });
