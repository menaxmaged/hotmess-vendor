import { useActionSheet } from '@expo/react-native-action-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { StudioStatusBanner } from '@/components/StudioStatusBanner';
import { getErrorMessage } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/format';
import { useColorScheme } from '@/lib/useColorScheme';
import { useAuth } from '@/Modules/auth/context';
import { StatusPill } from '@/Modules/inbox/components/StatusPill';
import {
    useAssignChat,
    useChats,
    useConversationCounts,
    useToggleArchive,
    useTogglePin,
    useUpdateChatStatus,
} from '@/Modules/inbox/hooks';
import { STATUS_ORDER } from '@/Modules/inbox/status';
import type { AssigneeBucket, AssigneeFilter, ChatSummary, LeadStatus, SortOption } from '@/Modules/inbox/types';
import { useTeamOverview } from '@/Modules/team/hooks';

const SORT_OPTIONS: SortOption[] = ['recent', 'unread', 'follow_up', 'amount'];

export default function InboxListScreen() {
  const router = useRouter();
  const { t } = useTranslation(['inbox', 'common']);
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
  const { data: counts } = useConversationCounts();
  const { data: teamOverview } = useTeamOverview();
  const { user } = useAuth();

  const togglePin = useTogglePin();
  const toggleArchive = useToggleArchive();
  const assignChat = useAssignChat();
  const updateStatus = useUpdateChatStatus();

  const activeMembers = (teamOverview?.members ?? []).filter((m) => m.status === 'active');
  const myMemberId = user ? String(user.id) : undefined;

  // Filter-chip counts come from the real per-status/per-assignee endpoint,
  // not by counting the (possibly filtered) fetched chat list. Chip labels
  // are real team member names (from Modules/team), not the generic "Team
  // member" the old client-side bucket builder had no way to resolve.
  const buckets: AssigneeBucket[] = counts
    ? [
        { id: 'all', label: t('list.all'), count: counts.total },
        { id: 'me', label: t('list.me'), count: myMemberId ? (counts.byAssignee[myMemberId] ?? 0) : 0 },
        ...activeMembers
          .filter((m) => m.id !== myMemberId && (counts.byAssignee[m.id] ?? 0) > 0)
          .map((m) => ({ id: m.id, label: m.name, count: counts.byAssignee[m.id] ?? 0 })),
        { id: 'unassigned', label: t('list.unassigned'), count: counts.byAssignee.unassigned ?? 0 },
      ]
    : [
        { id: 'all' as AssigneeFilter, label: t('list.all'), count: 0 },
        { id: 'me' as AssigneeFilter, label: t('list.me'), count: 0 },
        { id: 'unassigned' as AssigneeFilter, label: t('list.unassigned'), count: 0 },
      ];

  const hasActiveFilter = sort !== 'recent' || !!status;

  const openStatusSheet = (chat: ChatSummary) => {
    const options = [...STATUS_ORDER.map((s) => t(`status.${s}`)), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('list.changeStatus') },
      (index) => {
        if (index === undefined || index === options.length - 1) return;
        updateStatus.mutate({ chatId: chat.id, status: STATUS_ORDER[index] });
      },
    );
  };

  const openAssignSheet = (chat: ChatSummary) => {
    // Full active roster, not derived from `buckets` — a member with zero
    // currently-assigned leads has no bucket (buckets only show assignees
    // that already occur), but must still be a valid assign target.
    const options = [t('list.unassign'), ...activeMembers.map((m) => m.name), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('list.assignTo') },
      (index) => {
        if (index === undefined || index === options.length - 1) return;
        const assigneeId = index === 0 ? null : activeMembers[index - 1]!.id;
        assignChat.mutate({ chatId: chat.id, assigneeId });
      },
    );
  };

  const openSortFilterSheet = () => {
    const sortOptions = SORT_OPTIONS.map((o) => t(`sort.${o}`));
    const options = [...sortOptions, t('list.filterByStatusEllipsis'), t('list.clearAll'), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('list.sortFilter') },
      (index) => {
        if (index === undefined) return;
        if (index < sortOptions.length) {
          setSort(SORT_OPTIONS[index]!);
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
    const options = [t('list.allStatuses'), ...STATUS_ORDER.map((s) => t(`status.${s}`)), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('list.filterByStatus') },
      (index) => {
        if (index === undefined || index === options.length - 1) return;
        setStatus(index === 0 ? undefined : STATUS_ORDER[index - 1]);
      },
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="gap-3 border-b border-border px-4 pb-3 pt-2">
        <StudioStatusBanner />
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Icon name="magnifyingglass" size={18} color={colors.grey} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t('list.searchPlaceholder')}
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
            {t('list.sortFilter')}
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
            <Text className="text-primary">{t('common:actions.retry')}</Text>
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
                {t('list.emptyTitle')}
              </Text>
              <Text variant="footnote" color="tertiary" className="text-center">
                {t('list.emptyBody')}
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
  const { t } = useTranslation('inbox');
  return (
    <Swipeable
      renderRightActions={() => (
        <View className="flex-row">
          <SwipeAction label={chat.pinned ? t('list.unpin') : t('list.pin')} onPress={onTogglePin} className="bg-amber-500" />
          <SwipeAction label={t('list.assign')} onPress={onAssign} className="bg-blue-500" />
          <SwipeAction
            label={chat.archived ? t('list.unarchive') : t('list.archive')}
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
                    {t('list.followUp', { when: formatRelativeTime(chat.followUpDate) })}
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
