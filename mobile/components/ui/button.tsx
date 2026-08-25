import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftEmoji?: string;
}

/**
 * Botón reutilizable con variantes, tamaños y feedback táctil.
 * Usa la paleta del tema automáticamente.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftEmoji,
}: ButtonProps) {
  const c = usePalette();
  const styles = makeStyles(c);
  const isDisabled = disabled || loading;

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary': return styles.primary;
      case 'secondary': return styles.secondary;
      case 'ghost': return styles.ghost;
      case 'danger': return styles.danger;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary': return styles.textPrimary;
      case 'secondary': return styles.textSecondary;
      case 'ghost': return styles.textGhost;
      case 'danger': return styles.textDanger;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm': return styles.sizeSm;
      case 'md': return styles.sizeMd;
      case 'lg': return styles.sizeLg;
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case 'sm': return styles.textSm;
      case 'md': return styles.textMd;
      case 'lg': return styles.textLg;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        getVariantStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : c.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {leftEmoji ? (
            <Text style={[styles.emoji, getTextSizeStyle()]}>{leftEmoji}</Text>
          ) : null}
          <Text style={[styles.text, getTextStyle(), getTextSizeStyle()]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.button,
    },
    // Variantes
    primary: {
      backgroundColor: c.primary,
      ...Shadow.md,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: c.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: c.danger,
      ...Shadow.sm,
    },
    // Tamaños
    sizeSm: { minHeight: 36, paddingHorizontal: Spacing.md },
    sizeMd: { minHeight: 50, paddingHorizontal: Spacing.lg },
    sizeLg: { minHeight: 56, paddingHorizontal: Spacing.xl },
    fullWidth: { alignSelf: 'stretch' },
    disabled: { opacity: 0.45 },
    pressed: { opacity: 0.86 },
    // Textos
    text: { fontWeight: FontWeight.semibold, letterSpacing: 0.2 },
    textPrimary: { color: c.onPrimary },
    textSecondary: { color: c.primary },
    textGhost: { color: c.primary },
    textDanger: { color: '#FFFFFF' },
    textSm: { fontSize: Typography.sm },
    textMd: { fontSize: Typography.md },
    textLg: { fontSize: Typography.lg },
    // Layout interno
    content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    emoji: { fontSize: Typography.base },
  });
