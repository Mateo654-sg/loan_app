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

  // Animated border width
  const borderWidth = useSharedValue(1.5);
  const animatedBorderWidth = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
  }));

  // Animated label color
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    color: focused ? c.primary : error ? c.danger : c.textMuted,
  }));

  // Animated error opacity
  const errorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: error ? 1 : 0,
  }));

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.label,
          focused && styles.labelFocused,
          error && styles.labelError,
          labelAnimatedStyle,
        ]}
      >
        {label}
      </Animated.Text>
      <Animated.View style={[styles.inputWrapper, animatedBorderWidth]}>
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? c.danger : focused ? c.primary : c.textMuted}
            style={styles.leftIcon}
          />
        ) : null}
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
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.rightIconButton}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={focused ? c.primary : c.textMuted}
            />
          </Pressable>
        ) : rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            hitSlop={8}
          >
            <Ionicons name={rightIcon} size={20} color={focused ? c.primary : c.textMuted} />
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color={c.danger} />
          <Animated.Text style={[styles.error, errorAnimatedStyle]}>
            {error}
          </Animated.Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      gap: Spacing.xs,
    },
    label: {
      fontSize: Typography.base,
      fontWeight: FontWeight.semibold,
      color: c.textMuted,
      letterSpacing: 0.1,
    },
    labelFocused: {
      color: c.primary,
    },
    labelError: {
      color: c.danger,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: Radius.input,
      backgroundColor: c.surface,
      minHeight: 54,
      paddingHorizontal: Spacing.md,
      ...Shadow.xs,
    },
    leftIcon: {
      marginRight: Spacing.sm,
    },
    rightIconButton: {
      padding: 4,
      marginLeft: Spacing.xs,
    },
    input: {
      flex: 1,
      fontSize: Typography.md,
      color: c.text,
      paddingVertical: 14,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    error: {
      fontSize: Typography.sm,
      color: c.danger,
      fontWeight: FontWeight.medium,
    },
    hint: {
      fontSize: Typography.sm,
      color: c.textMuted,
    },
  });