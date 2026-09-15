import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TeamStackLayout() {
  const { t } = useTranslation('more');
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('nav.team') }} />
      <Stack.Screen name="invite" options={{ title: t('nav.invite'), presentation: 'modal' }} />
      <Stack.Screen name="role/[id]" options={{ title: t('nav.role') }} />
    </Stack>
  );
}
