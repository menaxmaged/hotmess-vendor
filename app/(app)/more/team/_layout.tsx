import { Stack } from 'expo-router';

export default function TeamStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Team & Roles' }} />
      <Stack.Screen name="invite" options={{ title: 'Invite Member', presentation: 'modal' }} />
      <Stack.Screen name="role/[id]" options={{ title: 'Role' }} />
    </Stack>
  );
}
