import { Stack } from 'expo-router';

export default function InboxStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Inbox' }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
    </Stack>
  );
}
