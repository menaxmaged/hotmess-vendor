import type { Href } from 'expo-router';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { ErrorState, LoadingState, SegmentedRange } from '@/components/brand';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { openDeepLink, resolveDeepLink } from '@/lib/deep-link';
import { formatRelativeTime } from '@/lib/format';
import { useColorScheme } from '@/lib/useColorScheme';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationUnreadCount,
  useNotifications,
} from '@/Modules/notifications/hooks';
import type { AppNotification } from '@/Modules/notifications/types';

type Filter = 'all' | 'unread';

const FILTERS: Filter[] = ['all', 'unread'];

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation('studio');
  const { colors } = useColorScheme();
  const [filter, setFilter] = useState<Filter>('all');
  const filters = FILTERS.map((key) => ({ key, label: t(`notifications.filters.${key}`) }));
  const query = useNotifications(filter === 'unread');
  const { data: unread = 0 } = useNotificationUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = query.data?.pages.flatMap((p) => p.notifications) ?? [];

  const onPressItem = (item: AppNotification) => {
    if (!item.readAt) markRead.mutate(item.id);
    openDeepLink(item.deepLink);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerRight: () =>
            unread > 0 ? (
              <Pressable onPress={() => markAll.mutate()} disabled={markAll.isPending} className="px-2">
                <Text variant="subhead" className="font-semibold text-primary">
                  {markAll.isPending ? t('notifications.marking') : t('notifications.markAll')}
                </Text>
              </Pressable>
            ) : null,
        }}
      />

      <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
        <SegmentedRange value={filter} options={filters} onChange={setFilter} />
        <Pressable onPress={() => router.push('/(app)/more/notification-preferences' as Href)} className="p-1">
          <Icon name="gearshape.fill" size={18} color={colors.grey} />
        </Pressable>
      </View>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerClassName="gap-2 px-4 pb-8 pt-1"
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator /> : null}
          ListEmptyComponent={
            <View className="items-center gap-2 py-16">
              <Icon name="bell.fill" size={28} color={colors.grey} />
              <Text variant="footnote" color="tertiary">
                {filter === 'unread' ? t('notifications.caughtUp') : t('notifications.empty')}
              </Text>
            </View>
          }
          renderItem={({ item }) => <NotificationRow item={item} onPress={() => onPressItem(item)} />}
        />
      )}
    </View>
  );
}

function NotificationRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const { colors } = useColorScheme();
  const unread = !item.readAt;
  const navigable = !!resolveDeepLink(item.deepLink);
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row gap-3 rounded-xl border p-3.5 ${unread ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
      <View className="pt-1.5">
        <View className={`h-2 w-2 rounded-full ${unread ? 'bg-primary' : 'bg-transparent'}`} />
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-baseline justify-between gap-2">
          <Text variant="subhead" className={`flex-1 ${unread ? 'font-bold' : 'font-medium'}`} numberOfLines={1}>
            {item.title}
          </Text>
          <Text variant="caption2" color="tertiary">
            {formatRelativeTime(item.sentAt ?? item.createdAt)}
          </Text>
        </View>
        <Text variant="footnote" color="tertiary" numberOfLines={3}>
          {item.body}
        </Text>
      </View>
      {navigable ? (
        <View className="justify-center">
          <Icon name="chevron.right" size={14} color={colors.grey} />
        </View>
      ) : null}
    </Pressable>
  );
}
