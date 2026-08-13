import { ScrollView, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { formatDateTime } from '@/lib/format';
import { getErrorMessage } from '@/lib/api-client';
import { useConnectInstagram, useDisconnectInstagram, useInstagramConnection } from '@/Modules/instagram/hooks';
import { isInstagramOAuthConfigured } from '@/Modules/instagram/oauth';

export function InstagramTab() {
  const { data: status, isLoading, isError, error } = useInstagramConnection();
  const connect = useConnectInstagram();
  const disconnect = useDisconnectInstagram();

  if (isLoading) {
    return (
      <View className="items-center justify-center p-10">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !status) {
    return (
      <View className="gap-2 p-4">
        <Text color="tertiary">{getErrorMessage(error)}</Text>
      </View>
    );
  }

  if (!status.connected) {
    const oauthReady = isInstagramOAuthConfigured();
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
        {!status.configured || !oauthReady ? (
          <Text variant="caption2" color="tertiary">
            Instagram connect isn&apos;t fully set up on this build yet — missing{' '}
            {!oauthReady ? 'the app client ID' : "the backend's Meta app registration"}. The
            button below will show a clear error rather than pretend to connect.
          </Text>
        ) : null}
        {connect.isError ? (
          <Text variant="footnote" className="text-destructive">
            {getErrorMessage(connect.error)}
          </Text>
        ) : null}
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
            {status.igUserId ? `IG user ${status.igUserId}` : 'Connected'}
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

      <Text variant="footnote" color="tertiary">
        Portfolio grid preview isn&apos;t wired yet — that&apos;s a separate endpoint
        (`GET /vendors/{'{id}'}/instagram-posts`), not part of this connection check.
      </Text>

      <Button variant="secondary" onPress={() => disconnect.mutate()} disabled={disconnect.isPending}>
        <Text>{disconnect.isPending ? 'Disconnecting…' : 'Disconnect Instagram'}</Text>
      </Button>
    </ScrollView>
  );
}
