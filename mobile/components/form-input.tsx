import { StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native';

import { usePalette } from '@/hooks/use-palette';
import { Radius } from '@/constants/tokens';
import type { Palette } from '@/theme/palette';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Labelled text input with inline validation error (DESIGN_SYSTEM.md §31–33:
 * label required, error close to the affected input). Scheme-aware.
 */
export function FormInput({ label, error, hint, ...inputProps }: FormInputProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={c.textMuted}
        accessible
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      gap: 4,
    },
    label: {
      fontSize: 14,
      color: c.text,
      opacity: c.mutedOpacity,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: Radius.input,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      minHeight: 44,
      color: c.text,
      backgroundColor: c.surface,
    },
    inputError: {
      borderColor: c.danger,
    },
    error: {
      fontSize: 13,
      color: c.danger,
    },
    hint: {
      fontSize: 12,
      color: c.textMuted,
    },
  });
