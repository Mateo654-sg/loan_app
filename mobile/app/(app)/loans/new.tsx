import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { FormInput } from '@/components/form-input';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useClients } from '@/features/clients/queries';
import {
  FREQUENCIES,
  PERIOD_BY_FREQUENCY,
  loanFormSchema,
  type LoanFormData,
} from '@/features/loans/schemas';
import { useCreateLoan } from '@/features/loans/queries';
import { ApiError } from '@/services/api/client';
import { todayIsoDate } from '@/utils/money';
import { getErrorMessage } from '@/utils/errors-es';

const FREQ_LABELS: Record<string, string> = {
  ONCE: 'Una sola vez',
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
};

const LATE_FEE_TYPE_LABELS = {
  FIXED_AMOUNT: 'Fija',
  PERCENTAGE: '% única',
  DAILY_PERCENTAGE: '% diaria',
} as const;

function SelectChip({ label, active, onPress, c }: { label: string; active: boolean; onPress: () => void; c: Palette }) {
  return (
    <Pressable
      style={({ pressed }) => [
        {
          borderRadius: Radius.pill,
          borderWidth: 1.5,
          borderColor: active ? c.primary : c.borderSubtle,
          backgroundColor: active ? c.primarySoft : c.surface,
          paddingHorizontal: Spacing.md,
          minHeight: 38,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      onPress={onPress}
    >
      <Text style={{ fontSize: Typography.sm, fontWeight: active ? FontWeight.extrabold as any : FontWeight.medium as any, color: active ? c.primary : c.textMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function NewLoanScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [serverError, setServerError] = useState<string | null>(null);
  const createLoan = useCreateLoan();
  const clients = useClients({ status: 'ACTIVE' });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      client_id: '',
      principal: '',
      start_date: todayIsoDate(),
      interest_rate: '',
      payment_frequency: 'MONTHLY',
      number_of_installments: '10',
      first_due_date: todayIsoDate(),
      late_fee_enabled: false,
      late_fee_type: 'DAILY_PERCENTAGE',
      late_fee_value: '',
      late_fee_grace_days: '0',
    },
  });

  const frequency = watch('payment_frequency');
  const lateFeeEnabled = watch('late_fee_enabled');
  const selectedClientId = watch('client_id');

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await createLoan.mutateAsync({
        client_id: values.client_id,
        principal: values.principal,
        start_date: values.start_date,
        interest_rate: values.interest_rate,
        interest_period: PERIOD_BY_FREQUENCY[values.payment_frequency],
        amortization_type: 'FIXED_PRINCIPAL',
        payment_frequency: values.payment_frequency,
        number_of_installments: parseInt(values.number_of_installments, 10),
        first_due_date: values.first_due_date,
        late_fee_configuration: values.late_fee_enabled
          ? {
              enabled: true,
              type: values.late_fee_type,
              value: values.late_fee_value ?? '0',
              grace_period_days: parseInt(values.late_fee_grace_days || '0', 10),
            }
          : null,
      });
      router.replace('/(app)/loans');
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Error inesperado. Intenta de nuevo.'
      );
    }
  });

  const interestPeriodLabel =
    frequency === 'DAILY'
      ? 'diario'
      : frequency === 'WEEKLY'
      ? 'semanal'
      : frequency === 'BIWEEKLY'
      ? 'quincenal'
      : 'mensual';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Nuevo préstamo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cliente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: c.primarySoft }]}>
              <Ionicons name="person" size={14} color={c.primary} />
            </View>
            <Text style={styles.sectionTitle}>Cliente</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
            {clients.isPending ? (
              <ActivityIndicator color={c.primary} />
            ) : (clients.data?.items ?? []).length === 0 ? (
              <Text style={[styles.emptyText, { color: c.textMuted }]}>No hay clientes activos. Crea uno primero.</Text>
            ) : (
              <View style={styles.chipWrap}>
                {(clients.data?.items ?? []).map((client) => (
                  <SelectChip
                    key={client.id}
                    label={client.full_name}
                    active={selectedClientId === client.id}
                    onPress={() => setValue('client_id', client.id)}
                    c={c}
                  />
                ))}
              </View>
            )}
            {errors.client_id ? (
              <Text style={styles.fieldError}>{errors.client_id.message}</Text>
            ) : null}
          </View>
        </View>

        {/* Monto e interés */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: c.successSoft }]}>
              <Ionicons name="cash" size={14} color={c.success} />
            </View>
            <Text style={styles.sectionTitle}>Monto e interés</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
            <Controller
              control={control}
              name="principal"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Monto del préstamo"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  placeholder="Ej: 500000"
                  leftIcon="cash-outline"
                  error={errors.principal?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="interest_rate"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label={`Tasa de interés % (${interestPeriodLabel})`}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  placeholder="Ej: 5"
                  leftIcon="trending-up-outline"
                  hint="Interés simple aplicado sobre el capital original"
                  error={errors.interest_rate?.message}
                />
              )}
            />
          </View>
        </View>

        {/* Condiciones */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="calendar" size={14} color={c.accent} />
            </View>
            <Text style={styles.sectionTitle}>Condiciones del préstamo</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
            <Text style={styles.fieldLabel}>Frecuencia de pago</Text>
            <View style={styles.chipWrap}>
              {FREQUENCIES.map((freq) => (
                <SelectChip
                  key={freq}
                  label={FREQ_LABELS[freq]}
                  active={frequency === freq}
                  onPress={() => setValue('payment_frequency', freq)}
                  c={c}
                />
              ))}
            </View>

            <Controller
              control={control}
              name="number_of_installments"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Número de cuotas"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  leftIcon="list-outline"
                  error={errors.number_of_installments?.message}
                />
              )}
            />

            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="start_date"
                  render={({ field: { onChange, value } }) => (
                    <FormInput
                      label="Fecha de inicio"
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="none"
                      placeholder="AAAA-MM-DD"
                      leftIcon="today-outline"
                      error={errors.start_date?.message}
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="first_due_date"
                  render={({ field: { onChange, value } }) => (
                    <FormInput
                      label="Primera cuota"
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="none"
                      placeholder="AAAA-MM-DD"
                      leftIcon="calendar-outline"
                      error={errors.first_due_date?.message}
                    />
                  )}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Cargo por mora */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <View style={[styles.sectionIconBox, { backgroundColor: c.warningSoft }]}>
                  <Ionicons name="warning" size={14} color={c.warning} />
                </View>
                <View>
                  <Text style={styles.switchTitle}>Cargo por mora</Text>
                  <Text style={[styles.switchSubtitle, { color: c.textMuted }]}>Cobro adicional por pagos tardíos</Text>
                </View>
              </View>
              <Switch
                value={lateFeeEnabled}
                onValueChange={(v) => setValue('late_fee_enabled', v)}
                trackColor={{ false: c.borderSubtle, true: c.warning + 'AA' }}
                thumbColor={lateFeeEnabled ? c.warning : c.textMuted}
              />
            </View>

            {lateFeeEnabled ? (
              <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
                <Text style={styles.fieldLabel}>Tipo de cargo</Text>
                <View style={styles.chipWrap}>
                  {(['FIXED_AMOUNT', 'PERCENTAGE', 'DAILY_PERCENTAGE'] as const).map((type) => (
                    <SelectChip
                      key={type}
                      label={LATE_FEE_TYPE_LABELS[type]}
                      active={watch('late_fee_type') === type}
                      onPress={() => setValue('late_fee_type', type)}
                      c={c}
                    />
                  ))}
                </View>
                <View style={styles.dateRow}>
                  <View style={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name="late_fee_value"
                      render={({ field: { onChange, value } }) => (
                        <FormInput
                          label="Valor del cargo"
                          value={value ?? ''}
                          onChangeText={onChange}
                          keyboardType="decimal-pad"
                          error={errors.late_fee_value?.message}
                        />
                      )}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name="late_fee_grace_days"
                      render={({ field: { onChange, value } }) => (
                        <FormInput
                          label="Días de gracia"
                          value={value ?? ''}
                          onChangeText={onChange}
                          keyboardType="number-pad"
                        />
                      )}
                    />
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Error */}
        {serverError ? (
          <View style={[styles.errorBox, { backgroundColor: c.dangerSoft, borderColor: c.danger + '30' }]}>
            <Ionicons name="alert-circle" size={16} color={c.danger} />
            <Text style={[styles.errorText, { color: c.danger }]}>{serverError}</Text>
          </View>
        ) : null}

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [styles.submitBtn, { opacity: pressed || createLoan.isPending ? 0.82 : 1 }]}
          onPress={() => void onSubmit()}
          disabled={createLoan.isPending}
        >
          <LinearGradient colors={c.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
            {createLoan.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.submitText}>Crear préstamo</Text>
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
    section: { gap: Spacing.xs },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: 2 },
    sectionIconBox: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: Typography.sm, fontWeight: FontWeight.extrabold as any, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    card: { borderRadius: Radius.card, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, ...Shadow.sm },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    emptyText: { fontSize: Typography.sm, textAlign: 'center', paddingVertical: Spacing.sm },
    fieldError: { color: c.danger, fontSize: Typography.xs, marginTop: 2 },
    fieldLabel: { fontSize: Typography.sm, fontWeight: FontWeight.semibold as any, color: c.textMuted, marginBottom: 2 },
    dateRow: { flexDirection: 'row', gap: Spacing.sm },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    switchLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
    switchTitle: { fontSize: Typography.base, fontWeight: FontWeight.bold as any, color: c.text },
    switchSubtitle: { fontSize: Typography.xs, marginTop: 1 },
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1 },
    errorText: { fontSize: Typography.sm, fontWeight: FontWeight.medium as any, flex: 1 },
    submitBtn: { borderRadius: Radius.button, overflow: 'hidden', ...Shadow.lg },
    submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, minHeight: 54, paddingHorizontal: Spacing.lg },
    submitText: { color: '#FFF', fontSize: Typography.md, fontWeight: FontWeight.black as any },
  });
