import { Stack } from 'expo-router';

export default function MoreStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'More' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile & Settings' }} />
      <Stack.Screen name="automation" options={{ title: 'Automation' }} />
      <Stack.Screen name="auto-assign" options={{ title: 'Auto-Assign Rules' }} />
      <Stack.Screen name="team" options={{ headerShown: false }} />
      <Stack.Screen name="ads" options={{ title: 'Sponsored Ads' }} />
      <Stack.Screen name="premium" options={{ title: 'Subscription & Premium' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
