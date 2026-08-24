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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useInfiniteClients } from '@/features/clients/queries';
import type { ClientDto } from '@/features/clients/types';

export default function ClientsScreen() {
  const c = usePalette();
  const styles = makeStyles(c);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const clients = useInfiniteClients(
    submittedSearch ? { search: submittedSearch } : {},
  );
  const allItems = clients.data?.pages.flatMap((page) => page.items) ?? [];

  const renderItem = ({ item }: { item: ClientDto }) => (
    <Link href={`/(app)/clients/${item.id}`} asChild>
      <Pressable style={styles.row}>
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>{item.full_name}</Text>
          <Text style={styles.rowSubtitle}>
            {[item.document_number, item.phone].filter(Boolean).join(' · ') || '—'}
          </Text>
        </View>
        <Text
          style={[
            styles.badge,
            {
              color: item.status === 'ACTIVE' ? c.success : c.border,
              borderColor: item.status === 'ACTIVE' ? c.success : c.border,
            },
          ]}
        >
          {item.status}
        </Text>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => setSubmittedSearch(searchText.trim())}
          placeholder="Search by name, document or phone..."
          placeholderTextColor={c.textMuted}
          returnKeyType="search"
        />

        {clients.isPending ? (
          <ActivityIndicator style={{ padding: Spacing.lg }} />
        ) : clients.isError ? (
          <Text style={styles.error}>Could not load customers. Check the backend and retry.</Text>
        ) : allItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No customers yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first customer to start managing loans.
            </Text>
            <Link href="/(app)/clients/new" asChild>
              <Pressable style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>+ New customer</Text>
              </Pressable>
            </Link>
          </View>
        ) : null}

        {allItems.length > 0 ? (
          <FlatList
            data={allItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListFooterComponent={
              clients.hasNextPage ? (
                <Pressable
                  style={styles.loadMore}
                  onPress={() => void clients.fetchNextPage()}
                  disabled={clients.isFetchingNextPage}
                >
                  <Text style={styles.loadMoreText}>
                    {clients.isFetchingNextPage ? 'Loading…' : 'Load more'}
                  </Text>
                </Pressable>
              ) : null
            }
          />
        ) : null}

        {allItems.length > 0 || clients.isPending ? (
          <Link href="/(app)/clients/new" asChild>
            <Pressable style={styles.fab}>
              <Text style={styles.fabText}>+ New customer</Text>
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
  container: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  searchInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '500' },
  rowSubtitle: { fontSize: 13, opacity: c.mutedOpacity },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 3,
  },
  loadMore: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  loadMoreText: { color: c.primary, fontWeight: '600' },
  emptyBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySubtitle: { textAlign: 'center', opacity: 0.6 },
  emptyButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  emptyButtonText: { color: c.onPrimary, fontWeight: '600' },
  fab: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: c.onPrimary, fontWeight: '700' },
  error: { color: c.danger, textAlign: 'center', padding: Spacing.md },
});;
