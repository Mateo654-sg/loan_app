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
import { SafeAreaView , useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormInput } from '@/components/form-input';
import { Radius, Spacing } from '@/constants/tokens';
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

const AMORTIZATION_LABELS = { FIXED_PRINCIPAL: 'Capital fijo', FRENCH: 'Francés' } as const;

const PERIOD_ES: Record<string, string> = {
  ONCE: 'mensual',
  DAILY: 'diario',
  WEEKLY: 'semanal',
  BIWEEKLY: 'quincenal',
  MONTHLY: 'mensual',
} as const;

const FREQ_LABELS: Record<string, string> = {
  ONCE: 'Una vez',
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
} as const;

const LATE_FEE_TYPE_LABELS = {
  FIXED_AMOUNT: 'Fija',
  PERCENTAGE: '% única',
  DAILY_PERCENTAGE: '% diaria',
} as const;

export default function NewLoanScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chipBase, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}
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
      amortization_type: 'FIXED_PRINCIPAL',
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
  const amortization = watch('amortization_type');
  const lateFeeEnabled = watch('late_fee_enabled');

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await createLoan.mutateAsync({
        client_id: values.client_id,
        principal: values.principal,
        start_date: values.start_date,
        interest_rate: values.interest_rate,
        // Derived per the v1.0 backend compatibility rule (no conversions).
        interest_period: PERIOD_BY_FREQUENCY[values.payment_frequency],
        amortization_type: values.amortization_type,
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
        error instanceof ApiError ? error.message : 'Unexpected error. Please try again.'
      );
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={[{ paddingBottom: Spacing.xl }, styles.container]} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.sectionLabel}>Customer</Text>
          {clients.isPending ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.chipWrap}>
              {(clients.data?.items ?? []).map((client) => (
                <Chip
                  key={client.id}
                  label={client.full_name}
                  active={watch('client_id') === client.id}
                  onPress={() => setValue('client_id', client.id)}
                />
              ))}
            </View>
          )}
          {errors.client_id ? (
            <Text style={styles.error}>{errors.client_id.message}</Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="principal"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Monto del préstamo"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              error={errors.principal?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="interest_rate"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label={`Tasa % por período ${PERIOD_ES[frequency]}`}
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              placeholder="e.g. 5"
              error={errors.interest_rate?.message}
            />
          )}
        />

        <View>
          <Text style={styles.sectionLabel}>Amortization</Text>
          <View style={styles.chipWrap}>
            {(['FIXED_PRINCIPAL', 'FRENCH'] as const).map((type) => (
              <Chip
                key={type}
                label={AMORTIZATION_LABELS[type]}
                active={amortization === type}
                onPress={() => setValue('amortization_type', type)}
              />
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Payment frequency</Text>
          <View style={styles.chipWrap}>
            {FREQUENCIES.map((freq) => (
              <Chip
                key={freq}
                label={FREQ_LABELS[freq]}
                active={frequency === freq}
                onPress={() => setValue('payment_frequency', freq)}
              />
            ))}
          </View>
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
              error={errors.number_of_installments?.message}
            />
          )}
        />

        <View style={styles.row}>
          <Controller
            control={control}
            name="start_date"
            render={({ field: { onChange, value } }) => (
              <View style={styles.flex1}>
                <FormInput
                  label="Fecha de inicio (AAAA-MM-DD)"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  error={errors.start_date?.message}
                />
              </View>
            )}
          />
          <Controller
            control={control}
            name="first_due_date"
            render={({ field: { onChange, value } }) => (
              <View style={styles.flex1}>
                <FormInput
                  label="Primera cuota (AAAA-MM-DD)"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  error={errors.first_due_date?.message}
                />
              </View>
            )}
          />
        </View>

        <View style={styles.lateFeeRow}>
          <Text style={styles.sectionLabel}>Late fees</Text>
          <Switch
            value={lateFeeEnabled}
            onValueChange={(value) => setValue('late_fee_enabled', value)}
          />
        </View>

        {lateFeeEnabled ? (
          <View style={{ gap: Spacing.sm }}>
            <View style={styles.chipWrap}>
              {(['FIXED_AMOUNT', 'PERCENTAGE', 'DAILY_PERCENTAGE'] as const).map((type) => (
                <Chip
                  key={type}
                  label={LATE_FEE_TYPE_LABELS[type]}
                  active={watch('late_fee_type') === type}
                  onPress={() => setValue('late_fee_type', type)}
                />
              ))}
            </View>
            <View style={styles.row}>
              <Controller
                control={control}
                name="late_fee_value"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.flex1}>
                    <FormInput
                      label="Valor"
                      value={value ?? ''}
                      onChangeText={onChange}
                      keyboardType="decimal-pad"
                      error={errors.late_fee_value?.message}
                    />
                  </View>
                )}
              />
              <Controller
                control={control}
                name="late_fee_grace_days"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.flex1}>
                    <FormInput
                      label="Días de gracia"
                      value={value ?? ''}
                      onChangeText={onChange}
                      keyboardType="number-pad"
                    />
                  </View>
                )}
              />
            </View>
          </View>
        ) : null}

        {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

        <Pressable
          style={[styles.submitButton, createLoan.isPending && styles.disabled]}
          onPress={() => void onSubmit()}
          disabled={createLoan.isPending}
        >
          {createLoan.isPending ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={styles.submitText}>Crear préstamo</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const makeStyles = (c: Palette) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.background },
  container: { padding: Spacing.md, gap: Spacing.md },
  sectionLabel: { fontSize: 14, opacity: c.mutedOpacity, marginBottom: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chipBase: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  chipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex1: { flex: 1 },
  lateFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serverError: { color: c.danger, textAlign: 'center' },
  error: { color: c.danger, fontSize: 13 },
  submitButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  disabled: { opacity: 0.6 },
  submitText: { color: c.onPrimary, fontWeight: '600', fontSize: 16 },
});;
