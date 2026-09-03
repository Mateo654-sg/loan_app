import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView , useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormInput } from '@/components/form-input';
import { Radius, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import {
  contributionFormSchema,
  goalFormSchema,
  type GoalFormData,
} from '@/features/finance/schemas';
import { useAddContribution, useCreateGoal, useGoals } from '@/features/finance/queries';
import { ApiError } from '@/services/api/client';
import type { GoalDto } from '@/features/finance/types';
import { formatMoneyCop, todayIsoDate } from '@/utils/money';

export default function GoalsScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const goals = useGoals();
  const createGoal = useCreateGoal();
  const addContribution = useAddContribution();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [contributionFor, setContributionFor] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionError, setContributionError] = useState<string | null>(null);

  const submitGoal = async () => {
    const parsed = goalFormSchema.safeParse({
      name,
      target_amount: targetAmount,
      target_date: targetDate || '',
    });
    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }

    setCreateError(null);
    try {
      await createGoal.mutateAsync({
        name: parsed.data.name,
        target_amount: parsed.data.target_amount,
        target_date: parsed.data.target_date ? parsed.data.target_date : null,
      });
      setName('');
      setTargetAmount('');
      setTargetDate('');
    } catch (error) {
      setCreateError(
        error instanceof ApiError ? error.message : 'Error inesperado. Intenta de nuevo.'
      );
    }
  };

  const submitContribution = async (goalId: string) => {
    const parsed = contributionFormSchema.safeParse({ amount: contributionAmount });
    if (!parsed.success) {
      setContributionError(parsed.error.issues[0]?.message ?? 'Invalid amount');
      return;
    }

    setContributionError(null);
    try {
      await addContribution.mutateAsync({
        goalId,
        amount: parsed.data.amount,
        contribution_date: todayIsoDate(),
      });
      setContributionFor(null);
      setContributionAmount('');
    } catch (error) {
      setContributionError(
        error instanceof ApiError ? error.message : 'Error inesperado. Intenta de nuevo.'
      );
    }
  };

  const renderGoal = (goal: GoalDto) => (
    <View key={goal.id} style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalName}>{goal.name}</Text>
        <Text
          style={[
            styles.goalStatus,
            {
              color:
                goal.status === 'COMPLETED'
                  ? c.success
                  : goal.status === 'CANCELLED'
                    ? c.border
                    : c.primary,
            },
          ]}
        >
          {goal.status}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${goal.progress_percent}%` }]} />
      </View>

      <Text style={styles.goalMeta}>
        {formatMoneyCop(goal.current_amount)} / {formatMoneyCop(goal.target_amount)} ·{' '}
        {goal.progress_percent}%
        {goal.target_date ? ` · by ${goal.target_date}` : ''}
      </Text>

      {goal.status !== 'CANCELLED' ? (
        <>
          <Pressable
            style={styles.contributeButton}
            onPress={() => {
              setContributionFor(contributionFor === goal.id ? null : goal.id);
              setContributionError(null);
              setContributionAmount('');
            }}
          >
            <Text style={styles.contributeText}>+ Add contribution</Text>
          </Pressable>

          {contributionFor === goal.id ? (
            <View style={styles.contributionBox}>
              <FormInput
                label="Monto del aporte"
                value={contributionAmount}
                onChangeText={setContributionAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                error={contributionError ?? undefined}
                hint={`Example: ${formatMoneyCop('250000')}`}
              />
              <Pressable
                style={[styles.addButton, addContribution.isPending && styles.disabled]}
                onPress={() => void submitContribution(goal.id)}
                disabled={addContribution.isPending}
              >
                <Text style={styles.addButtonText}>Guardar aporte</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={[{ paddingBottom: Spacing.xl }, styles.container]} keyboardShouldPersistTaps="handled">
        <View style={styles.createBox}>
          <Text style={styles.sectionTitle}>New goal</Text>
          <FormInput label="Nombre" value={name} onChangeText={setName} placeholder="Emergency fund" />
          <FormInput
            label="Monto objetivo"
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <FormInput
            label="Target date (optional, YYYY-MM-DD)"
            value={targetDate}
            onChangeText={setTargetDate}
            autoCapitalize="none"
            placeholder="2027-06-30"
          />
          {createError ? <Text style={styles.error}>{createError}</Text> : null}
          <Pressable
            style={[styles.addButton, createGoal.isPending && styles.disabled]}
            onPress={() => void submitGoal()}
            disabled={createGoal.isPending}
          >
            <Text style={styles.addButtonText}>Crear meta</Text>
          </Pressable>
        </View>

        {goals.isPending ? <ActivityIndicator /> : null}
        {!goals.isPending && (goals.data?.length ?? 0) === 0 ? (
          <Text style={styles.empty}>
            Aún no tienes metas. Crea tu primera meta de ahorro arriba.
          </Text>
        ) : null}
        {(goals.data ?? []).map(renderGoal)}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.background },
  container: { padding: Spacing.md, gap: Spacing.md },
  createBox: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  error: { color: c.danger, fontSize: 13 },
  empty: { textAlign: 'center', opacity: 0.6, paddingVertical: Spacing.lg },
  goalCard: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { fontSize: 16, fontWeight: '600' },
  goalStatus: { fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: c.primarySoft,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: c.primary },
  goalMeta: { fontSize: 13, opacity: c.mutedOpacity },
  contributeButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.primary,
  },
  contributeText: { color: c.primary, fontWeight: '600' },
  contributionBox: { gap: Spacing.sm },
  addButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: c.onPrimary, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});;
