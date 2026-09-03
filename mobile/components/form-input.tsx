import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Animation, FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export function FormInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  ...inputProps
}: FormInputProps) {
  const c = usePalette();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const styles = makeStyles(c);
  const isPassword = Boolean(secureTextEntry);
  const isSecure = isPassword && !showPassword;
  const borderWidth = useSharedValue(1.5);
  const animatedBorder = useAnimatedStyle(() => ({ borderWidth: borderWidth.value }));

  const borderColor = error ? c.danger : focused ? c.primary : c.border;
  const labelColor = error ? c.danger : focused ? c.primary : c.textMuted;
  const iconColor = error ? c.danger : focused ? c.primary : c.textMuted;

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.label, { color: labelColor }]}>{label}</Animated.Text>
      <Animated.View style={[styles.inputWrapper, animatedBorder, { borderColor, backgroundColor: c.surface }]}>
        {leftIcon ? <Ionicons name={leftIcon} size={19} color={iconColor} style={styles.leftIcon} /> : null}
        <TextInput
          style={styles.input}
          placeholderTextColor={c.textSubtle}
          accessible
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setFocused(true);
            borderWidth.value = withTiming(2, { duration: Animation.fast });
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            borderWidth.value = withTiming(1.5, { duration: Animation.normal });
            inputProps.onBlur?.(e);
          }}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.rightIconButton} hitSlop={8} accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={iconColor} />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} style={styles.rightIconButton} hitSlop={8} accessibilityRole="button">
            <Ionicons name={rightIcon} size={20} color={iconColor} />
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={14} color={c.danger} />
          <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { gap: Spacing.xs },
    label: {
      fontSize: Typography.sm,
      fontWeight: FontWeight.semibold as any,
      letterSpacing: 0.2,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Radius.input,
      minHeight: 54,
      paddingHorizontal: Spacing.md,
      ...Shadow.xs,
    },
    leftIcon: { marginRight: Spacing.sm },
    rightIconButton: { padding: 4, marginLeft: Spacing.xs },
    input: {
      flex: 1,
      fontSize: Typography.md,
      color: c.text,
      paddingVertical: 13,
      textAlignVertical: 'center' as any,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
    },
    error: {
      fontSize: Typography.sm,
      fontWeight: FontWeight.medium as any,
      flex: 1,
    },
    hint: {
      fontSize: Typography.sm,
      color: c.textMuted,
      marginTop: 1,
    },
  });
