import { Image, ScrollView, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { formatDateTime } from '@/lib/format';
import { useConnectInstagram, useDisconnectInstagram } from '@/Modules/profile/hooks';
import type { InstagramStatus } from '@/Modules/profile/types';

export function InstagramTab({ status }: { status: InstagramStatus }) {
  const connect = useConnectInstagram();
  const disconnect = useDisconnectInstagram();

  if (!status.connected) {
    return (
      <View className="gap-4 p-4">
        <View className="gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <View className="flex-row items-center gap-2">
            <Icon name="exclamationmark" size={16} color="#B45309" />
            <Text variant="subhead" className="font-medium text-amber-800 dark:text-amber-300">
              Instagram not connected
            </Text>
          </View>
          <Text variant="caption1" className="text-amber-700 dark:text-amber-400">
            Connect your Instagram to automatically pull portfolio images and boost your profile
            completeness score.
          </Text>
        </View>
        <Button onPress={() => connect.mutate()} disabled={connect.isPending}>
          <Text>{connect.isPending ? 'Connecting…' : 'Connect Instagram'}</Text>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="gap-4 p-4">
      <View className="gap-1 rounded-xl border border-border bg-card p-4">
        <View className="flex-row items-center justify-between">
          <Text variant="subhead" className="font-semibold">
            {status.username ? `@${status.username}` : 'Connected'}
          </Text>
          <View className="flex-row items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 dark:bg-green-950">
            <Icon name="checkmark.circle.fill" size={12} color="#16A34A" />
            <Text variant="caption2" className="font-medium text-green-700 dark:text-green-300">
              Synced
            </Text>
          </View>
        </View>
        {status.lastSyncAt ? (
          <Text variant="caption1" color="tertiary">
            {`Last synced ${formatDateTime(status.lastSyncAt)}`}
          </Text>
        ) : null}
      </View>

      {status.portfolioImages.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {status.portfolioImages.map((uri) => (
            <Image key={uri} source={{ uri }} className="h-28 w-[31%] rounded-lg bg-muted" />
          ))}
        </View>
      ) : (
        <Text variant="footnote" color="tertiary">
          No portfolio images synced yet.
        </Text>
      )}

      <Button variant="secondary" onPress={() => disconnect.mutate()} disabled={disconnect.isPending}>
        <Text>{disconnect.isPending ? 'Disconnecting…' : 'Disconnect Instagram'}</Text>
      </Button>
    </ScrollView>
  );
}
