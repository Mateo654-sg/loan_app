import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { AppLogo } from '@/components/app-logo';
import { FormInput } from '@/components/form-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FontWeight, Radius, Shadow, Spacing, Typography, LetterSpacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas';
import { loginUser } from '@/services/auth/auth-service';
import { getErrorMessage } from '@/utils/errors-es';

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
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <LinearGradient colors={[c.background, c.backgroundSecondary, c.surface]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      {/* Decorative orbs */}
      <View style={[styles.orb, styles.orbTop, { backgroundColor: c.primaryGhost }]} />
      <View style={[styles.orb, styles.orbBottom, { backgroundColor: c.accentGhost }]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoSection}>
            <AppLogo size="lg" variant="hero" />
            <View style={styles.trustRow}>
              <View style={[styles.trustDot, { backgroundColor: c.success }]} />
              <Text style={[styles.trustText, { color: c.textMuted }]}>Seguro  ·  Privado  ·  Sin comisiones</Text>
            </View>
          </View>

          <Card variant="elevated" padding={Spacing.lg} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Bienvenido de nuevo</Text>
              <Text style={styles.cardSubtitle}>Ingresa tus credenciales para continuar</Text>
            </View>

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
                  autoComplete="password"
                  placeholder="••••••••"
                  leftIcon="lock-closed-outline"
                  error={errors.password?.message}
                />
              )}
            />

            {serverError ? (
              <View style={[styles.errorBox, { backgroundColor: c.dangerSoft, borderColor: c.danger + '20' }]}>
                <View style={[styles.errorIconBox, { backgroundColor: c.danger }]}>
                  <Ionicons name="alert-circle" size={14} color="#FFF" />
                </View>
                <Text style={[styles.errorBoxText, { color: c.danger }]}>{serverError}</Text>
              </View>
            ) : null}

            <Button label="Iniciar sesión" onPress={() => void onSubmit()} loading={isSubmitting} iconName="log-in-outline" fullWidth size="lg" />

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
              <Text style={[styles.dividerText, { color: c.textSubtle }]}>o</Text>
              <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
            </View>

            <Link href="/register" asChild>
              <Text style={[styles.secondaryLink, { color: c.textMuted }]}>
                ¿No tienes cuenta? <Text style={{ color: c.primary, fontWeight: FontWeight.extrabold as any }}>Crea una gratis</Text>
              </Text>
            </Link>
          </Card>

          <Text style={[styles.footerLegal, { color: c.textSubtle }]}>Al continuar aceptas nuestros Términos y Política de Privacidad.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    orb: { position: 'absolute', borderRadius: 999, opacity: 0.55 },
    orbTop: { width: 280, height: 280, top: -80, right: -60 },
    orbBottom: { width: 320, height: 320, bottom: -40, left: -80 },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xl,
    },
    logoSection: { alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xs },
    trustRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    trustDot: { width: 7, height: 7, borderRadius: 999 },
    trustText: { fontSize: Typography.xs, fontWeight: FontWeight.semibold as any, letterSpacing: LetterSpacing.wide },
    card: { gap: Spacing.md, ...Shadow.lg },
    cardHeader: { gap: 5, marginBottom: Spacing.xs },
    cardTitle: {
      fontSize: Typography.xl,
      fontWeight: FontWeight.black as any,
      color: c.text,
      letterSpacing: LetterSpacing.tight,
    },
    cardSubtitle: { fontSize: Typography.sm, color: c.textMuted, lineHeight: 18 },
    errorBox: {
      borderRadius: Radius.md,
      padding: Spacing.sm + 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      borderWidth: 1,
    },
    errorIconBox: { width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    errorBoxText: { fontSize: Typography.sm, fontWeight: FontWeight.medium as any, flex: 1, lineHeight: 18 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
    dividerLine: { flex: 1, height: 1, opacity: 0.55 },
    dividerText: { fontSize: Typography.xs, fontWeight: FontWeight.semibold as any },
    secondaryLink: { textAlign: 'center', fontSize: Typography.sm },
    footerLegal: { textAlign: 'center', fontSize: Typography.xs, lineHeight: 16, paddingHorizontal: Spacing.lg },
  });
