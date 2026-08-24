import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormInput } from '@/components/form-input';
import { Radius, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import {
  useCancelLoan,
  useLoan,
  useLoanSchedule,
  usePayments,
  useRegisterPayment,
  useReversePayment,
} from '@/features/loans/queries';
import type { InstallmentDto, PaymentDto } from '@/features/loans/types';
import { formatIsoDateShort, formatMoneyCop, todayIsoDate } from '@/utils/money';

const statusColors = (c: Palette): Record<string, string> => ({
  ACTIVE: c.primary,
  OVERDUE: c.danger,
  PAID: c.success,
  CANCELLED: c.border,
});

const installmentColors = (c: Palette): Record<string, string> => ({
  PENDING: c.warning,
  PARTIAL: c.warning,
  PAID: c.success,
  OVERDUE: c.danger,
  CANCELLED: c.border,
});

const METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
] as const;

export default function LoanDetailScreen() {
  const c = usePalette();
  const styles = makeStyles(c);

function InstallmentCard({ installment }: { installment: InstallmentDto }) {
  const paid = parseFloat(installment.total_due) - parseFloat(installment.remaining_balance);

  return (
    <View style={styles.installmentCard}>
      <View style={styles.installmentHeader}>
        <Text style={styles.installmentNumber}>
          #{installment.installment_number} · {formatIsoDateShort(installment.due_date)}
        </Text>
        <Text
          style={{
            color: installmentColors(c)[installment.status],
            fontWeight: '700',
            fontSize: 12,
          }}
        >
          {installment.status}
        </Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Total due</Text>
        <Text style={styles.metricValue}>{formatMoneyCop(installment.total_due)}</Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Remaining</Text>
        <Text style={[styles.metricValue, { color: c.danger }]}>
          {formatMoneyCop(installment.remaining_balance)}
        </Text>
      </View>
      {paid > 0 ? (
        <Text style={styles.note}>{formatMoneyCop(String(paid))} already paid</Text>
      ) : null}
    </View>
  );
}
function PaymentCard({ payment, onReverse }: { payment: PaymentDto; onReverse: () => void }) {
  const isPosted = payment.status === 'POSTED';
  const reversed = !isPosted;

  return (
    <View style={[styles.installmentCard, reversed && { opacity: 0.6 }]}>
      <View style={styles.installmentHeader}>
        <Text style={styles.installmentNumber}>
          {formatIsoDateShort(payment.payment_date)} · {formatMoneyCop(payment.amount)}
        </Text>
        <Text style={{ color: isPosted ? c.success : c.danger, fontWeight: '700', fontSize: 12 }}>
          {payment.status}
        </Text>
      </View>
      <Text style={styles.note}>
        LF {formatMoneyCop(payment.allocation.late_fee)} · I{' '}
        {formatMoneyCop(payment.allocation.interest)} · P{' '}
        {formatMoneyCop(payment.allocation.principal)}
        {parseFloat(payment.allocation.credit) > 0
          ? ` · credit ${formatMoneyCop(payment.allocation.credit)}`
          : ''}
      </Text>
      {isPosted ? (
        <Pressable onPress={onReverse} hitSlop={6} style={{ alignSelf: 'flex-end' }}>
          <Text style={{ color: c.danger, fontSize: 13 }}>Reverse</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
function MetricRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}
  const { id } = useLocalSearchParams<{ id: string }>();
  const loan = useLoan(id);
  const schedule = useLoanSchedule(id);
  const payments = usePayments(id);
  const registerPayment = useRegisterPayment();
  const cancel = useCancelLoan();
  const reversePayment = useReversePayment();

  // Payment form state (UI_UX.md §39–43). Allocation preview is NOT shown
  // because v1.0 has no dry-run endpoint; the authoritative allocation is
  // displayed right after backend confirmation.
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayIsoDate());
  const [method, setMethod] = useState<(typeof METHODS)[number]['value']>('CASH');
  const [reference, setReference] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [reversingId, setReversingId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalError, setReversalError] = useState<string | null>(null);

  if (loan.isPending) {
    return (
      <View style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (loan.isError || !loan.data) {
    return (
      <View style={[styles.safeArea, styles.centered]}>
        <Text style={styles.error}>Could not load this loan.</Text>
      </View>
    );
  }

  const data = loan.data;

  const confirmCancel = () => {
    Alert.alert(
      'Cancel this loan?',
      'All records remain in history. Payments against a cancelled loan will be rejected.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Cancel loan', style: 'destructive', onPress: () => cancel.mutate(data.id) },
      ],
    );
  };

  const submitPayment = async () => {
    setPaymentError(null);
    const parsedAmount = amount.trim();
    if (!parsedAmount || isNaN(parseFloat(parsedAmount)) || parseFloat(parsedAmount) <= 0) {
      setPaymentError('Enter a valid amount greater than zero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      setPaymentError('Use the YYYY-MM-DD date format.');
      return;
    }

    try {
      const result = await registerPayment.mutateAsync({
        loanId: data.id,
        payload: {
          amount: parsedAmount,
          payment_date: paymentDate,
          payment_method: method,
          reference: reference || null,
          notes: null,
        },
      });

      setPaymentFormOpen(false);
      setAmount('');
      setReference('');

      // Success view with the backend-confirmed allocation (UI_UX.md §43).
      Alert.alert(
        'Payment registered',
        `${formatMoneyCop(result.amount)} received.\n\n` +
          `Late fees: ${formatMoneyCop(result.allocation.late_fee)}\n` +
          `Interest: ${formatMoneyCop(result.allocation.interest)}\n` +
          `Principal: ${formatMoneyCop(result.allocation.principal)}` +
          (parseFloat(result.allocation.credit) > 0
            ? `\nCredit generated: ${formatMoneyCop(result.allocation.credit)}`
            : ''),
      );
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : 'Unexpected error. Please try again.'
      );
    }
  };

  const confirmReverse = (payment: PaymentDto) => {
    setReversingId(payment.id);
    setReversalReason('');
    setReversalError(null);
  };

  const submitReversal = async () => {
    if (!reversingId) return;
    if (reversalReason.trim().length === 0) {
      setReversalError('A reversal reason is required.');
      return;
    }
    try {
      await reversePayment.mutateAsync({
        loanId: data.id,
        paymentId: reversingId,
        reason: reversalReason.trim(),
      });
      setReversingId(null);
      setReversalReason('');
    } catch (error) {
      setReversalError(
        error instanceof Error ? error.message : 'Unexpected error. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerBox}>
          <View>
            <Text style={styles.name}>{data.client_name}</Text>
            <Text style={styles.meta}>
              {formatMoneyCop(data.principal)} · {data.number_of_installments} installments ·{' '}
              {data.amortization_type === 'FRENCH' ? 'French' : 'Fixed'} ·{' '}
              {data.interest_rate}% {data.interest_period.toLowerCase()}
            </Text>
          </View>
          <Text
            style={[
              styles.statusBadge,
              { color: statusColors(c)[data.status], borderColor: statusColors(c)[data.status] },
            ]}
          >
            {data.status}
          </Text>
        </View>

        {/* Balance breakdown per UI_UX.md §36 — never one opaque debt number */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Outstanding balance</Text>
          <MetricRow label="Principal" value={formatMoneyCop(data.outstanding_principal)} />
          <MetricRow label="Interest" value={formatMoneyCop(data.outstanding_interest)} />
          <MetricRow label="Late fees" value={formatMoneyCop(data.outstanding_late_fees)} />
          <View style={styles.divider} />
          <MetricRow label="Total outstanding" value={formatMoneyCop(data.total_outstanding)} bold />
        </View>

        {data.status !== 'CANCELLED' && parseFloat(data.total_outstanding) > 0 ? (
          <>
            <Pressable
              style={styles.primaryButton}
              onPress={() => setPaymentFormOpen((open) => !open)}
            >
              <Text style={styles.primaryButtonText}>Register payment</Text>
            </Pressable>

            {paymentFormOpen ? (
              <View style={styles.card}>
                <FormInput
                  label="Amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  hint={`Outstanding: ${formatMoneyCop(data.total_outstanding)}`}
                />
                <FormInput
                  label="Date (YYYY-MM-DD)"
                  value={paymentDate}
                  onChangeText={setPaymentDate}
                  autoCapitalize="none"
                />
                <View>
                  <Text style={styles.fieldLabel}>Method</Text>
                  <View style={styles.chipWrap}>
                    {METHODS.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[styles.chip, method === option.value && styles.chipActive]}
                        onPress={() => setMethod(option.value)}
                      >
                        <Text>{option.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <FormInput
                  label="Reference (optional)"
                  value={reference}
                  onChangeText={setReference}
                  placeholder="Transfer #12345"
                />
                {paymentError ? <Text style={styles.error}>{paymentError}</Text> : null}
                <Pressable
                  style={[styles.submitButton, registerPayment.isPending && styles.disabled]}
                  onPress={() => void submitPayment()}
                  disabled={registerPayment.isPending}
                >
                  {registerPayment.isPending ? (
                    <ActivityIndicator color={c.onPrimary} />
                  ) : (
                    <Text style={styles.submitButtonText}>Confirm payment</Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Installments</Text>
        {schedule.isPending ? (
          <ActivityIndicator />
        ) : schedule.data ? (
          schedule.data.installments.map((installment) => (
            <InstallmentCard key={installment.id} installment={installment} />
          ))
        ) : (
          <Text style={styles.error}>Could not load the schedule.</Text>
        )}

        <Text style={styles.sectionTitle}>Payment history</Text>
        {payments.isPending ? (
          <ActivityIndicator />
        ) : (payments.data?.items.length ?? 0) === 0 ? (
          <Text style={styles.note}>No payments registered yet.</Text>
        ) : (
          (payments.data?.items ?? []).map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onReverse={() => confirmReverse(payment)}
            />
          ))
        )}

        {reversingId ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reverse payment</Text>
            <FormInput
              label="Reason (required)"
              value={reversalReason}
              onChangeText={setReversalReason}
              placeholder="e.g. Wrong amount entered"
            />
            {reversalError ? <Text style={styles.error}>{reversalError}</Text> : null}
            <View style={styles.row}>
              <Pressable style={[styles.smallButton, styles.flex1]} onPress={() => setReversingId(null)}>
                <Text>Keep payment</Text>
              </Pressable>
              <Pressable
                style={[styles.smallButton, styles.dangerButton, styles.flex1]}
                onPress={() => void submitReversal()}
                disabled={reversePayment.isPending}
              >
                <Text style={{ color: c.onPrimary }}>Confirm reversal</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {data.status !== 'CANCELLED' ? (
          <Pressable style={styles.deactivateButton} onPress={confirmCancel}>
            <Text style={styles.deactivateText}>Cancel loan</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const makeStyles = (c: Palette) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: Spacing.md, gap: Spacing.sm },
  headerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  name: { fontSize: 22, fontWeight: '700' },
  meta: { fontSize: 13, opacity: c.mutedOpacity, marginTop: 2 },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 3,
  },
  card: {
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  fieldLabel: { fontSize: 14, opacity: c.mutedOpacity, marginBottom: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginVertical: 2 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  metricLabel: { fontSize: 14, opacity: c.mutedOpacity },
  metricValue: { fontSize: 14, fontWeight: '600' },
  bold: { fontWeight: '800', fontSize: 15 },
  note: { fontSize: 12, opacity: c.mutedOpacity },
  installmentCard: {
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  installmentNumber: { fontSize: 15, fontWeight: '600' },
  primaryButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: c.onPrimary, fontWeight: '700', fontSize: 16 },
  submitButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  submitButtonText: { color: c.onPrimary, fontWeight: '600' },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex1: { flex: 1 },
  smallButton: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: { backgroundColor: c.danger, borderColor: c.danger },
  error: { color: c.danger, fontSize: 13 },
  deactivateButton: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.danger,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  deactivateText: { color: c.danger, fontWeight: '600' },
});;
