import { Stack } from 'expo-router';
import { usePalette } from '@/hooks/use-palette';
import { FontWeight, Typography } from '@/constants/tokens';

export default function FinanceLayout() {
  const c = usePalette();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: c.surface },
        headerShadowVisible: false,
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: FontWeight.bold as any, fontSize: Typography.md, color: c.text },
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: c.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Finanzas', headerTitle: 'Finanzas' }} />
      <Stack.Screen name="new-transaction" options={{ title: 'Nuevo movimiento', headerTitle: 'Nuevo movimiento' }} />
      <Stack.Screen name="categories" options={{ title: 'Categorías', headerTitle: 'Categorías' }} />
      <Stack.Screen name="goals" options={{ title: 'Metas', headerTitle: 'Metas' }} />
    </Stack>
  );
}
