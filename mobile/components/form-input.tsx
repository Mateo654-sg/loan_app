import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FontWeight, Radius, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Input estilizado con label, estado de error, hint, íconos y alternancia de contraseña.
 */
export function FormInput({
  label,
  error,
  hint,
  leftIcon,
  secureTextEntry,
  ...inputProps
}: FormInputProps) {
  const c = usePalette();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const styles = makeStyles(c);

  const isPassword = Boolean(secureTextEntry);
  const isSecure = isPassword && !showPassword;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, focused && styles.labelFocused]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
        ]}
      >
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
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
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
              color={c.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={15} color={c.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
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
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: Radius.input,
      backgroundColor: c.surface,
      minHeight: 52,
      paddingHorizontal: Spacing.md,
    },
    inputWrapperFocused: {
      borderColor: c.primary,
      backgroundColor: c.primarySofter,
    },
    inputWrapperError: {
      borderColor: c.danger,
      backgroundColor: c.dangerSoft,
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
      paddingVertical: 12,
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
