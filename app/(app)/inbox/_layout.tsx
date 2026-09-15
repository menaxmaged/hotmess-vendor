import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function InboxStackLayout() {
  const { t } = useTranslation('inbox');
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('nav.inbox') }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
    </Stack>
  );
}
