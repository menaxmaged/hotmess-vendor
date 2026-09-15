import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { useAuth } from '@/Modules/auth/context';
import { useColorScheme } from '@/lib/useColorScheme';

export function AccountTab() {
  const { user } = useAuth();
  const { t } = useTranslation('studio');
  const router = useRouter();
  const { colors } = useColorScheme();

  return (
    <View className="gap-4 p-4">
      <View className="overflow-hidden rounded-xl border border-border bg-card">
        <View className="flex-row items-center justify-between border-b border-border p-4">
          <Text variant="footnote" color="tertiary">
            {t('account.email')}
          </Text>
          <Text variant="subhead">{user?.email}</Text>
        </View>
        <View className="flex-row items-center justify-between p-4">
          <Text variant="footnote" color="tertiary">
            {t('account.phone')}
          </Text>
          <Text variant="subhead">{user?.phone ?? '—'}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/(app)/more/settings')}
        className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Icon name="gearshape.fill" size={18} color={colors.foreground} />
        <Text variant="subhead" className="flex-1">
          {t('account.settingsLink')}
        </Text>
        <Icon name="chevron.right" size={14} color={colors.grey} />
      </Pressable>
    </View>
  );
}
