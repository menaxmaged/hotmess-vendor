import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function MoreStackLayout() {
  const { t } = useTranslation('more');
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('nav.more') }} />
      <Stack.Screen name="profile" options={{ title: t('nav.profile') }} />
      <Stack.Screen name="automation" options={{ title: t('nav.automation') }} />
      <Stack.Screen name="team" options={{ headerShown: false }} />
      <Stack.Screen name="ads" options={{ title: t('nav.ads') }} />
      <Stack.Screen name="premium" options={{ title: t('nav.premium') }} />
      <Stack.Screen name="settings" options={{ title: t('nav.settings') }} />
      <Stack.Screen name="change-password" options={{ title: t('nav.changePassword') }} />
      <Stack.Screen name="onboarding-checklist" options={{ title: t('nav.checklist') }} />
      <Stack.Screen name="saved-replies" options={{ title: t('nav.savedReplies') }} />
      <Stack.Screen name="notifications" options={{ title: t('nav.notifications') }} />
      <Stack.Screen name="notification-preferences" options={{ title: t('nav.notificationPreferences') }} />
    </Stack>
  );
}
