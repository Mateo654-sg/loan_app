import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native';

import { FontWeight, Radius, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Input con label, estado de error, hint y focus highlight.
 * Esquema-aware — sigue el tema del sistema automáticamente.
 */
export function FormInput({ label, error, hint, ...inputProps }: FormInputProps) {
  const c = usePalette();
  const [focused, setFocused] = useState(false);
  const styles = makeStyles(c);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, focused && styles.labelFocused]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
        placeholderTextColor={c.textSubtle}
        accessible
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
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
      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorIcon}>⚠</Text>
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
    input: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: Radius.input,
      paddingHorizontal: Spacing.md,
      paddingVertical: 13,
      fontSize: Typography.md,
      minHeight: 50,
      color: c.text,
      backgroundColor: c.surface,
    },
    inputFocused: {
      borderColor: c.primary,
      backgroundColor: c.primarySofter,
    },
    inputError: {
      borderColor: c.danger,
      backgroundColor: c.dangerSoft,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    errorIcon: {
      fontSize: Typography.xs,
      color: c.danger,
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
