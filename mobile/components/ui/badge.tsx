import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { FontWeight, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

export type BadgeTone =
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'neutral'
  | 'gold'
  | 'premium';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ label, tone = 'neutral', showDot = true, size = 'md' }: BadgeProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  const dotColor =
    tone === 'primary'
      ? c.primary
      : tone === 'success'
      ? c.success
      : tone === 'danger'
      ? c.danger
      : tone === 'warning'
      ? c.warning
      : tone === 'gold'
      ? c.gold
      : tone === 'premium'
      ? c.goldLight
      : c.textMuted;

  const textColor =
    tone === 'primary'
      ? c.primary
      : tone === 'success'
      ? c.success
      : tone === 'danger'
      ? c.danger
      : tone === 'warning'
      ? c.warning
      : tone === 'gold'
      ? c.gold
      : tone === 'premium'
      ? c.goldLight
      : c.textMuted;

  const bgStyle =
    tone === 'primary'
      ? styles.bgPrimary
      : tone === 'success'
      ? styles.bgSuccess
      : tone === 'danger'
      ? styles.bgDanger
      : tone === 'warning'
      ? styles.bgWarning
      : tone === 'gold'
      ? styles.bgGold
      : tone === 'premium'
      ? styles.bgPremium
      : styles.bgNeutral;

  const dotStyle =
    tone === 'primary'
      ? styles.dotPrimary
      : tone === 'success'
      ? styles.dotSuccess
      : tone === 'danger'
      ? styles.dotDanger
      : tone === 'warning'
      ? styles.dotWarning
      : tone === 'gold'
      ? styles.dotGold
      : tone === 'premium'
      ? styles.dotPremium
      : styles.dotNeutral;

  const textStyle =
    tone === 'primary'
      ? styles.textPrimary
      : tone === 'success'
      ? styles.textSuccess
      : tone === 'danger'
      ? styles.textDanger
      : tone === 'warning'
      ? styles.textWarning
      : tone === 'gold'
      ? styles.textGold
      : tone === 'premium'
      ? styles.textPremium
      : styles.textNeutral;

  const sizeStyle =
    size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  return (
    <View style={[styles.container, bgStyle, sizeStyle]}>
      {showDot ? <View style={[styles.dot, dotStyle]} /> : null}
      <Text style={[styles.text, textStyle, sizeStyle]}>{label}</Text>
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
    // Tamaños
    sizeSm: { paddingHorizontal: 8, paddingVertical: 2, gap: 4 },
    sizeMd: { paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
    sizeLg: { paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
    // Fondos premium
    bgPrimary: { backgroundColor: c.primarySoft },
    bgSuccess: { backgroundColor: c.successSoft },
    bgDanger: { backgroundColor: c.dangerSoft },
    bgWarning: { backgroundColor: c.warningSoft },
    bgNeutral: { backgroundColor: c.chipBg },
    bgGold: { backgroundColor: c.goldSoft },
    bgPremium: { backgroundColor: c.goldSoft, borderWidth: 1, borderColor: c.gold + '40' },
    // Puntos
    dotPrimary: { backgroundColor: c.primary },
    dotSuccess: { backgroundColor: c.success },
    dotDanger: { backgroundColor: c.danger },
    dotWarning: { backgroundColor: c.warning },
    dotNeutral: { backgroundColor: c.textMuted },
    dotGold: { backgroundColor: c.gold },
    dotPremium: { backgroundColor: c.goldLight },
    // Textos
    textPrimary: { color: c.primary },
    textSuccess: { color: c.success },
    textDanger: { color: c.danger },
    textWarning: { color: c.warning },
    textNeutral: { color: c.textMuted },
    textGold: { color: c.gold },
    textPremium: { color: c.goldLight, fontWeight: FontWeight.black },
  });