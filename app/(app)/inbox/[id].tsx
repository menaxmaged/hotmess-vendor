import { useActionSheet } from '@expo/react-native-action-sheet';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { useColorScheme } from '@/lib/useColorScheme';
import { StatusPill } from '@/Modules/inbox/components/StatusPill';
import { useAddNote, useChat, useSendMessage, useUpdateChatStatus } from '@/Modules/inbox/hooks';
import { STATUS_META, STATUS_ORDER } from '@/Modules/inbox/status';
import type { BrideDetail, ChatSummary, Message } from '@/Modules/inbox/types';

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const { data, isLoading, isError, error } = useChat(id);
  const sendMessage = useSendMessage(id ?? '');
  const addNote = useAddNote();
  const updateStatus = useUpdateChatStatus();

  const [showDetails, setShowDetails] = useState(false);
  const [draft, setDraft] = useState('');
  const [isNote, setIsNote] = useState(false);

  const onSend = () => {
    const text = draft.trim();
    if (!text || !id) return;
    setDraft('');
    if (isNote) {
      addNote.mutate({ chatId: id, note: text });
    } else {
      sendMessage.mutate({ text });
    }
  };

  const openStatusSheet = () => {
    if (!id) return;
    const options = [...STATUS_ORDER.map((s) => STATUS_META[s].label), 'Cancel'];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: 'Change status' },
      (index) => {
        if (index === undefined || index === options.length - 1) return;
        updateStatus.mutate({ chatId: id, status: STATUS_ORDER[index] });
      },
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text color="tertiary">{error ? getErrorMessage(error) : 'Chat not found'}</Text>
      </View>
    );
  }

  const { chat, bride, messages } = data;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: chat.brideName,
          headerRight: () => (
            <Pressable onPress={() => setShowDetails((v) => !v)} className="p-2">
              <Icon name="info.circle" color={colors.foreground} />
            </Pressable>
          ),
        }}
      />

      {showDetails ? (
        <BrideDetailPanel bride={bride} chat={chat} onChangeStatus={openStatusSheet} />
      ) : null}

      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(m) => m.id}
        contentContainerClassName="gap-2 p-4"
        renderItem={({ item }) => <MessageBubble message={item} />}
      />

      <KeyboardStickyView>
        <View className="flex-row items-end gap-2 border-t border-border bg-background p-3">
          <Pressable
            onPress={() => setIsNote((v) => !v)}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              isNote ? 'bg-amber-500' : 'bg-muted'
            }`}>
            <Icon name="note.text" size={18} color={isNote ? '#fff' : colors.foreground} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={isNote ? 'Add an internal note…' : 'Message…'}
            placeholderTextColor={colors.grey}
            multiline
            className="max-h-28 flex-1 rounded-2xl border border-border bg-card px-4 py-2.5 text-foreground"
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim()}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              draft.trim() ? 'bg-primary' : 'bg-muted'
            }`}>
            <Icon name="arrow.up" size={18} color={draft.trim() ? '#fff' : colors.grey} />
          </Pressable>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.isNote) {
    return (
      <View className="self-center rounded-lg bg-amber-100 px-3 py-2 dark:bg-amber-950">
        <Text variant="caption1" className="text-amber-800 dark:text-amber-300">
          {message.text}
        </Text>
      </View>
    );
  }

  const isVendor = message.sender === 'vendor';
  return (
    <View
      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
        isVendor ? 'self-end bg-primary' : 'self-start border border-border bg-card'
      }`}>
      <Text className={isVendor ? 'text-white' : 'text-foreground'}>{message.text}</Text>
      <Text
        variant="caption2"
        className={`mt-1 ${isVendor ? 'text-white/70' : 'text-muted-foreground'}`}>
        {formatDateTime(message.createdAt)}
      </Text>
    </View>
  );
}

function BrideDetailPanel({
  bride,
  chat,
  onChangeStatus,
}: {
  bride: BrideDetail;
  chat: ChatSummary;
  onChangeStatus: () => void;
}) {
  return (
    <View className="gap-3 border-b border-border bg-card p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <InitialsAvatar name={bride.name} size={32} />
          <StatusPill status={chat.status} onPress={onChangeStatus} />
        </View>
        {chat.followUpDate ? (
          <Text variant="caption1" color="tertiary">
            {`Follow up: ${formatDate(chat.followUpDate)}`}
          </Text>
        ) : null}
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-2">
        <DetailField label="Occasion" value={bride.occasionType} />
        <DetailField label="Event date" value={bride.eventDate ? formatDate(bride.eventDate) : '—'} />
        <DetailField label="City" value={bride.city ?? '—'} />
        <DetailField label="Guests" value={bride.guestCount?.toString() ?? '—'} />
        <DetailField label="Budget" value={bride.budgetRange ?? '—'} />
        <DetailField label="Source" value={bride.source ?? '—'} />
      </View>

      {bride.quotes.length > 0 ? (
        <View className="gap-1">
          <Text variant="caption2" color="tertiary">
            QUOTES
          </Text>
          {bride.quotes.map((q) => (
            <Text key={q.id} variant="footnote">
              {`${formatCurrency(q.amount)} · ${q.status} · ${formatDate(q.sentAt)}`}
            </Text>
          ))}
        </View>
      ) : null}

      {bride.payments.length > 0 ? (
        <View className="gap-1">
          <Text variant="caption2" color="tertiary">
            PAYMENTS
          </Text>
          {bride.payments.map((p) => (
            <Text key={p.id} variant="footnote">
              {`${formatCurrency(p.amount)} · ${p.type} · ${formatDate(p.date)}`}
            </Text>
          ))}
        </View>
      ) : null}

      {bride.meetings.length > 0 ? (
        <View className="gap-1">
          <Text variant="caption2" color="tertiary">
            MEETINGS
          </Text>
          {bride.meetings.map((m) => (
            <Text key={m.id} variant="footnote">
              {`${m.type.replace(/_/g, ' ')} · ${formatDate(m.date)}`}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] gap-0.5">
      <Text variant="caption2" color="tertiary">
        {label}
      </Text>
      <Text variant="footnote">{value}</Text>
    </View>
  );
}
