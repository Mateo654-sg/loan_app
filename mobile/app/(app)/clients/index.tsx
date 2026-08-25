import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView , useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import type { BadgeTone } from '@/components/ui/badge';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useInfiniteClients } from '@/features/clients/queries';
import type { ClientDto } from '@/features/clients/types';

function ClientAvatar({ name, c }: { name: string; c: Palette }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: c.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: c.primary + '30',
      }}
    >
      <Text
        style={{
          fontSize: Typography.base,
          fontWeight: FontWeight.bold,
          color: c.primary,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

export default function ClientsScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const clients = useInfiniteClients(
    submittedSearch ? { search: submittedSearch } : {},
  );
  const allItems = clients.data?.pages.flatMap((page) => page.items) ?? [];

  const renderItem = ({ item }: { item: ClientDto }) => (
    <Link href={`/(app)/clients/${item.id}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.72 }]}
      >
        <ClientAvatar name={item.full_name} c={c} />
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>{item.full_name}</Text>
          <Text style={styles.rowSubtitle}>
            {[item.document_number, item.phone].filter(Boolean).join(' · ') || '—'}
          </Text>
        </View>
        <Badge
          label={item.status === 'ACTIVE' ? 'Activo' : item.status}
          tone={item.status === 'ACTIVE' ? ('success' as BadgeTone) : ('neutral' as BadgeTone)}
        />
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Buscador */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => setSubmittedSearch(searchText.trim())}
            placeholder="Buscar por nombre, documento o teléfono..."
            placeholderTextColor={c.textSubtle}
            returnKeyType="search"
          />
          {searchText.length > 0 ? (
            <Pressable
              onPress={() => {
                setSearchText('');
                setSubmittedSearch('');
              }}
              hitSlop={8}
            >
              <Text style={{ fontSize: Typography.base, color: c.textMuted }}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Estados */}
        {clients.isPending ? (
          <ActivityIndicator style={{ padding: Spacing.lg }} color={c.primary} />
        ) : clients.isError ? (
          <Text style={styles.error}>Error al cargar clientes. Verifica la conexión.</Text>
        ) : allItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>Sin clientes aún</Text>
            <Text style={styles.emptySubtitle}>
              Crea tu primer cliente para empezar a gestionar préstamos.
            </Text>
            <Link href="/(app)/clients/new" asChild>
              <Pressable style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>+ Nuevo cliente</Text>
              </Pressable>
            </Link>
          </View>
        ) : null}

        {/* Lista */}
        {allItems.length > 0 ? (
          <FlatList
            data={allItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              clients.hasNextPage ? (
                <Pressable
                  style={styles.loadMore}
                  onPress={() => void clients.fetchNextPage()}
                  disabled={clients.isFetchingNextPage}
                >
                  <Text style={styles.loadMoreText}>
                    {clients.isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
                  </Text>
                </Pressable>
              ) : null
            }
          />
        ) : null}

        {/* FAB circular */}
        {allItems.length > 0 || clients.isPending ? (
          <Link href="/(app)/clients/new" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.fab,
                { backgroundColor: c.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.fabText}>＋</Text>
            </Pressable>
          </Link>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    container: { flex: 1, padding: Spacing.lg, gap: Spacing.sm },

    // Buscador
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      borderRadius: Radius.input,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      paddingHorizontal: Spacing.md,
      minHeight: 48,
      ...Shadow.sm,
    },
    searchIcon: { fontSize: Typography.base },
    searchInput: {
      flex: 1,
      fontSize: Typography.base,
      color: c.text,
      minHeight: 48,
    },

    // Filas de cliente
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm + 4,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    rowMain: { flex: 1, gap: 3 },
    rowTitle: { fontSize: Typography.md, fontWeight: FontWeight.semibold, color: c.text },
    rowSubtitle: { fontSize: Typography.sm, color: c.textMuted },

    // Carga más
    loadMore: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
    loadMoreText: { color: c.primary, fontWeight: FontWeight.semibold },

    // Vacío
    emptyBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { fontSize: Typography.lg, fontWeight: FontWeight.bold, color: c.text },
    emptySubtitle: { textAlign: 'center', color: c.textMuted, fontSize: Typography.sm },
    emptyButton: {
      backgroundColor: c.primary,
      borderRadius: Radius.button,
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
      ...Shadow.md,
    },
    emptyButtonText: { color: c.onPrimary, fontWeight: FontWeight.bold },

    // FAB
    fab: {
      position: 'absolute',
      bottom: Spacing.lg,
      right: Spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.lg,
    },
    fabText: { color: '#FFF', fontSize: 28, fontWeight: '700', lineHeight: 32 },

    // Error
    error: { color: c.danger, textAlign: 'center', padding: Spacing.md },
  });
