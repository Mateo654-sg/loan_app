import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { FormInput } from '@/components/form-input';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { clientFormSchema, type ClientFormData } from '@/features/clients/schemas';
import { useCreateClient } from '@/features/clients/queries';
import { getErrorMessage } from '@/utils/errors-es';

export default function NewClientScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [serverError, setServerError] = useState<string | null>(null);
  const createClient = useCreateClient();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { full_name: '', phone: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await createClient.mutateAsync({
        full_name: values.full_name,
        phone: values.phone,
        document_number: null,
        alternative_phone: null,
        email: null,
        address: null,
      });
      router.back();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  const loading = isSubmitting || createClient.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Nuevo cliente</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroBox, { backgroundColor: c.primarySoft }]}>
          <LinearGradient colors={c.primaryGradient} style={styles.heroAvatar}>
            <Ionicons name="person" size={32} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: c.primary }]}>Información del cliente</Text>
          <Text style={[styles.heroSubtitle, { color: c.textMuted }]}>Nombre y teléfono son obligatorios</Text>
        </View>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
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
                placeholder="Ej: María González"
                leftIcon="person-outline"
                error={errors.full_name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Teléfono"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                autoComplete="tel"
                placeholder="Ej: 3001234567"
                leftIcon="call-outline"
                error={errors.phone?.message}
              />
            )}
          />
        </View>

        {serverError ? (
          <View style={[styles.errorBox, { backgroundColor: c.dangerSoft, borderColor: c.danger + '30' }]}>
            <Ionicons name="alert-circle" size={16} color={c.danger} />
            <Text style={[styles.errorText, { color: c.danger }]}>{serverError}</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.submitBtn, { opacity: pressed || loading ? 0.82 : 1 }]}
          onPress={() => void onSubmit()}
          disabled={loading}
        >
          <LinearGradient colors={c.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#FFF" />
                <Text style={styles.submitText}>Guardar cliente</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderSubtle },
    headerTitle: { fontSize: Typography.lg, fontWeight: FontWeight.black as any, color: c.text },
    container: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.md },
    heroBox: { borderRadius: Radius.cardLg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
    heroAvatar: { width: 72, height: 72, borderRadius: 999, alignItems: 'center', justifyContent: 'center', ...Shadow.lg },
    heroTitle: { fontSize: Typography.lg, fontWeight: FontWeight.black as any },
    heroSubtitle: { fontSize: Typography.sm },
    card: { borderRadius: Radius.card, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, ...Shadow.sm },
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1 },
    errorText: { fontSize: Typography.sm, fontWeight: FontWeight.medium as any, flex: 1 },
    submitBtn: { borderRadius: Radius.button, overflow: 'hidden', ...Shadow.lg },
    submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, minHeight: 54 },
    submitText: { color: '#FFF', fontSize: Typography.md, fontWeight: FontWeight.black as any },
  });
