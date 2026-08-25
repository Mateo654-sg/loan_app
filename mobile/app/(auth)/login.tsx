import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormInput } from '@/components/form-input';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas';
import { ApiError } from '@/services/api/client';
import { loginUser } from '@/services/auth/auth-service';

function AppLogo({ c }: { c: Palette }) {
  return (
    <View style={logoStyles.wrapper}>
      <View style={[logoStyles.iconBox, { backgroundColor: c.primary, ...Shadow.lg }]}>
        <Text style={logoStyles.iconText}>₱</Text>
      </View>
      <Text style={[logoStyles.appName, { color: c.text }]}>PocketPal</Text>
      <Text style={[logoStyles.tagline, { color: c.textMuted }]}>
        GESTIÓN DE PRÉSTAMOS
      </Text>
    </View>
  );
}

const logoStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 10 },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 40, color: '#FFF', fontWeight: '800' },
  appName: {
    fontSize: Typography.xxl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: Typography.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 2,
    marginTop: 2,
  },
});

export default function LoginScreen() {
  const c = usePalette();
  const styles = makeStyles(c);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await loginUser(values);
      router.replace('/');
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Error inesperado. Intenta de nuevo.'
      );
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppLogo c={c} />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar sesión</Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Correo electrónico"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="tú@ejemplo.com"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Contraseña"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  autoComplete="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                />
              )}
            />

            {serverError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>⚠ {serverError}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                isSubmitting && styles.buttonDisabled,
                pressed && !isSubmitting && { opacity: 0.86 },
              ]}
              onPress={() => void onSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={c.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>Ingresar</Text>
              )}
            </Pressable>
          </View>

          <Link href="/register" style={styles.link}>
            ¿No tienes cuenta? Regístrate
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xl,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.cardLg,
      padding: Spacing.lg,
      gap: Spacing.md,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...Shadow.sm,
    },
    cardTitle: {
      fontSize: Typography.lg,
      fontWeight: FontWeight.bold,
      color: c.text,
      marginBottom: Spacing.xs,
    },
    errorBox: {
      backgroundColor: c.dangerSoft,
      borderRadius: Radius.sm,
      padding: Spacing.sm + 4,
    },
    errorBoxText: {
      fontSize: Typography.sm,
      color: c.danger,
      fontWeight: FontWeight.medium,
      textAlign: 'center',
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: Radius.button,
      paddingVertical: 15,
      alignItems: 'center',
      minHeight: 52,
      justifyContent: 'center',
      marginTop: Spacing.xs,
      ...Shadow.md,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: c.onPrimary,
      fontSize: Typography.md,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.3,
    },
    link: {
      textAlign: 'center',
      fontSize: Typography.sm,
      color: c.primary,
      fontWeight: FontWeight.semibold,
    },
  });
