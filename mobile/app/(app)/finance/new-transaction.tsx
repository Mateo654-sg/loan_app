import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormInput } from '@/components/form-input';
import { Radius, Spacing } from '@/constants/tokens';
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
  CASH: 'Cash',
  BANK_TRANSFER: 'Transfer',
  CARD: 'Card',
  OTHER: 'Other',
};

export default function NewTransactionScreen() {
  const c = usePalette();
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
    setValue('category_id', ''); // categories are type-specific
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
        error instanceof ApiError ? error.message : 'Unexpected error. Please try again.'
      );
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen options={{ title: selectedType === 'INCOME' ? 'New income' : 'New expense' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeButton, selectedType === 'INCOME' && styles.typeIncome]}
            onPress={() => switchType('INCOME')}
          >
            <Text
              style={[
                styles.typeText,
                selectedType === 'INCOME' && styles.typeTextActive,
              ]}
            >
              Income
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeButton, selectedType === 'EXPENSE' && styles.typeExpense]}
            onPress={() => switchType('EXPENSE')}
          >
            <Text
              style={[styles.typeText, selectedType === 'EXPENSE' && styles.typeTextActive]}
            >
              Expense
            </Text>
          </Pressable>
        </View>

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Amount"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              error={errors.amount?.message}
              hint={`Example: ${formatMoneyCop('150000')}`}
            />
          )}
        />

        <View>
          <Text style={styles.sectionLabel}>Category</Text>
          {categories.isPending ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.chipWrap}>
              {(categories.data ?? []).map((category) => {
                const active = category.id === selectedCategoryId;
                return (
                  <Pressable
                    key={category.id}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setValue('category_id', category.id)}
                  >
                    <Text>{category.name}</Text>
                  </Pressable>
                );
              })}
              {!categories.isPending && (categories.data?.length ?? 0) === 0 ? (
                <Text style={styles.hint}>No active categories of this type.</Text>
              ) : null}
            </View>
          )}
          {errors.category_id ? (
            <Text style={styles.error}>{errors.category_id.message}</Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="transaction_date"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Date (YYYY-MM-DD)"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              placeholder={todayIsoDate()}
              error={errors.transaction_date?.message}
            />
          )}
        />

        <View>
          <Text style={styles.sectionLabel}>Payment method (optional)</Text>
          <View style={styles.chipWrap}>
            {PAYMENT_METHODS.map((method) => {
              const current = watch('payment_method');
              const active = current === method;
              return (
                <Pressable
                  key={method}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() =>
                    setValue('payment_method', active ? null : method)
                  }
                >
                  <Text>{METHOD_LABELS[method]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Description (optional)"
              value={value ?? ''}
              onChangeText={onChange}
              placeholder="Groceries"
              error={errors.description?.message}
            />
          )}
        />

        {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

        <Pressable
          style={[styles.submitButton, createTransaction.isPending && styles.buttonDisabled]}
          onPress={() => void onSubmit()}
          disabled={createTransaction.isPending}
        >
          {createTransaction.isPending ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={styles.submitText}>Save transaction</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.background },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIncome: { backgroundColor: c.successSoft, borderColor: c.success },
  typeExpense: { backgroundColor: c.dangerSoft, borderColor: c.danger },
  typeText: { fontSize: 15 },
  typeTextActive: { fontWeight: '700' },
  sectionLabel: { fontSize: 14, opacity: c.mutedOpacity, marginBottom: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
  hint: { fontSize: 12, opacity: c.mutedOpacity },
  error: { color: c.danger, fontSize: 13 },
  serverError: { color: c.danger, textAlign: 'center' },
  submitButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  submitText: { color: c.onPrimary, fontWeight: '600', fontSize: 16 },
});;
