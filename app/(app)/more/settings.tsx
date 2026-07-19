import { Alert, Pressable, View } from 'react-native';
import type { SfSymbols } from 'rn-icon-mapper';

import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { useAuth } from '@/Modules/auth/context';
import { useColorScheme } from '@/lib/useColorScheme';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const notReady = (feature: string) =>
    Alert.alert(feature, "This isn't wired up to the backend yet.");

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently removes your studio profile and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => notReady('Delete account'),
        },
      ],
    );
  };

  return (
    <View className="flex-1 gap-4 bg-background p-4">
      <View className="overflow-hidden rounded-xl border border-border bg-card">
        <SettingsRow label="Email" value={user?.email} />
        <SettingsRow label="Phone" value={user?.phone ?? '—'} last />
      </View>

      <View className="overflow-hidden rounded-xl border border-border bg-card">
        <SettingsAction
          icon="lock.fill"
          label="Change password"
          onPress={() => notReady('Change password')}
        />
        <SettingsAction
          icon="globe"
          label="Language"
          value="English"
          onPress={() => notReady('Language')}
        />
        <SettingsAction
          icon="bell.fill"
          label="Notification preferences"
          onPress={() => notReady('Notification preferences')}
          last
        />
      </View>

      <Pressable
        onPress={signOut}
        className="items-center rounded-xl border border-border bg-card py-3">
        <Text className="font-medium text-destructive">Sign out</Text>
      </Pressable>

      <Pressable onPress={onDeleteAccount} className="items-center py-2">
        <Text variant="footnote" className="text-destructive">
          Delete account
        </Text>
      </Pressable>
    </View>
  );
}

function SettingsRow({ label, value, last }: { label: string; value?: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between p-4 ${last ? '' : 'border-b border-border'}`}>
      <Text variant="footnote" color="tertiary">
        {label}
      </Text>
      <Text variant="subhead">{value}</Text>
    </View>
  );
}

function SettingsAction({
  icon,
  label,
  value,
  onPress,
  last,
}: {
  icon: SfSymbols;
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { colors } = useColorScheme();
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 p-4 ${last ? '' : 'border-b border-border'}`}>
      <Icon name={icon} size={18} color={colors.foreground} />
      <Text variant="subhead" className="flex-1">
        {label}
      </Text>
      {value ? (
        <Text variant="subhead" color="tertiary">
          {value}
        </Text>
      ) : null}
      <Icon name="chevron.right" size={14} color={colors.grey} />
    </Pressable>
  );
}
