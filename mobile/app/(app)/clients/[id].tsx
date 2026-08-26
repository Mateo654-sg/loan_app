import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView , useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import {
  useClient,
  useClientSummary,
  useCreateReference,
  useDeactivateClient,
  useReferences,
} from '@/features/clients/queries';
import { referenceFormSchema } from '@/features/clients/schemas';
import { ApiError } from '@/services/api/client';

export default function ClientDetailScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={[styles.safeArea, styles.centered]}>{children}</View>;
}
function MetricRow({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, tone === 'danger' && { color: c.danger }]}>
        {value}
      </Text>
    </View>
  );
}
function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useClient(id);
  const summary = useClientSummary(id);
  const references = useReferences(id);
  const deactivate = useDeactivateClient();
  const addReference = useCreateReference();

  const [refName, setRefName] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [refRelationship, setRefRelationship] = useState('');
  const [refError, setRefError] = useState<string | null>(null);

  if (client.isPending) {
    return <Centered><ActivityIndicator size="large" /></Centered>;
  }

  if (client.isError || !client.data) {
    return (
      <Centered>
        <Text style={styles.error}>Could not load this customer.</Text>
      </Centered>
    );
  }

  const data = client.data;

  const confirmDeactivate = () => {
    Alert.alert(
      `Deactivate ${data.full_name}?`,
      'Existing loans and history remain. The customer will not be selectable for new loans.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: () => deactivate.mutate(data.id) },
      ],
    );
  };

  const submitReference = async () => {
    const parsed = referenceFormSchema.safeParse({
      name: refName,
      phone: refPhone,
      relationship: refRelationship,
    });
    if (!parsed.success) {
      setRefError(parsed.error.issues[0]?.message ?? 'Invalid data');
      return;
    }
    setRefError(null);
    try {
      await addReference.mutateAsync({
        clientId: data.id,
        payload: {
          name: parsed.data.name,
          phone: parsed.data.phone || null,
          relationship: parsed.data.relationship || null,
        },
      });
      setRefName('');
      setRefPhone('');
      setRefRelationship('');
    } catch (error) {
      setRefError(
        error instanceof ApiError ? error.message : 'Unexpected error. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={[{ paddingBottom: Spacing.xl }, styles.container]}>
        <View style={styles.headerBox}>
          <Text style={styles.name}>{data.full_name}</Text>
          <Text
            style={[
              styles.status,
              { color: data.status === 'ACTIVE' ? c.success : c.border },
            ]}
          >
            {data.status}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen financiero</Text>
          {summary.isPending ? (
            <ActivityIndicator />
          ) : summary.data ? (
            <>
              <MetricRow label="Préstamos activos" value={String(summary.data.active_loans)} />
              <MetricRow label="Capital prestado" value={summary.data.total_capital_lent} />
              <MetricRow label="Capital vigente" value={summary.data.outstanding_capital} />
              <MetricRow label="Total por cobrar" value={summary.data.total_receivable} />
              <MetricRow label="Total en mora" value={summary.data.total_overdue} tone="danger" />
              <Text style={styles.note}>Las métricas de préstamos se activan con el módulo de préstamos.</Text>
            </>
          ) : (
            <Text style={styles.error}>Could not load the summary.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de contacto</Text>
          <InfoRow label="Documento" value={data.document_number} />
          <InfoRow label="Teléfono" value={data.phone} />
          <InfoRow label="Tel. alterno" value={data.alternative_phone} />
          <InfoRow label="Correo" value={data.email} />
          <InfoRow label="Dirección" value={data.address} />
          <InfoRow label="Notas" value={data.notes} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referencias</Text>
          {(references.data ?? []).filter((r) => r.is_active).length === 0 ? (
            <Text style={styles.note}>Sin referencias activas.</Text>
          ) : (
            (references.data ?? [])
              .filter((r) => r.is_active)
              .map((r) => (
                <View key={r.id} style={styles.refRow}>
                  <Text style={styles.refName}>{r.name}</Text>
                  <Text style={styles.refMeta}>
                    {[r.relationship, r.phone].filter(Boolean).join(' · ') || '—'}
                  </Text>
                </View>
              ))
          )}

          <View style={styles.refForm}>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la referencia"
              placeholderTextColor={c.textMuted}
              value={refName}
              onChangeText={setRefName}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Phone"
                placeholderTextColor={c.textMuted}
                value={refPhone}
                onChangeText={setRefPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Parentesco"
                placeholderTextColor={c.textMuted}
                value={refRelationship}
                onChangeText={setRefRelationship}
              />
            </View>
            {refError ? <Text style={styles.error}>{refError}</Text> : null}
            <Pressable
              style={[styles.smallButton, addReference.isPending && styles.disabled]}
              onPress={() => void submitReference()}
              disabled={addReference.isPending}
            >
              <Text style={styles.smallButtonText}>Agregar referencia</Text>
            </Pressable>
          </View>
        </View>

        {data.status === 'ACTIVE' ? (
          <Pressable style={styles.deactivateButton} onPress={confirmDeactivate}>
            <Text style={styles.deactivateText}>Desactivar cliente</Text>
          </Pressable>
        ) : null}

        <Link href="/(app)/finance/new-transaction" asChild>
          <Pressable style={styles.secondaryLink}>
            <Text style={styles.secondaryLinkText}>Go to Finanzas</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
const makeStyles = (c: Palette) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: Spacing.md, gap: Spacing.md },
  headerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { fontSize: 22, fontWeight: '700' },
  status: { fontSize: 12, fontWeight: '700' },
  section: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metricLabel: { fontSize: 14, opacity: c.mutedOpacity },
  metricValue: { fontSize: 14, fontWeight: '600' },
  infoValue: { fontSize: 14, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  note: { fontSize: 12, opacity: c.mutedOpacity },
  refRow: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  refName: { fontSize: 15, fontWeight: '500' },
  refMeta: { fontSize: 13, opacity: c.mutedOpacity },
  refForm: { gap: Spacing.sm, marginTop: Spacing.xs },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex1: { flex: 1 },
  smallButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: { color: c.onPrimary, fontWeight: '600' },
  deactivateButton: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.danger,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateText: { color: c.danger, fontWeight: '600' },
  secondaryLink: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  secondaryLinkText: { color: c.primary },
  error: { color: c.danger, textAlign: 'center', padding: Spacing.md },
  disabled: { opacity: 0.6 },
});;
