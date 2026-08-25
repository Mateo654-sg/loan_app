import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView , useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormInput } from '@/components/form-input';
import { Radius, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { clientFormSchema, type ClientFormData } from '@/features/clients/schemas';
import { useCreateClient } from '@/features/clients/queries';
import { ApiError } from '@/services/api/client';

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
    defaultValues: {
      full_name: '',
      document_number: '',
      phone: '',
      alternative_phone: '',
      email: '',
      address: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await createClient.mutateAsync({
        full_name: values.full_name,
        document_number: values.document_number || null,
        phone: values.phone || null,
        alternative_phone: values.alternative_phone || null,
        email: values.email || null,
        address: values.address || null,
      });
      router.back();
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Unexpected error. Please try again.'
      );
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={[{ paddingBottom: insets.bottom + Spacing.lg }, styles.container]} keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="full_name"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Nombre completo *"
              value={value}
              onChangeText={onChange}
              autoCapitalize="words"
              error={errors.full_name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="document_number"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Documento"
              value={value ?? ''}
              onChangeText={onChange}
              keyboardType="numbers-and-punctuation"
              error={errors.document_number?.message}
            />
          )}
        />
        <View style={styles.row}>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Teléfono"
                value={value ?? ''}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.phone?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="alternative_phone"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Tel. alterno"
                value={value ?? ''}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.alternative_phone?.message}
              />
            )}
          />
        </View>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Correo"
              value={value ?? ''}
              onChangeText={onChange}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Dirección"
              value={value ?? ''}
              onChangeText={onChange}
              error={errors.address?.message}
            />
          )}
        />

        {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

        <Pressable
          style={[styles.submitButton, isSubmitting && styles.disabled]}
          onPress={() => void onSubmit()}
          disabled={isSubmitting || createClient.isPending}
        >
          {isSubmitting || createClient.isPending ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={styles.submitText}>Guardar cliente</Text>
          )}
        </Pressable>
        <Text style={styles.hint}>Solo el nombre es obligatorio.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.background },
  container: { padding: Spacing.md, gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  serverError: { color: c.danger, textAlign: 'center' },
  submitButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  submitText: { color: c.onPrimary, fontWeight: '600', fontSize: 16 },
  hint: { textAlign: 'center', fontSize: 12, opacity: c.mutedOpacity },
});;
