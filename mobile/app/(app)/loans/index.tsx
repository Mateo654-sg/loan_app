import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { MoneyDisplay } from '@/components/ui/money-display';
import { StatusBadge } from '@/components/ui/status-badge';
import { Chip } from '@/components/ui/chip';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { FontWeight, Radius, Shadow, Spacing, Typography, LetterSpacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useInfiniteLoans } from '@/features/loans/queries';
import type { LoanDto } from '@/features/loans/types';
import { formatMoneyCop } from '@/utils/money';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'OVERDUE', 'PAID', 'CANCELLED'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: 'Todos',
  ACTIVE: 'Activos',
  OVERDUE: 'Vencidos',
  PAID: 'Pagados',
  CANCELLED: 'Cancelados',
};

const STATUS_TONE: Record<string, 'primary' | 'success' | 'danger' | 'neutral' | 'warning'> = {
  ACTIVE: 'primary',
  OVERDUE: 'danger',
  PAID: 'success',
  CANCELLED: 'neutral',
};

export default function LoansScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const loans = useInfiniteLoans(statusFilter === 'ALL' ? {} : { status: statusFilter });
  const items = loans.data?.pages.flatMap((page) => page.items) ?? [];

  // Animaciones de entrada
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(20);
  const fabScale = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      headerOpacity.value = withDelay(50, withSpring(1, { damping: 20, stiffness: 120 }));
      headerTranslateY.value = withDelay(50, withSpring(0, { damping: 20, stiffness: 120 }));

      listOpacity.value = withDelay(200, withSpring(1, { damping: 20, stiffness: 120 }));
      listTranslateY.value = withDelay(200, withSpring(0, { damping: 20, stiffness: 120 }));

      fabScale.value = withDelay(400, withSpring(1, { damping: 14, stiffness: 160 }));
    }, [])
  );

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const renderItem = ({ item }: { item: LoanDto }) => (
    <Link href={`/(app)/loans/${item.id}`} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.rowCard,
          { backgroundColor: c.surface, borderColor: c.borderSubtle },
          pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
        ]}
      >
        <Avatar name={item.client_name} size="md" variant="gradient" />
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>{item.client_name}</Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {formatMoneyCop(item.principal)} · {item.number_of_installments} cuotas · {item.payment_frequency}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <MoneyDisplay value={item.total_outstanding} size="md" tone="primary" weight="extrabold" />
          <StatusBadge status={item.status as any} size="sm" />
        </View>
      </Pressable>
    </Link>
  );

  const renderEmpty = () => (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="document-text" size={44} color={c.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Sin préstamos registrados</Text>
      <Text style={styles.emptySubtitle}>
        Crea tu primer préstamo para comenzar el seguimiento de cobros.
      </Text>
      <Link href="/(app)/loans/new" asChild>
        <Button
          label="Crear préstamo"
          onPress={() => {}}
          variant="primary"
          size="lg"
          iconName="add"
          fullWidth
        />
      </Link>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Animated.View style={[styles.container, headerAnimatedStyle]}>
        {/* Quick access to collections */}
        <Link href="/(app)/loans/collections" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.collectionsButton,
              { backgroundColor: c.surface, borderColor: c.borderSubtle },
              pressed && { opacity: 0.82 },
            ]}
          >
            <View style={styles.collectionsIconBox}>
              <Ionicons name="card" size={20} color={c.primary} />
            </View>
            <Text style={styles.collectionsText}>Cobros de hoy</Text>
            <Ionicons name="chevron-forward" size={18} color={c.primary} style={{ marginLeft: 'auto' }} />
          </Pressable>
        </Link>

        {/* Stats summary */}
        {items.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
              <Text style={styles.statLabel}>Total prestado</Text>
              <MoneyDisplay
                value={items.reduce((sum, l) => sum + parseFloat(l.principal), 0)}
                size="lg"
                weight="extrabold"
              />
            </View>
            <View style={[styles.statBox, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
              <Text style={styles.statLabel}>Por cobrar</Text>
              <MoneyDisplay
                value={items.reduce((sum, l) => sum + parseFloat(l.total_outstanding), 0)}
                size="lg"
                tone="primary"
                weight="extrabold"
              />
            </View>
            <View style={[styles.statBox, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
              <Text style={styles.statLabel}>Vencidos</Text>
              <MoneyDisplay
                value={items.filter(l => l.status === 'OVERDUE').reduce((sum, l) => sum + parseFloat(l.total_outstanding), 0)}
                size="lg"
                tone="danger"
                weight="extrabold"
              />
            </View>
          </View>
        )}

        {/* Filter chips */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {STATUS_FILTERS.map((value) => (
              <Chip
                key={value}
                label={FILTER_LABELS[value]}
                selected={statusFilter === value}
                onPress={() => setStatusFilter(value)}
                variant="primary"
              />
            ))}
          </ScrollView>
        </View>
</Animated.View>

      <Animated.View style={[styles.listContainer, listAnimatedStyle]}>
        {/* Lista / estados */}
        {loans.isPending ? (
          <View style={styles.skeletonContainer}>
            <Skeleton height={100} variant="card" />
            <Skeleton height={100} variant="card" />
            <Skeleton height={100} variant="card" />
          </View>
        ) : loans.isError ? (
          <View style={styles.errorBox}>
            <View style={styles.errorIconBox}>
              <Ionicons name="cloud-offline" size={40} color={c.danger} />
            </View>
            <Text style={styles.errorText}>Error al cargar préstamos</Text>
            <Text style={styles.errorSubtext}>Verifica tu conexión e inténtalo de nuevo</Text>
          </View>
        ) : items.length === 0 ? (
          renderEmpty()
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ gap: Spacing.sm, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              loans.hasNextPage ? (
                <Pressable
                  style={styles.loadMore}
                  onPress={() => void loans.fetchNextPage()}
                  disabled={loans.isFetchingNextPage}
                >
                  <Text style={styles.loadMoreText}>
                    {loans.isFetchingNextPage ? 'Cargando...' : 'Cargar más préstamos'}
                  </Text>
                </Pressable>
              ) : null
            }
          />
        )}
      </Animated.View>

      {/* FAB Premium */}
      <Animated.View style={[styles.fab, fabAnimatedStyle]}>
        <Link href="/(app)/loans/new" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.fabInner,
              { backgroundColor: c.primary },
              pressed && { opacity: 0.88, transform: [{ scale: 0.94 }] },
            ]}
          >
            <Ionicons name="add" size={32} color={c.onPrimary} />
          </Pressable>
        </Link>
      </Animated.View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    container: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.lg },
    listContainer: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

    // Collections button
    collectionsButton: {
      borderRadius: Radius.card,
      borderWidth: 1,
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
      ...Shadow.md,
    },
    collectionsIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    collectionsText: {
      color: c.text,
      fontWeight: FontWeight.bold,
      fontSize: Typography.base,
    },

    // Stats row
    statsRow: { flexDirection: 'row', gap: Spacing.sm },
    statBox: {
      flex: 1,
      borderRadius: Radius.card,
      padding: Spacing.md,
      alignItems: 'center',
      gap: Spacing.xs,
      ...Shadow.sm,
    },
    statLabel: { fontSize: Typography.xs, color: c.textMuted, fontWeight: FontWeight.semibold, letterSpacing: LetterSpacing.wide },

    // Filter chips
    filterWrapper: { marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg, marginTop: Spacing.xs },
    filterRow: { flexDirection: 'row', gap: Spacing.xs, paddingRight: Spacing.lg },

    // Loan rows
    rowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius.card,
      ...Shadow.md,
    },
    rowMain: { flex: 1, gap: Spacing.xs },
    rowTitle: { fontSize: Typography.base, fontWeight: FontWeight.bold, color: c.text },
    rowSubtitle: { fontSize: Typography.xs, color: c.textMuted, fontWeight: FontWeight.medium },
    rowRight: { alignItems: 'flex-end', gap: Spacing.sm },

    // Load more
    loadMore: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.md, borderRadius: Radius.button },
    loadMoreText: { color: c.primary, fontWeight: FontWeight.bold, fontSize: Typography.sm },

    // Empty state
    emptyBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.xl },
    emptyIconBox: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.chipBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    emptyTitle: { fontSize: Typography.xl, fontWeight: FontWeight.bold, color: c.text, textAlign: 'center' },
    emptySubtitle: { color: c.textMuted, fontSize: Typography.sm, textAlign: 'center', paddingHorizontal: Spacing.lg, lineHeight: 20 },

    // Error
    errorBox: { alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
    errorIconBox: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    errorText: { color: c.text, fontSize: Typography.lg, fontWeight: FontWeight.bold },
    errorSubtext: { color: c.textMuted, fontSize: Typography.sm },

    // FAB — respeta tab bar + safe area
    fab: {
      position: 'absolute',
      bottom: 90,
      right: Spacing.lg,
      ...Shadow.xl,
    },
    fabInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Skeleton
    skeletonContainer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  });