import { Tabs } from 'expo-router';

/**
 * Bottom navigation per PRODUCT_SPECIFICATION.md §31.
 * Only implemented sections are exposed; the Más tab arrives with
 * Reports/Settings (Phase 9+).
 */
export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="finance" options={{ title: 'Finanzas' }} />
      <Tabs.Screen name="loans" options={{ title: 'Préstamos' }} />
      <Tabs.Screen name="clients" options={{ title: 'Clientes' }} />
    </Tabs>
  );
}
