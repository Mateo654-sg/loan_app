import { StyleSheet, Text, View } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { FontWeight, Typography } from '@/constants/tokens';
import { formatMoneyCop, formatCompactCop } from '@/utils/money';

interface MoneyDisplayProps {
  value: string | number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  tone?: 'neutral' | 'positive' | 'negative' | 'warning' | 'primary' | 'success' | 'danger' | 'inverse' | 'muted';
  showCurrency?: boolean;
  compact?: boolean;
  weight?: keyof typeof FontWeight;
  letterSpacing?: number;
  prefix?: string;
  suffix?: string;
  // Si true, el valor ya viene formateado (ej: formatMoneyCop) — no re-formatear
  alreadyFormatted?: boolean;
}

const sizeMap: Record<string, number> = {
  xs: Typography.sm,
  sm: Typography.base,
  md: Typography.md,
  lg: Typography.lg,
  xl: Typography.xl,
  hero: Typography.hero,
};

const weightMap: Record<string, string> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export function MoneyDisplay({
  value,
  size = 'md',
  tone = 'neutral',
  showCurrency = true,
  compact = false,
  weight,
  letterSpacing,
  prefix = '',
  suffix = '',
  alreadyFormatted = false,
}: MoneyDisplayProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  const rawStr = String(value);
  const isHidden = rawStr.includes('•');
  const isNegative = !isHidden && (rawStr.trim().startsWith('-') || (typeof value === 'number' && value < 0));

  let displayValue: string;
  if (isHidden) {
    displayValue = rawStr;
  } else if (alreadyFormatted) {
    displayValue = rawStr;
  } else if (compact) {
    displayValue = formatCompactCop(rawStr);
    // compact ya incluye símbolo, evitar duplicado
    showCurrency = false as any;
  } else {
    // Detectar si es número/money string y formatear con separadores
    const num = Number(rawStr.replace(/[^0-9.-]/g, ''));
    if (!Number.isNaN(num) && rawStr.trim() !== '' && /^[\d\s.,$+-]+$/.test(rawStr)) {
      displayValue = formatMoneyCop(String(Math.abs(num)));
      if (isNegative) displayValue = displayValue.replace('$', '$ −');
    } else {
      displayValue = rawStr;
    }
  }

  const resolvedTone = isNegative ? 'negative' : tone;
  const color =
    resolvedTone === 'positive' || resolvedTone === 'success'
      ? c.success
      : resolvedTone === 'negative' || resolvedTone === 'danger'
        ? c.danger
        : resolvedTone === 'warning'
          ? c.warning
          : resolvedTone === 'primary'
            ? c.primary
            : resolvedTone === 'inverse'
              ? c.textInverse
              : resolvedTone === 'muted'
                ? c.textMuted
                : c.text;

  const resolvedWeight = (weight ?? (size === 'hero' ? 'black' : size === 'xl' ? 'extrabold' : 'bold')) as keyof typeof FontWeight;
  const fontSize = sizeMap[size] ?? Typography.md;

  // Si showCurrency y no compact, el formatMoneyCop ya trae $ — no duplicar
  const needsCurrencyChip = showCurrency && !displayValue.includes('$') && !isHidden;
  const currencyOpacity = size === 'hero' ? 0.85 : 0.65;

  return (
    <View style={styles.container} accessible accessibilityLabel={`${prefix}${displayValue}${suffix}`}>
      {needsCurrencyChip ? (
        <Text style={[styles.currency, { fontSize: fontSize * 0.52, color: resolvedTone === 'inverse' ? 'rgba(255,255,255,0.9)' : c.textMuted, opacity: currencyOpacity }]}>
          $
        </Text>
      ) : null}
      <Text
        style={[
          styles.value,
          {
            fontSize,
            color: isHidden ? color : color,
            fontWeight: weightMap[resolvedWeight] as any,
            letterSpacing: letterSpacing ?? (size === 'hero' ? -1.2 : size === 'xl' ? -0.8 : -0.3),
            opacity: isHidden ? 0.55 : 1,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {prefix}
        {displayValue}
        {suffix}
      </Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
      flexShrink: 1,
    },
    currency: {
      fontWeight: FontWeight.semibold,
      marginBottom: 3,
    },
    value: {
      flexShrink: 1,
    },
  });
