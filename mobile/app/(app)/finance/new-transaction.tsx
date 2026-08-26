import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { FormInput } from '@/components/form-input';
import { Button } from '@/components/ui/button';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import {
  transactionFormSchema,
  type TransactionFormData,
} from '@/features/finance/schemas';
import { useCategories, useCreateTransaction } from '@/features/finance/queries';
import { ApiError } from '@/services/api/client';
import { formatMoneyCop, todayIsoDate } from '@/utils/money';

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CARD', 'OTHER'] as const;
const METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
};

export default function NewTransactionScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [serverError, setServerError] = useState<string | null>(null);
  const createTransaction = useCreateTransaction();
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const categories = useCategories({ type: selectedType, is_active: true });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'EXPENSE',
      amount: '',
      category_id: '',
      transaction_date: todayIsoDate(),
      payment_method: null,
      description: undefined,
    },
  });

  const selectedCategoryId = watch('category_id');

  const switchType = (type: 'INCOME' | 'EXPENSE') => {
    setSelectedType(type);
    setValue('type', type);
    setValue('category_id', '');
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await createTransaction.mutateAsync({
        type: values.type,
        amount: values.amount,
        category_id: values.category_id,
        transaction_date: values.transaction_date,
        description: values.description || null,
        payment_method: values.payment_method ?? null,
        notes: null,
      });
      router.back();
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Error inesperado. Intenta de nuevo.'
      );
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen options={{ title: selectedType === 'INCOME' ? 'Nuevo ingreso' : 'Nuevo gasto' }} />
      <ScrollView
        contentContainerStyle={[{ paddingBottom: insets.bottom + Spacing.lg }, styles.container]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Selector de Tipo (Ingreso / Gasto) */}
        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeButton, selectedType === 'INCOME' && styles.typeIncome]}
            onPress={() => switchType('INCOME')}
          >
            <Ionicons
              name="arrow-up-circle"
              size={20}
              color={selectedType === 'INCOME' ? c.success : c.textMuted}
            />
            <Text
              style={[
                styles.typeText,
                selectedType === 'INCOME' && { color: c.success, fontWeight: FontWeight.bold },
              ]}
            >
              Ingreso
            </Text>
          </Pressable>

          <Pressable
            style={[styles.typeButton, selectedType === 'EXPENSE' && styles.typeExpense]}
            onPress={() => switchType('EXPENSE')}
          >
            <Ionicons
              name="arrow-down-circle"
              size={20}
              color={selectedType === 'EXPENSE' ? c.danger : c.textMuted}
            />
            <Text
              style={[
                styles.typeText,
                selectedType === 'EXPENSE' && { color: c.danger, fontWeight: FontWeight.bold },
              ]}
            >
              Gasto
            </Text>
          </Pressable>
        </View>

        {/* Input de Monto */}
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Monto ($ COP)"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              placeholder="0"
              leftIcon="cash-outline"
              error={errors.amount?.message}
              hint={`Ejemplo: ${formatMoneyCop('150000')}`}
            />
          )}
        />

        {/* Categoría */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Categoría</Text>
          {categories.isPending ? (
            <ActivityIndicator color={c.primary} style={{ padding: Spacing.sm }} />
          ) : (
            <View style={styles.chipWrap}>
              {(categories.data ?? []).map((category) => {
                const active = category.id === selectedCategoryId;
                return (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      active && { backgroundColor: c.primary, borderColor: c.primary },
                    ]}
                    onPress={() => setValue('category_id', category.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && { color: c.onPrimary, fontWeight: FontWeight.bold },
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
              {!categories.isPending && (categories.data?.length ?? 0) === 0 ? (
                <Text style={styles.hintText}>No hay categorías activas de este tipo.</Text>
              ) : null}
            </View>
          )}
          {errors.category_id ? (
            <Text style={styles.errorText}>⚠ {errors.category_id.message}</Text>
          ) : null}
        </View>

        {/* Fecha */}
        <Controller
          control={control}
          name="transaction_date"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Fecha (AAAA-MM-DD)"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              placeholder={todayIsoDate()}
              leftIcon="calendar-outline"
              error={errors.transaction_date?.message}
            />
          )}
        />

        {/* Método de pago */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Método de pago (opcional)</Text>
          <View style={styles.chipWrap}>
            {PAYMENT_METHODS.map((method) => {
              const current = watch('payment_method');
              const active = current === method;
              return (
                <Pressable
                  key={method}
                  style={[
                    styles.categoryChip,
                    active && { backgroundColor: c.primary, borderColor: c.primary },
                  ]}
                  onPress={() =>
                    setValue('payment_method', active ? null : method)
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && { color: c.onPrimary, fontWeight: FontWeight.bold },
                    ]}
                  >
                    {METHOD_LABELS[method]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Descripción */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Descripción (opcional)"
              value={value ?? ''}
              onChangeText={onChange}
              placeholder="Ej: Mercado semanal, Factura de luz..."
              leftIcon="document-text-outline"
              error={errors.description?.message}
            />
          )}
        />

        {serverError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={c.danger} />
            <Text style={styles.serverError}>{serverError}</Text>
          </View>
        ) : null}

        <Button
          label="Guardar movimiento"
          onPress={() => void onSubmit()}
          loading={createTransaction.isPending}
          iconName="checkmark-circle-outline"
          fullWidth
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    container: {
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    typeRow: { flexDirection: 'row', gap: Spacing.sm },
    typeButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: Radius.card,
      borderWidth: 1.5,
      borderColor: c.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      backgroundColor: c.surface,
      ...Shadow.sm,
    },
    typeIncome: { backgroundColor: c.successSoft, borderColor: c.success },
    typeExpense: { backgroundColor: c.dangerSoft, borderColor: c.danger },
    typeText: { fontSize: Typography.base, fontWeight: FontWeight.semibold, color: c.textMuted },
    section: { gap: Spacing.xs },
    sectionLabel: { fontSize: Typography.base, fontWeight: FontWeight.semibold, color: c.textMuted },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    categoryChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
      minHeight: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    chipText: { fontSize: Typography.sm, color: c.text, fontWeight: FontWeight.medium },
    hintText: { fontSize: Typography.xs, color: c.textMuted },
    errorText: { color: c.danger, fontSize: Typography.xs, fontWeight: FontWeight.medium, marginTop: 2 },
    errorBox: {
      backgroundColor: c.dangerSoft,
      borderRadius: Radius.sm,
      padding: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    serverError: { color: c.danger, fontSize: Typography.sm, fontWeight: FontWeight.medium, flex: 1 },
  });
