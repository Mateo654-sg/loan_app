import { Stack } from 'expo-router';

export default function LoansLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Préstamos' }} />
      <Stack.Screen name="new" options={{ title: 'New loan' }} />
      <Stack.Screen name="[id]" options={{ title: 'Loan' }} />
      <Stack.Screen name="collections" options={{ title: "Today's collections" }} />
    </Stack>
  );
}
