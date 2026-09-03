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
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas';
import { registerUser } from '@/services/auth/auth-service';
import { getErrorMessage } from '@/utils/errors-es';

export default function RegisterScreen() {
  const c = usePalette();
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
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <LinearGradient colors={[c.background, c.backgroundSecondary, c.surface]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <View style={[styles.orb, styles.orbTop, { backgroundColor: c.primaryGhost }]} />
      <View style={[styles.orb, styles.orbBottom, { backgroundColor: c.goldGhost }]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoSection}>
            <AppLogo size="lg" variant="hero" />
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: c.successSoft, borderColor: c.success + '25' }]}>
                <Ionicons name="shield-checkmark" size={12} color={c.success} />
                <Text style={[styles.badgeText, { color: c.success }]}>Cifrado AES-256</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: c.primarySoft, borderColor: c.primary + '18' }]}>
                <Ionicons name="lock-closed" size={12} color={c.primary} />
                <Text style={[styles.badgeText, { color: c.primary }]}>100% privado</Text>
              </View>
            </View>
          </View>

          <Card variant="elevated" padding={Spacing.lg} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Crea tu cuenta gratis</Text>
              <Text style={styles.cardSubtitle}>Empieza a gestionar finanzas y préstamos en segundos</Text>
            </View>

            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, value } }) => (
                <FormInput label="Nombre completo" value={value} onChangeText={onChange} autoCapitalize="words" autoComplete="name" placeholder="Ej: María González" leftIcon="person-outline" error={errors.full_name?.message} />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <FormInput label="Correo electrónico" value={value} onChangeText={onChange} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="tú@ejemplo.com" leftIcon="mail-outline" error={errors.email?.message} />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <FormInput label="Contraseña" value={value} onChangeText={onChange} secureTextEntry autoComplete="new-password" placeholder="Mínimo 8 caracteres" leftIcon="lock-closed-outline" error={errors.password?.message} hint="Usa 8+ caracteres con letras y números" />
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

            <Button label="Crear cuenta" onPress={() => void onSubmit()} loading={isSubmitting} iconName="rocket-outline" fullWidth size="lg" />

            <Link href="/login" asChild>
              <Text style={[styles.secondaryLink, { color: c.textMuted }]}>
                ¿Ya tienes cuenta? <Text style={{ color: c.primary, fontWeight: FontWeight.extrabold as any }}>Inicia sesión</Text>
              </Text>
            </Link>
          </Card>

          <Text style={[styles.footerLegal, { color: c.textSubtle }]}>Al registrarte aceptas Términos y Privacidad. Tus datos nunca se comparten.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    orb: { position: 'absolute', borderRadius: 999, opacity: 0.52 },
    orbTop: { width: 280, height: 280, top: -70, right: -50 },
    orbBottom: { width: 340, height: 340, bottom: -50, left: -80 },
    container: { flexGrow: 1, justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
    logoSection: { alignItems: 'center', gap: Spacing.md },
    badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 2 },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
    },
    badgeText: { fontSize: Typography.xs, fontWeight: FontWeight.bold as any, letterSpacing: 0.2 },
    card: { gap: Spacing.md, ...Shadow.lg },
    cardHeader: { gap: 5, marginBottom: Spacing.xs },
    cardTitle: { fontSize: Typography.xl, fontWeight: FontWeight.black as any, color: c.text, letterSpacing: LetterSpacing.tight },
    cardSubtitle: { fontSize: Typography.sm, color: c.textMuted, lineHeight: 18 },
    errorBox: { borderRadius: Radius.md, padding: Spacing.sm + 4, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1 },
    errorIconBox: { width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    errorBoxText: { fontSize: Typography.sm, fontWeight: FontWeight.medium as any, flex: 1, lineHeight: 18 },
    secondaryLink: { textAlign: 'center', fontSize: Typography.sm, marginTop: 2 },
    footerLegal: { textAlign: 'center', fontSize: Typography.xs, lineHeight: 16, paddingHorizontal: Spacing.lg },
  });
