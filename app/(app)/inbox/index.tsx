import { useActionSheet } from '@expo/react-native-action-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { getErrorMessage } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/format';
import { useColorScheme } from '@/lib/useColorScheme';
import { StatusPill } from '@/Modules/inbox/components/StatusPill';
import {
    useAssignChat,
    useChats,
    useToggleArchive,
    useTogglePin,
    useUpdateChatStatus,
} from '@/Modules/inbox/hooks';
import { STATUS_META, STATUS_ORDER } from '@/Modules/inbox/status';
import type { AssigneeFilter, ChatSummary, LeadStatus, SortOption } from '@/Modules/inbox/types';

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Most recent',
  unread: 'Unread first',
  follow_up: 'Follow-up due',
  amount: 'Amount high→low',
};

export default function InboxListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ assignee?: string }>();
  const { colors } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [assignee, setAssignee] = useState<AssigneeFilter>(params.assignee ?? 'all');
  const [status, setStatus] = useState<LeadStatus | undefined>(undefined);
  const [sort, setSort] = useState<SortOption>('recent');

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useChats({
    assignee,
    status,
    sort,
    search: search || undefined,
  });

  const togglePin = useTogglePin();
  const toggleArchive = useToggleArchive();
  const assignChat = useAssignChat();
  const updateStatus = useUpdateChatStatus();

  const buckets = data?.assigneeBuckets ?? [
    { id: 'all' as AssigneeFilter, label: 'All', count: 0 },
    { id: 'me' as AssigneeFilter, label: 'Me', count: 0 },
    { id: 'unassigned' as AssigneeFilter, label: 'Unassigned', count: 0 },
  ];

  const hasActiveFilter = sort !== 'recent' || !!status;

  const openStatusSheet = (chat: ChatSummary) => {
    const options = [...STATUS_ORDER.map((s) => STATUS_META[s].label), 'Cancel'];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: 'Change status' },
      (index) => {
        if (index === undefined || index === options.length - 1) return;
        updateStatus.mutate({ chatId: chat.id, status: STATUS_ORDER[index] });
      },
    );
  };

  const openAssignSheet = (chat: ChatSummary) => {
    const members = buckets.filter((b) => b.id !== 'all' && b.id !== 'me' && b.id !== 'unassigned');
    const options = ['Unassign', ...members.map((m) => m.label), 'Cancel'];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: 'Assign to' },
      (index) => {
        if (index === undefined || index === options.length - 1) return;
        const assigneeId = index === 0 ? null : members[index - 1]!.id;
        assignChat.mutate({ chatId: chat.id, assigneeId });
      },
    );
  };

  const openSortFilterSheet = () => {
    const sortOptions = Object.values(SORT_LABELS);
    const options = [...sortOptions, 'Filter by status…', 'Clear all', 'Cancel'];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: 'Sort & filter' },
      (index) => {
        if (index === undefined) return;
        if (index < sortOptions.length) {
          setSort(Object.keys(SORT_LABELS)[index] as SortOption);
          return;
        }
        if (index === sortOptions.length) {
          openStatusFilterSheet();
          return;
        }
        if (index === sortOptions.length + 1) {
          setSort('recent');
          setStatus(undefined);
          setSearchInput('');
        }
      },
    );
  };

  const openStatusFilterSheet = () => {
    const options = ['All statuses', ...STATUS_ORDER.map((s) => STATUS_META[s].label), 'Cancel'];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: 'Filter by status' },
      (index) => {
        if (index === undefined || index === options.length - 1) return;
        setStatus(index === 0 ? undefined : STATUS_ORDER[index - 1]);
      },
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="gap-3 border-b border-border px-4 pb-3 pt-2">
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Icon name="magnifyingglass" size={18} color={colors.grey} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search brides, occasion, city…"
            placeholderTextColor={colors.grey}
            className="h-10 flex-1 text-foreground"
          />
        </View>

        <View className="flex-row items-center gap-2">
          <FlatList
            data={buckets}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(b) => b.id}
            contentContainerClassName="gap-2"
            renderItem={({ item }) => {
              const selected = item.id === assignee;
              return (
                <Pressable
                  onPress={() => setAssignee(item.id)}
                  className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                    selected ? 'border-primary bg-primary' : 'border-border bg-card'
                  }`}>
                  <Text
                    variant="caption1"
                    className={`font-medium ${selected ? 'text-white' : 'text-foreground'}`}>
                    {item.label}
                  </Text>
                  <Text
                    variant="caption2"
                    className={selected ? 'text-white/80' : 'text-muted-foreground'}>
                    {item.count}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        <Pressable
          onPress={openSortFilterSheet}
          className={`flex-row items-center gap-1.5 self-start rounded-full border px-3 py-1.5 ${
            hasActiveFilter ? 'border-primary' : 'border-border'
          }`}>
          <Icon name="line.3.horizontal" size={16} color={colors.foreground} />
          <Text variant="caption1" className="font-medium">
            Sort & filter
          </Text>
          {hasActiveFilter ? <View className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-2 p-6">
          <Text color="tertiary" className="text-center">
            {getErrorMessage(error)}
          </Text>
          <Pressable onPress={() => refetch()}>
            <Text className="text-primary">Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data?.chats ?? []}
          keyExtractor={(chat) => chat.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          ItemSeparatorComponent={() => <View className="h-px bg-border" />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-1 p-12">
              <Text variant="subhead" className="text-center font-medium">
                No chats match your filters
              </Text>
              <Text variant="footnote" color="tertiary" className="text-center">
                Try clearing your filters or search.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ChatRow
              chat={item}
              onPress={() => router.push(`/(app)/inbox/${item.id}`)}
              onTogglePin={() => togglePin.mutate({ chatId: item.id, pinned: !item.pinned })}
              onAssign={() => openAssignSheet(item)}
              onToggleArchive={() =>
                toggleArchive.mutate({ chatId: item.id, archived: !item.archived })
              }
              onChangeStatus={() => openStatusSheet(item)}
            />
          )}
        />
      )}
    </View>
  );
}

function ChatRow({
  chat,
  onPress,
  onTogglePin,
  onAssign,
  onToggleArchive,
  onChangeStatus,
}: {
  chat: ChatSummary;
  onPress: () => void;
  onTogglePin: () => void;
  onAssign: () => void;
  onToggleArchive: () => void;
  onChangeStatus: () => void;
}) {
  return (
    <Swipeable
      renderRightActions={() => (
        <View className="flex-row">
          <SwipeAction label={chat.pinned ? 'Unpin' : 'Pin'} onPress={onTogglePin} className="bg-amber-500" />
          <SwipeAction label="Assign" onPress={onAssign} className="bg-blue-500" />
          <SwipeAction
            label={chat.archived ? 'Unarchive' : 'Archive'}
            onPress={onToggleArchive}
            className="bg-neutral-500"
          />
        </View>
      )}>
      <Pressable onPress={onPress} className="gap-2 bg-background px-4 py-3 active:opacity-70">
        <View className="flex-row items-start gap-3">
          <InitialsAvatar name={chat.brideName} />
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center justify-between gap-2">
              <Text variant="subhead" className="flex-1 font-semibold" numberOfLines={1}>
                {chat.brideName}
              </Text>
              <Text variant="caption2" color="tertiary">
                {formatRelativeTime(chat.lastMessageAt)}
              </Text>
            </View>
            <Text variant="caption1" color="tertiary" numberOfLines={1}>
              {[chat.occasionType, chat.eventDate, chat.city].filter(Boolean).join(' · ')}
            </Text>
            <View className="flex-row items-center justify-between gap-2 pt-1">
              <Text variant="footnote" color="tertiary" className="flex-1" numberOfLines={1}>
                {chat.lastMessagePreview}
              </Text>
              {chat.unreadCount > 0 ? (
                <View className="h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5">
                  <Text variant="caption2" className="font-semibold text-white">
                    {chat.unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row items-center justify-between gap-2 pt-1">
              <StatusPill status={chat.status} onPress={onChangeStatus} />
              <View className="flex-row items-center gap-1.5">
                {chat.followUpDate ? (
                  <Text variant="caption2" className="text-amber-600 dark:text-amber-400">
                    {`Follow up ${formatRelativeTime(chat.followUpDate)}`}
                  </Text>
                ) : null}
                {chat.assignee ? <InitialsAvatar name={chat.assignee.name} size={20} /> : null}
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
}

function SwipeAction({
  label,
  onPress,
  className,
}: {
  label: string;
  onPress: () => void;
  className: string;
}) {
  return (
    <Pressable onPress={onPress} className={`w-20 items-center justify-center ${className}`}>
      <Text variant="caption1" className="font-medium text-white">
        {label}
      </Text>
    </Pressable>
  );
}
