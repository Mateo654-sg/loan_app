import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormInput } from '@/components/form-input';
import { Radius, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { categoryFormSchema, type CategoryFormData } from '@/features/finance/schemas';
import {
  useCategories,
  useCreateCategory,
  useDeactivateCategory,
} from '@/features/finance/queries';
import { ApiError } from '@/services/api/client';

export default function CategoriesScreen() {
  const c = usePalette();
  const styles = makeStyles(c);
  const categories = useCategories();
  const createCategory = useCreateCategory();
  const deactivateCategory = useDeactivateCategory();
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [serverError, setServerError] = useState<string | null>(null);

  const confirmCreate = async () => {
    const parsed = categoryFormSchema.safeParse({ name: newName });
    if (!parsed.success) {
      setServerError(parsed.error.issues[0]?.message ?? 'Invalid name');
      return;
    }

    setServerError(null);
    try {
      await createCategory.mutateAsync({ name: parsed.data.name, type: newType });
      setNewName('');
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Unexpected error. Please try again.'
      );
    }
  };

  const confirmDeactivate = (id: string, name: string) => {
    Alert.alert(
      `Deactivate "${name}"?`,
      'It will no longer be selectable for new transactions. Historical records are preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => deactivateCategory.mutate(id),
        },
      ],
    );
  };

  const renderSection = (type: 'INCOME' | 'EXPENSE', title: string) => {
    const items = (categories.data ?? []).filter((c) => c.type === type && c.is_active);

    return (
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map((category) => (
          <View key={category.id} style={styles.row}>
            <Text style={styles.rowTitle}>{category.name}</Text>
            <Pressable onPress={() => confirmDeactivate(category.id, category.name)} hitSlop={8}>
              <Text style={styles.deactivate}>Deactivate</Text>
            </Pressable>
          </View>
        ))}
        {categories.isPending ? <ActivityIndicator /> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.createBox}>
          <Text style={styles.sectionTitle}>New category</Text>
          <View style={styles.typeRow}>
            {(['EXPENSE', 'INCOME'] as const).map((value) => (
              <Pressable
                key={value}
                style={[styles.typeChip, newType === value && styles.typeChipActive]}
                onPress={() => setNewType(value)}
              >
                <Text>{value === 'EXPENSE' ? 'Expense' : 'Income'}</Text>
              </Pressable>
            ))}
          </View>
          <FormInput
            label="Name"
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g. Pets"
            error={serverError ?? undefined}
          />
          <Pressable
            style={[styles.addButton, createCategory.isPending && styles.disabled]}
            onPress={() => void confirmCreate()}
            disabled={createCategory.isPending}
          >
            <Text style={styles.addButtonText}>Create category</Text>
          </Pressable>
        </View>

        {renderSection('INCOME', 'Income')}
        {renderSection('EXPENSE', 'Expenses')}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.background },
  container: { padding: Spacing.md, gap: Spacing.lg },
  createBox: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
  addButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: c.onPrimary, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  rowTitle: { fontSize: 15 },
  deactivate: { color: c.danger, fontSize: 13 },
});;
