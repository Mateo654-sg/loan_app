import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
  iconName?: keyof typeof Ionicons.glyphMap;
}

/**
 * Botón reutilizable con gradientes, soporte de íconos vectoriales y feedback táctil.
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
  iconName,
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

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;
  const iconColor = (variant === 'primary' || variant === 'danger' ? c.onPrimary : c.primary);

  const renderInnerContent = () => (
    loading ? (
      <ActivityIndicator color={iconColor} size="small" />
    ) : (
      <View style={styles.content}>
        {iconName ? (
          <Ionicons name={iconName} size={iconSize} color={iconColor} />
        ) : leftEmoji ? (
          <Text style={[styles.emoji, getTextSizeStyle()]}>{leftEmoji}</Text>
        ) : null}
        <Text style={[styles.text, getTextStyle(), getTextSizeStyle()]}>{label}</Text>
      </View>
    )
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
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
      {variant === 'primary' && !isDisabled ? (
        <LinearGradient
          colors={c.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, getSizeStyle()]}
        >
          {renderInnerContent()}
        </LinearGradient>
      ) : (
        <View style={[styles.inner, getVariantStyle(), getSizeStyle()]}>
          {renderInnerContent()}
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      borderRadius: Radius.button,
      overflow: 'hidden',
    },
    inner: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.button,
      width: '100%',
    },
    gradient: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.button,
      width: '100%',
      ...Shadow.md,
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
    sizeSm: { minHeight: 38, paddingHorizontal: Spacing.md },
    sizeMd: { minHeight: 50, paddingHorizontal: Spacing.lg },
    sizeLg: { minHeight: 56, paddingHorizontal: Spacing.xl },
    fullWidth: { alignSelf: 'stretch' },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
    // Textos
    text: { fontWeight: FontWeight.semibold, letterSpacing: 0.2 },
    textPrimary: { color: c.onPrimary },
    textSecondary: { color: c.primary },
    textGhost: { color: c.primary },
    textDanger: { color: c.onDanger },
    textSm: { fontSize: Typography.sm },
    textMd: { fontSize: Typography.md },
    textLg: { fontSize: Typography.lg },
    // Layout interno
    content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2 },
    emoji: { fontSize: Typography.base },
  });
