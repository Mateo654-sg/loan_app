import { StyleSheet, Text, View } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { FontWeight, Typography } from '@/constants/tokens';

interface MoneyDisplayProps {
  value: string | number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  tone?: 'neutral' | 'positive' | 'negative' | 'warning' | 'primary' | 'success' | 'danger' | 'inverse';
  showCurrency?: boolean;
  currency?: string;
  compact?: boolean;
  weight?: keyof typeof FontWeight;
  letterSpacing?: number;
  prefix?: string;
  suffix?: string;
}

const CURRENCY_SYMBOL = '$';

function formatCompact(value: string): string {
  const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return value;
}

type FontWeightValue = '400' | '500' | '600' | '700' | '800' | '900';

const weightMap: Record<string, FontWeightValue> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

const sizeMap = {
  sm: Typography.sm,
  md: Typography.base,
  lg: Typography.lg,
  xl: Typography.xl,
  hero: Typography.hero,
};

export function MoneyDisplay({
  value,
  size = 'md',
  tone = 'neutral',
  showCurrency = true,
  currency = 'COP',
  compact = false,
  weight,
  letterSpacing,
  prefix = '',
  suffix = '',
}: MoneyDisplayProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isNegative = numValue < 0;
  const displayValue = compact ? formatCompact(String(value)) : String(value);

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
      : c.text;

  const resolvedWeight = (weight ?? (size === 'hero' ? 'black' : 'extrabold')) as keyof typeof FontWeight;

  return (
    <View style={styles.container}>
      {showCurrency && (
        <Text
          style={[
            styles.currency,
            { fontSize: sizeMap[size] * 0.6, color: c.textMuted },
          ]}
        >
          {CURRENCY_SYMBOL}
        </Text>
      )}
      <Text
        style={[
          styles.value,
          {
            fontSize: sizeMap[size],
            color,
            fontWeight: weightMap[resolvedWeight],
            letterSpacing: letterSpacing ?? (size === 'hero' ? -1 : -0.3),
          },
        ]}
      >
        {prefix}
        {isNegative && !displayValue.startsWith('-') ? '−' : ''}
        {displayValue.replace('-', '')}
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
      gap: 2,
    },
    currency: {
      fontWeight: FontWeight.semibold,
      marginBottom: 2,
    },
    value: {
      fontFamily: undefined,
    },
  });
