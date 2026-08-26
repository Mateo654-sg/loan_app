import { Pressable, StyleSheet, View, ViewProps } from 'react-native';

import { Radius, Shadow, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

interface CardProps extends ViewProps {
  onPress?: () => void;
  variant?: 'flat' | 'elevated' | 'bordered';
  padding?: number;
}

/**
 * Componente Card contenedor estándar con soporte para elevación, bordes y presión.
 */
export function Card({
  children,
  onPress,
  variant = 'bordered',
  padding = Spacing.md,
  style,
  ...rest
}: CardProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'bordered':
        return styles.bordered;
      case 'flat':
        return styles.flat;
    }
  };

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.base,
          getVariantStyle(),
          { padding },
          pressed && styles.pressed,
          style,
        ]}
        onPress={onPress}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.base, getVariantStyle(), { padding }, style]} {...rest}>
      {children}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      borderRadius: Radius.card,
      backgroundColor: c.surface,
    },
    bordered: {
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...Shadow.sm,
    },
    elevated: {
      backgroundColor: c.surfaceElevated,
      ...Shadow.md,
    },
    flat: {
      backgroundColor: c.primarySofter,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
  });
