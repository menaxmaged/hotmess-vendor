import { Image, ScrollView, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { formatDateTime } from '@/lib/format';
import { getErrorMessage } from '@/lib/api-client';
import {
    useConnectInstagram,
    useDisconnectInstagram,
    useInstagramConnection,
    useInstagramPortfolio,
} from '@/Modules/instagram/hooks';
import { isInstagramOAuthConfigured } from '@/Modules/instagram/oauth';

export function InstagramTab({ vendorId }: { vendorId: string }) {
  const { data: status, isLoading, isError, error } = useInstagramConnection();

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
    return <DisconnectedState configured={status.configured} />;
  }

  return <ConnectedState vendorId={vendorId} igUserId={status.igUserId} lastSyncAt={status.lastSyncAt} />;
}

function DisconnectedState({ configured }: { configured: boolean }) {
  const connect = useConnectInstagram();
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
      {!configured || !oauthReady ? (
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

function ConnectedState({
  vendorId,
  igUserId,
  lastSyncAt,
}: {
  vendorId: string;
  igUserId: string | null;
  lastSyncAt: string | null;
}) {
  const disconnect = useDisconnectInstagram();
  const { data: grid, isLoading: gridLoading, isError: gridError } = useInstagramPortfolio(vendorId);

  return (
    <ScrollView contentContainerClassName="gap-4 p-4">
      <View className="gap-1 rounded-xl border border-border bg-card p-4">
        <View className="flex-row items-center justify-between">
          <Text variant="subhead" className="font-semibold">
            {igUserId ? `IG user ${igUserId}` : 'Connected'}
          </Text>
          <View className="flex-row items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 dark:bg-green-950">
            <Icon name="checkmark.circle.fill" size={12} color="#16A34A" />
            <Text variant="caption2" className="font-medium text-green-700 dark:text-green-300">
              Synced
            </Text>
          </View>
        </View>
        {lastSyncAt ? (
          <Text variant="caption1" color="tertiary">
            {`Last synced ${formatDateTime(lastSyncAt)}`}
          </Text>
        ) : null}
      </View>

      {gridLoading ? (
        <ActivityIndicator />
      ) : gridError ? (
        <Text variant="footnote" color="tertiary">
          Couldn&apos;t load the portfolio grid right now.
        </Text>
      ) : grid && grid.posts.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {grid.posts.map((post) => (
            <Image
              key={post.id}
              source={{ uri: post.thumbnailUrl ?? post.mediaUrl }}
              className="h-28 w-[31%] rounded-lg bg-muted"
            />
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
