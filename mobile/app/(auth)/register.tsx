import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { FormInput } from '@/components/form-input';
import { Button } from '@/components/ui/button';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas';
import { ApiError } from '@/services/api/client';
import { registerUser } from '@/services/auth/auth-service';

function AppLogo({ c }: { c: Palette }) {
  return (
    <View style={logoStyles.wrapper}>
      <LinearGradient
        colors={c.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[logoStyles.iconBox, Shadow.lg]}
      >
        <Text style={logoStyles.iconText}>₱</Text>
      </LinearGradient>
      <Text style={[logoStyles.appName, { color: c.text }]}>PocketPal</Text>
      <Text style={[logoStyles.tagline, { color: c.textMuted }]}>
        FINANZAS & PRÉSTAMOS
      </Text>
    </View>
  );
}

const logoStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 8 },
  iconBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 38, color: '#FFF', fontWeight: '800' },
  appName: {
    fontSize: Typography.xxl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: Typography.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 2.5,
    marginTop: 2,
  },
});

export default function RegisterScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerUser(values);
      router.replace('/');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_REGISTERED') {
        setServerError('Ya existe una cuenta con este correo. Intenta iniciar sesión.');
      } else {
        setServerError(
          error instanceof ApiError ? error.message : 'Error inesperado. Intenta de nuevo.'
        );
      }
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[{ paddingBottom: insets.bottom + Spacing.lg }, styles.container]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppLogo c={c} />

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Crear cuenta gratis</Text>
              <Text style={styles.cardSubtitle}>
                Comienza a gestionar tus finanzas y préstamos en minutos
              </Text>
            </View>

            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Nombre completo"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                  autoComplete="name"
                  placeholder="Juan Pérez"
                  leftIcon="person-outline"
                  error={errors.full_name?.message}
                />
              )}
            />

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
                  leftIcon="mail-outline"
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
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  leftIcon="lock-closed-outline"
                  error={errors.password?.message}
                />
              )}
            />

            {serverError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={c.danger} />
                <Text style={styles.errorBoxText}>{serverError}</Text>
              </View>
            ) : null}

            <Button
              label="Registrarme"
              onPress={() => void onSubmit()}
              loading={isSubmitting}
              iconName="person-add-outline"
              fullWidth
              size="lg"
            />
          </View>

          <Link href="/login" style={styles.link}>
            ¿Ya tienes cuenta? <Text style={{ color: c.primary, fontWeight: FontWeight.bold }}>Inicia sesión</Text>
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
    cardHeader: {
      gap: 4,
      marginBottom: Spacing.xs,
    },
    cardTitle: {
      fontSize: Typography.xl,
      fontWeight: FontWeight.extrabold,
      color: c.text,
      letterSpacing: -0.4,
    },
    cardSubtitle: {
      fontSize: Typography.sm,
      color: c.textMuted,
    },
    errorBox: {
      backgroundColor: c.dangerSoft,
      borderRadius: Radius.sm,
      padding: Spacing.sm + 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    errorBoxText: {
      fontSize: Typography.sm,
      color: c.danger,
      fontWeight: FontWeight.medium,
      flex: 1,
    },
    link: {
      textAlign: 'center',
      fontSize: Typography.sm,
      color: c.textMuted,
    },
  });
