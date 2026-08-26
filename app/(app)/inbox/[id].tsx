import { useActionSheet } from '@expo/react-native-action-sheet';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, TextInput, View } from 'react-native';
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
import { useCreateQuote, useQuotes, useUpdateQuote } from '@/Modules/quotes/hooks';
import type { Quote, QuoteLineItem, QuoteStatus } from '@/Modules/quotes/types';
import { useSavedReplies } from '@/Modules/saved-replies/hooks';
import { useSubscription } from '@/Modules/subscription/hooks';

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const { data, isLoading, isError, error } = useChat(id);
  const sendMessage = useSendMessage(id ?? '');
  const addNote = useAddNote();
  const updateStatus = useUpdateChatStatus();
  const { data: sub } = useSubscription();
  const isPremium = sub?.isPremium ?? false;
  const { data: savedReplies } = useSavedReplies(isPremium);

  const [showDetails, setShowDetails] = useState(false);
  const [draft, setDraft] = useState('');
  const [isNote, setIsNote] = useState(false);

  const openSavedRepliesSheet = () => {
    if (!isPremium) {
      Alert.alert('Premium feature', 'Upgrade to Premium to use saved replies.');
      return;
    }
    const replies = savedReplies ?? [];
    const options = [...replies.map((r) => r.title), 'Cancel'];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: 'Insert saved reply' },
      (index) => {
        if (index === undefined || index === options.length - 1) return;
        setDraft(replies[index]!.body);
      },
    );
  };

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
        <BrideDetailPanel
          bride={bride}
          chat={chat}
          conversationId={chat.id}
          onChangeStatus={openStatusSheet}
        />
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
          <Pressable
            onPress={openSavedRepliesSheet}
            className="h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Icon name="quote.bubble.fill" size={18} color={colors.foreground} />
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
  conversationId,
  onChangeStatus,
}: {
  bride: BrideDetail;
  chat: ChatSummary;
  conversationId: string;
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

      <QuotesSection conversationId={conversationId} />

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

const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
};

function QuotesSection({ conversationId }: { conversationId: string }) {
  const { colors } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const { data: quotesPage } = useQuotes({ conversationId });
  const updateQuote = useUpdateQuote();
  const [builderOpen, setBuilderOpen] = useState(false);

  const quotes = quotesPage?.quotes ?? [];

  const openQuoteSheet = (quote: Quote) => {
    if (quote.status !== 'open') return;
    const options = ['Mark accepted', 'Mark expired', 'Cancel'];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: 1 },
      (index) => {
        if (index === 0) updateQuote.mutate({ quoteId: quote.id, status: 'accepted' });
        else if (index === 1) updateQuote.mutate({ quoteId: quote.id, status: 'expired' });
      },
    );
  };

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text variant="caption2" color="tertiary">
          QUOTES
        </Text>
        <Pressable onPress={() => setBuilderOpen(true)}>
          <Text variant="caption1" className="font-bold text-primary">
            + New quote
          </Text>
        </Pressable>
      </View>
      {quotes.length === 0 ? (
        <Text variant="footnote" color="tertiary">
          No quotes sent yet.
        </Text>
      ) : (
        quotes.map((q) => {
          const meta = QUOTE_STATUS_META[q.status];
          return (
            <Pressable
              key={q.id}
              onPress={() => openQuoteSheet(q)}
              className="flex-row items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 py-2">
              <Text variant="footnote" className="flex-1">
                {`${formatCurrency(q.totalAmount)}${q.validUntil ? ` · valid to ${formatDate(q.validUntil)}` : ''}`}
              </Text>
              <View className={`rounded-full px-2 py-0.5 ${meta.className}`}>
                <Text variant="caption2" className={`font-medium ${meta.className}`}>
                  {meta.label}
                </Text>
              </View>
            </Pressable>
          );
        })
      )}

      <NewQuoteModal
        visible={builderOpen}
        conversationId={conversationId}
        onClose={() => setBuilderOpen(false)}
        colors={colors}
      />
    </View>
  );
}

function NewQuoteModal({
  visible,
  conversationId,
  onClose,
  colors,
}: {
  visible: boolean;
  conversationId: string;
  onClose: () => void;
  colors: { grey: string; foreground: string };
}) {
  const createQuote = useCreateQuote();
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    { description: '', quantity: 1, unitAmount: 0 },
  ]);

  const updateItem = (index: number, patch: Partial<QuoteLineItem>) => {
    setLineItems((prev) => prev.map((li, i) => (i === index ? { ...li, ...patch } : li)));
  };
  const addItem = () => setLineItems((prev) => [...prev, { description: '', quantity: 1, unitAmount: 0 }]);
  const removeItem = (index: number) => setLineItems((prev) => prev.filter((_, i) => i !== index));

  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unitAmount, 0);
  const canSubmit = lineItems.every((li) => li.description.trim() && li.quantity > 0 && li.unitAmount > 0);

  const reset = () => setLineItems([{ description: '', quantity: 1, unitAmount: 0 }]);

  const onSubmit = () => {
    if (!canSubmit) return;
    createQuote.mutate(
      { conversationId, lineItems },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (err) => Alert.alert('Save failed', getErrorMessage(err)),
      },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="gap-3 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted" />
          <Text variant="title3" className="font-bold">
            New quote
          </Text>

          {lineItems.map((item, index) => (
            <View key={index} className="gap-2 rounded-xl border border-border p-3">
              <TextInput
                value={item.description}
                onChangeText={(v) => updateItem(index, { description: v })}
                placeholder="Description"
                placeholderTextColor={colors.grey}
                className="rounded-lg bg-muted px-3 py-2 text-foreground"
              />
              <View className="flex-row gap-2">
                <TextInput
                  value={item.quantity ? String(item.quantity) : ''}
                  onChangeText={(v) => updateItem(index, { quantity: Number(v.replace(/[^0-9]/g, '')) || 0 })}
                  placeholder="Qty"
                  keyboardType="numeric"
                  placeholderTextColor={colors.grey}
                  className="w-16 rounded-lg bg-muted px-3 py-2 text-foreground"
                />
                <TextInput
                  value={item.unitAmount ? String(item.unitAmount) : ''}
                  onChangeText={(v) =>
                    updateItem(index, { unitAmount: Number(v.replace(/[^0-9.]/g, '')) || 0 })
                  }
                  placeholder="Unit price (EGP)"
                  keyboardType="numeric"
                  placeholderTextColor={colors.grey}
                  className="flex-1 rounded-lg bg-muted px-3 py-2 text-foreground"
                />
                {lineItems.length > 1 ? (
                  <Pressable onPress={() => removeItem(index)} className="items-center justify-center px-2">
                    <Icon name="trash.fill" size={16} color={colors.grey} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}

          <Pressable onPress={addItem} className="items-center rounded-lg border border-border py-2">
            <Text variant="caption1" className="font-bold">
              + Add line item
            </Text>
          </Pressable>

          <Text variant="subhead" className="font-bold">
            {`Total: ${formatCurrency(total)}`}
          </Text>

          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit || createQuote.isPending}
            className={`items-center rounded-2xl bg-primary py-3.5 ${
              canSubmit && !createQuote.isPending ? 'active:opacity-80' : 'opacity-50'
            }`}>
            <Text className="font-bold text-white">
              {createQuote.isPending ? 'Sending…' : 'Send quote'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
