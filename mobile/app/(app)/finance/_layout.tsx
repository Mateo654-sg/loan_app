import { Stack } from 'expo-router';

export default function FinanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Finanzas' }} />
      <Stack.Screen name="new-transaction" options={{ title: 'New transaction' }} />
      <Stack.Screen name="categories" options={{ title: 'Categories' }} />
      <Stack.Screen name="goals" options={{ title: 'Goals' }} />
    </Stack>
  );
}
