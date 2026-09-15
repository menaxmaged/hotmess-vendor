import { useActionSheet } from '@expo/react-native-action-sheet';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Image, Linking, Modal, Pressable, TextInput, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { DatePicker } from '@/components/nativewindui/DatePicker';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { useColorScheme } from '@/lib/useColorScheme';
import { useAuth } from '@/Modules/auth/context';
import { StatusPill } from '@/Modules/inbox/components/StatusPill';
import {
  useAddNote,
  useCancelMeeting,
  useChat,
  useConfirmMeeting,
  useMarkRead,
  useMeetings,
  useMessages,
  useProposeMeeting,
  useSendMessage,
  useSetFollowUp,
  useUpdateChatStatus,
} from '@/Modules/inbox/hooks';
import { STATUS_ORDER } from '@/Modules/inbox/status';
import type {
  BrideDetail,
  ChatSummary,
  MeetingProposal,
  MeetingStatus,
  Message,
  OutgoingAttachment,
} from '@/Modules/inbox/types';
import { useCreateQuote, useQuote, useQuotes, useUpdateQuote } from '@/Modules/quotes/hooks';
import type { QuoteLineItem, QuoteStatus } from '@/Modules/quotes/types';
import { useSavedReplies } from '@/Modules/saved-replies/hooks';
import { useSubscription } from '@/Modules/subscription/hooks';

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation(['inbox', 'common']);
  const { colors } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useChat(id);
  const messagesQuery = useMessages(id);
  const { data: meetings } = useMeetings(id);
  const { mutate: markRead } = useMarkRead(id ?? '');
  const confirmMeeting = useConfirmMeeting(id ?? '');
  const cancelMeeting = useCancelMeeting(id ?? '');
  const sendMessage = useSendMessage(id ?? '');
  const addNote = useAddNote();
  const updateStatus = useUpdateChatStatus();
  const { data: sub } = useSubscription();
  const isPremium = sub?.isPremium ?? false;
  const { data: savedReplies } = useSavedReplies(isPremium);

  const [showDetails, setShowDetails] = useState(false);
  const [draft, setDraft] = useState('');
  const [isNote, setIsNote] = useState(false);

  const liveMessages = useMemo(
    () => messagesQuery.data?.pages.flatMap((p) => p.messages) ?? [],
    [messagesQuery.data],
  );

  // Thread (live, paged) + internal notes (from getChat), newest first for the
  // inverted list. Deduped by id so a mock thread never doubles up.
  const thread = useMemo(() => {
    const byId = new Map<string, Message>();
    for (const m of [...(data?.messages ?? []), ...liveMessages]) byId.set(m.id, m);
    return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data?.messages, liveMessages]);

  const meetingsById = useMemo(
    () => new Map((meetings ?? []).map((m) => [m.id, m])),
    [meetings],
  );

  // Mark read up to the newest bride message whenever a new one lands.
  const newestBrideMessageId = liveMessages.find((m) => m.sender === 'bride')?.id;
  const lastMarked = useRef<string | null>(null);
  useEffect(() => {
    if (!id || !newestBrideMessageId || lastMarked.current === newestBrideMessageId) return;
    lastMarked.current = newestBrideMessageId;
    markRead(newestBrideMessageId);
  }, [id, newestBrideMessageId, markRead]);

  const openSavedRepliesSheet = () => {
    if (!isPremium) {
      Alert.alert(t('chat.premiumTitle'), t('chat.premiumSavedReplies'));
      return;
    }
    const replies = savedReplies ?? [];
    const options = [...replies.map((r) => r.title), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('chat.insertSavedReply') },
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
      sendMessage.mutate(
        { text },
        {
          onError: (err) => {
            setDraft(text);
            Alert.alert(t('chat.sendFailed'), getErrorMessage(err));
          },
        },
      );
    }
  };

  const sendAttachment = (attachment: OutgoingAttachment) => {
    const caption = draft.trim();
    setDraft('');
    sendMessage.mutate(
      { text: caption || undefined, attachment },
      { onError: (err) => Alert.alert(t('chat.uploadFailed'), getErrorMessage(err)) },
    );
  };

  // POST /files accepts jpeg/png/webp/gif/pdf only.
  const openAttachSheet = () => {
    const options = [t('chat.photo'), t('chat.pdf'), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('chat.attach') },
      async (index) => {
        if (index === 0) {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) return;
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          const asset = result.canceled ? null : result.assets[0];
          if (!asset) return;
          sendAttachment({
            uri: asset.uri,
            name: asset.fileName ?? `photo-${Date.now()}.jpg`,
            type: asset.mimeType ?? 'image/jpeg',
          });
        } else if (index === 1) {
          const result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            copyToCacheDirectory: true,
          });
          const asset = result.canceled ? null : result.assets[0];
          if (!asset) return;
          sendAttachment({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/pdf' });
        }
      },
    );
  };

  const onConfirmMeeting = (meeting: MeetingProposal) => {
    confirmMeeting.mutate(meeting.id, {
      onError: (err) => Alert.alert(t('meetings.couldNotConfirm'), getErrorMessage(err)),
    });
  };

  const onCancelMeeting = (meeting: MeetingProposal) => {
    Alert.alert(t('meetings.cancelTitle'), t('meetings.cancelBody', { when: formatDateTime(meeting.proposedAt) }), [
      { text: t('meetings.keep'), style: 'cancel' },
      {
        text: t('meetings.cancelMeeting'),
        style: 'destructive',
        onPress: () =>
          cancelMeeting.mutate(
            { meetingId: meeting.id },
            { onError: (err) => Alert.alert(t('meetings.couldNotCancel'), getErrorMessage(err)) },
          ),
      },
    ]);
  };

  const openStatusSheet = () => {
    if (!id) return;
    const options = [...STATUS_ORDER.map((s) => t(`status.${s}`)), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('list.changeStatus') },
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
        <Text color="tertiary">{error ? getErrorMessage(error) : t('chat.notFound')}</Text>
      </View>
    );
  }

  const { chat, bride } = data;
  const readOnly = !!chat.readOnly;
  const canSend = !!draft.trim() && (isNote || !readOnly) && !sendMessage.isPending;

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
          meetings={meetings ?? []}
          currentUserId={user?.id != null ? String(user.id) : undefined}
          onConfirmMeeting={onConfirmMeeting}
          onCancelMeeting={onCancelMeeting}
        />
      ) : null}

      <FlatList
        data={thread}
        inverted
        keyExtractor={(m) => m.id}
        contentContainerClassName="gap-2 p-4"
        onEndReached={() => {
          if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
            void messagesQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={messagesQuery.isFetchingNextPage ? <ActivityIndicator /> : null}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            meeting={item.meetingProposalId ? meetingsById.get(item.meetingProposalId) : undefined}
            currentUserId={user?.id != null ? String(user.id) : undefined}
            onConfirmMeeting={onConfirmMeeting}
            onCancelMeeting={onCancelMeeting}
          />
        )}
      />

      {readOnly ? (
        <View className="bg-muted px-4 py-2">
          <Text variant="caption1" color="tertiary" className="text-center">
            {t('chat.readOnly')}
          </Text>
        </View>
      ) : null}

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
          {!isNote && !readOnly ? (
            <Pressable
              onPress={openAttachSheet}
              disabled={sendMessage.isPending}
              className="h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Icon name="photo.fill" size={18} color={colors.foreground} />
            </Pressable>
          ) : null}
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={isNote ? t('chat.notePlaceholder') : t('chat.messagePlaceholder')}
            placeholderTextColor={colors.grey}
            multiline
            className="max-h-28 flex-1 rounded-2xl border border-border bg-card px-4 py-2.5 text-foreground"
          />
          <Pressable
            onPress={onSend}
            disabled={!canSend}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              canSend ? 'bg-primary' : 'bg-muted'
            }`}>
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" />
            ) : (
              <Icon name="arrow.up" size={18} color={canSend ? '#fff' : colors.grey} />
            )}
          </Pressable>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const MEETING_STATUS_META: Record<MeetingStatus, { className: string }> = {
  pending: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  confirmed: { className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  cancelled: { className: 'bg-muted text-muted-foreground' },
};

type MeetingActions = {
  currentUserId?: string;
  onConfirmMeeting: (meeting: MeetingProposal) => void;
  onCancelMeeting: (meeting: MeetingProposal) => void;
};

function MeetingActionsRow({ meeting, currentUserId, onConfirmMeeting, onCancelMeeting }: MeetingActions & { meeting: MeetingProposal }) {
  const { t } = useTranslation('inbox');
  if (meeting.status === 'cancelled') return null;
  // Either party may confirm, but confirming your own proposal makes no sense in the UI.
  const canConfirm = meeting.status === 'pending' && meeting.proposedByUserId !== currentUserId;
  return (
    <View className="mt-2 flex-row gap-2">
      {canConfirm ? (
        <Pressable onPress={() => onConfirmMeeting(meeting)} className="rounded-lg bg-primary px-3 py-1.5">
          <Text variant="caption1" className="font-bold text-white">
            {t('meetings.confirm')}
          </Text>
        </Pressable>
      ) : null}
      <Pressable onPress={() => onCancelMeeting(meeting)} className="rounded-lg border border-border px-3 py-1.5">
        <Text variant="caption1" className="font-bold">
          {t('meetings.cancel')}
        </Text>
      </Pressable>
    </View>
  );
}

function MessageBubble({
  message,
  meeting,
  ...actions
}: MeetingActions & { message: Message; meeting?: MeetingProposal }) {
  const { t } = useTranslation('inbox');
  if (message.kind === 'system' || message.sender === 'system') {
    return (
      <View className="self-center px-3 py-1">
        <Text variant="caption2" color="tertiary" className="text-center">
          {message.text}
        </Text>
      </View>
    );
  }

  if (message.kind === 'meeting_card') {
    const meta = meeting ? MEETING_STATUS_META[meeting.status] : null;
    return (
      <View className="w-[80%] self-center rounded-2xl border border-border bg-card p-3">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-1.5">
            <Icon name="calendar" size={16} color="#FF318A" />
            <Text variant="footnote" className="font-bold">
              {meeting ? formatDateTime(meeting.proposedAt) : t('meetings.proposed')}
            </Text>
          </View>
          {meta ? (
            <View className={`rounded-full px-2 py-0.5 ${meta.className}`}>
              <Text variant="caption2" className={`font-medium ${meta.className}`}>
                {meeting ? t(`meetingStatus.${meeting.status}`) : null}
              </Text>
            </View>
          ) : null}
        </View>
        {message.text ? (
          <Text variant="footnote" className="mt-1">
            {message.text}
          </Text>
        ) : null}
        {meeting ? <MeetingActionsRow meeting={meeting} {...actions} /> : null}
      </View>
    );
  }

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
      {message.kind === 'file' ? <FileAttachment message={message} isVendor={isVendor} /> : null}
      {message.text ? (
        <Text className={isVendor ? 'text-white' : 'text-foreground'}>{message.text}</Text>
      ) : null}
      <Text
        variant="caption2"
        className={`mt-1 ${isVendor ? 'text-white/70' : 'text-muted-foreground'}`}>
        {formatDateTime(message.createdAt)}
      </Text>
    </View>
  );
}

function FileAttachment({ message, isVendor }: { message: Message; isVendor: boolean }) {
  const { t } = useTranslation('inbox');
  const tone = isVendor ? 'text-white' : 'text-foreground';
  if (message.fileExpired || !message.file) {
    return (
      <Text variant="footnote" className={`italic ${isVendor ? 'text-white/70' : 'text-muted-foreground'}`}>
        {t('chat.fileUnavailable')}
      </Text>
    );
  }
  const { file } = message;
  const open = () => void Linking.openURL(file.url);
  if (file.mimeType.startsWith('image/')) {
    return (
      <Pressable onPress={open} className="mb-1">
        <Image source={{ uri: file.url }} style={{ width: 200, height: 200, borderRadius: 12 }} resizeMode="cover" />
      </Pressable>
    );
  }
  return (
    <Pressable onPress={open} className="mb-1 flex-row items-center gap-2">
      <Icon name="doc.fill" size={18} color={isVendor ? '#fff' : '#661C33'} />
      <View className="flex-1">
        <Text variant="footnote" className={`font-bold ${tone}`} numberOfLines={1}>
          {file.originalName ?? t('chat.attachment')}
        </Text>
        <Text variant="caption2" className={isVendor ? 'text-white/70' : 'text-muted-foreground'}>
          {t('chat.kilobytes', { size: Math.max(1, Math.round(file.byteSize / 1024)) })}
        </Text>
      </View>
    </Pressable>
  );
}

function BrideDetailPanel({
  bride,
  chat,
  conversationId,
  onChangeStatus,
  meetings,
  ...meetingActions
}: MeetingActions & {
  bride: BrideDetail;
  chat: ChatSummary;
  conversationId: string;
  onChangeStatus: () => void;
  meetings: MeetingProposal[];
}) {
  const { t } = useTranslation('inbox');
  return (
    <View className="gap-3 border-b border-border bg-card p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <InitialsAvatar name={bride.name} size={32} />
          <StatusPill status={chat.status} onPress={onChangeStatus} />
        </View>
        <FollowUpControl chatId={conversationId} followUpDate={chat.followUpDate ?? null} />
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-2">
        <DetailField label={t('details.occasion')} value={bride.occasionType} />
        <DetailField label={t('details.eventDate')} value={bride.eventDate ? formatDate(bride.eventDate) : '—'} />
        <DetailField label={t('details.city')} value={bride.city ?? '—'} />
        <DetailField label={t('details.guests')} value={bride.guestCount?.toString() ?? '—'} />
        <DetailField label={t('details.budget')} value={bride.budgetRange ?? '—'} />
        <DetailField label={t('details.source')} value={bride.source ?? '—'} />
      </View>

      <QuotesSection conversationId={conversationId} />

      <MeetingProposalsSection
        conversationId={conversationId}
        meetings={meetings}
        readOnly={!!chat.readOnly}
        {...meetingActions}
      />

      {bride.payments.length > 0 ? (
        <View className="gap-1">
          <Text variant="caption2" color="tertiary">
            {t('details.payments')}
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
            {t('details.meetings')}
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

const QUOTE_STATUS_META: Record<QuoteStatus, { className: string }> = {
  open: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  accepted: { className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  expired: { className: 'bg-muted text-muted-foreground' },
};

function QuotesSection({ conversationId }: { conversationId: string }) {
  const { colors } = useColorScheme();
  const { t } = useTranslation('inbox');
  const { data: quotesPage } = useQuotes({ conversationId });
  const [builderOpen, setBuilderOpen] = useState(false);
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);

  const quotes = quotesPage?.quotes ?? [];

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text variant="caption2" color="tertiary">
          {t('quotes.title')}
        </Text>
        <Pressable onPress={() => setBuilderOpen(true)}>
          <Text variant="caption1" className="font-bold text-primary">
            {t('quotes.new')}
          </Text>
        </Pressable>
      </View>
      {quotes.length === 0 ? (
        <Text variant="footnote" color="tertiary">
          {t('quotes.empty')}
        </Text>
      ) : (
        quotes.map((q) => {
          const meta = QUOTE_STATUS_META[q.status];
          return (
            <Pressable
              key={q.id}
              onPress={() => setOpenQuoteId(q.id)}
              className="flex-row items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 py-2">
              <Text variant="footnote" className="flex-1">
                {q.validUntil
                  ? t('quotes.validTo', { amount: formatCurrency(q.totalAmount), date: formatDate(q.validUntil) })
                  : formatCurrency(q.totalAmount)}
              </Text>
              <View className={`rounded-full px-2 py-0.5 ${meta.className}`}>
                <Text variant="caption2" className={`font-medium ${meta.className}`}>
                  {t(`quoteStatus.${q.status}`)}
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
      {openQuoteId ? <QuoteDetailModal quoteId={openQuoteId} onClose={() => setOpenQuoteId(null)} /> : null}
    </View>
  );
}

/** GET /vendor/quotes/{id} — line items and the server-computed total. */
function QuoteDetailModal({ quoteId, onClose }: { quoteId: string; onClose: () => void }) {
  const { t } = useTranslation('inbox');
  const { data: quote, isLoading } = useQuote(quoteId);
  const updateQuote = useUpdateQuote();

  const setStatus = (status: QuoteStatus) =>
    updateQuote.mutate(
      { quoteId, status },
      { onSuccess: onClose, onError: (err) => Alert.alert(t('quotes.updateFailed'), getErrorMessage(err)) },
    );

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="gap-3 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted" />
          {isLoading || !quote ? (
            <ActivityIndicator />
          ) : (
            <>
              <View className="flex-row items-center justify-between">
                <Text variant="title3" className="font-bold">
                  {t('quotes.quote')}
                </Text>
                <View className={`rounded-full px-2 py-0.5 ${QUOTE_STATUS_META[quote.status].className}`}>
                  <Text variant="caption2" className={`font-medium ${QUOTE_STATUS_META[quote.status].className}`}>
                    {t(`quoteStatus.${quote.status}`)}
                  </Text>
                </View>
              </View>
              <View className="gap-2 rounded-xl border border-border bg-card p-3">
                {quote.lineItems.map((li, index) => (
                  <View key={index} className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text variant="footnote" className="font-medium">
                        {li.description}
                      </Text>
                      <Text variant="caption2" color="tertiary">
                        {`${li.quantity} × ${formatCurrency(li.unitAmount)}`}
                      </Text>
                    </View>
                    <Text variant="footnote">{formatCurrency(li.quantity * li.unitAmount)}</Text>
                  </View>
                ))}
                <View className="mt-1 flex-row justify-between border-t border-border pt-2">
                  <Text variant="subhead" className="font-bold">
                    {t('quotes.total')}
                  </Text>
                  <Text variant="subhead" className="font-bold">
                    {formatCurrency(quote.totalAmount)}
                  </Text>
                </View>
              </View>
              <Text variant="caption1" color="tertiary">
                {quote.validUntil
                  ? t('quotes.sentValidUntil', { date: formatDate(quote.createdAt), until: formatDate(quote.validUntil) })
                  : t('quotes.sent', { date: formatDate(quote.createdAt) })}
              </Text>
              {quote.status === 'open' ? (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setStatus('expired')}
                    disabled={updateQuote.isPending}
                    className="flex-1 items-center rounded-2xl border border-border py-3.5">
                    <Text className="font-bold">{t('quotes.markExpired')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setStatus('accepted')}
                    disabled={updateQuote.isPending}
                    className="flex-1 items-center rounded-2xl bg-primary py-3.5">
                    <Text className="font-bold text-white">{t('quotes.markAccepted')}</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FollowUpControl({ chatId, followUpDate }: { chatId: string; followUpDate: string | null }) {
  const { t } = useTranslation('inbox');
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)}>
        <Text variant="caption1" className={followUpDate ? 'text-muted-foreground' : 'font-bold text-primary'}>
          {followUpDate ? t('followUp.on', { date: formatDate(followUpDate) }) : t('followUp.add')}
        </Text>
      </Pressable>
      {open ? <FollowUpModal chatId={chatId} followUpDate={followUpDate} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** PATCH /vendor/conversations/{id}/follow-up — `null` clears it. */
function FollowUpModal({
  chatId,
  followUpDate,
  onClose,
}: {
  chatId: string;
  followUpDate: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('inbox');
  const setFollowUp = useSetFollowUp();
  const [date, setDate] = useState(() => (followUpDate ? new Date(followUpDate) : tomorrowNoon()));

  const save = (value: string | null) =>
    setFollowUp.mutate(
      { chatId, followUpDate: value },
      { onSuccess: onClose, onError: (err) => Alert.alert(t('followUp.couldNotSave'), getErrorMessage(err)) },
    );

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="gap-3 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted" />
          <Text variant="title3" className="font-bold">
            {t('followUp.title')}
          </Text>
          <DatePicker
            value={date}
            mode="date"
            onChange={(_event, next) => {
              if (next) setDate(next);
            }}
          />
          <View className="flex-row gap-2">
            {followUpDate ? (
              <Pressable
                onPress={() => save(null)}
                disabled={setFollowUp.isPending}
                className="items-center rounded-2xl border border-border px-5 py-3.5">
                <Text className="font-bold">{t('followUp.clear')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => save(date.toISOString())}
              disabled={setFollowUp.isPending}
              className={`flex-1 items-center rounded-2xl bg-primary py-3.5 ${setFollowUp.isPending ? 'opacity-50' : ''}`}>
              <Text className="font-bold text-white">{setFollowUp.isPending ? t('followUp.saving') : t('followUp.save')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
  const { t } = useTranslation('inbox');
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
        onError: (err) => Alert.alert(t('quotes.saveFailed'), getErrorMessage(err)),
      },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="gap-3 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted" />
          <Text variant="title3" className="font-bold">
            {t('quotes.newTitle')}
          </Text>

          {lineItems.map((item, index) => (
            <View key={index} className="gap-2 rounded-xl border border-border p-3">
              <TextInput
                value={item.description}
                onChangeText={(v) => updateItem(index, { description: v })}
                placeholder={t('quotes.description')}
                placeholderTextColor={colors.grey}
                className="rounded-lg bg-muted px-3 py-2 text-foreground"
              />
              <View className="flex-row gap-2">
                <TextInput
                  value={item.quantity ? String(item.quantity) : ''}
                  onChangeText={(v) => updateItem(index, { quantity: Number(v.replace(/[^0-9]/g, '')) || 0 })}
                  placeholder={t('quotes.quantity')}
                  keyboardType="numeric"
                  placeholderTextColor={colors.grey}
                  className="w-16 rounded-lg bg-muted px-3 py-2 text-foreground"
                />
                <TextInput
                  value={item.unitAmount ? String(item.unitAmount) : ''}
                  onChangeText={(v) =>
                    updateItem(index, { unitAmount: Number(v.replace(/[^0-9.]/g, '')) || 0 })
                  }
                  placeholder={t('quotes.unitPrice')}
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
              {t('quotes.addLine')}
            </Text>
          </Pressable>

          <Text variant="subhead" className="font-bold">
            {t('quotes.totalLine', { amount: formatCurrency(total) })}
          </Text>

          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit || createQuote.isPending}
            className={`items-center rounded-2xl bg-primary py-3.5 ${
              canSubmit && !createQuote.isPending ? 'active:opacity-80' : 'opacity-50'
            }`}>
            <Text className="font-bold text-white">
              {createQuote.isPending ? t('quotes.sending') : t('quotes.send')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MeetingProposalsSection({
  conversationId,
  meetings,
  readOnly,
  ...actions
}: MeetingActions & { conversationId: string; meetings: MeetingProposal[]; readOnly: boolean }) {
  const { t } = useTranslation('inbox');
  const [open, setOpen] = useState(false);
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text variant="caption2" color="tertiary">
          {t('meetings.title')}
        </Text>
        {!readOnly ? (
          <Pressable onPress={() => setOpen(true)}>
            <Text variant="caption1" className="font-bold text-primary">
              {t('meetings.propose')}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {meetings.length === 0 ? (
        <Text variant="footnote" color="tertiary">
          {t('meetings.empty')}
        </Text>
      ) : (
        meetings.map((m) => {
          const meta = MEETING_STATUS_META[m.status];
          return (
            <View key={m.id} className="rounded-lg border border-border bg-background px-2.5 py-2">
              <View className="flex-row items-center justify-between gap-2">
                <Text variant="footnote" className="flex-1">
                  {formatDateTime(m.proposedAt)}
                </Text>
                <View className={`rounded-full px-2 py-0.5 ${meta.className}`}>
                  <Text variant="caption2" className={`font-medium ${meta.className}`}>
                    {t(`meetingStatus.${m.status}`)}
                  </Text>
                </View>
              </View>
              {m.note ? (
                <Text variant="caption1" color="tertiary">
                  {m.note}
                </Text>
              ) : null}
              <MeetingActionsRow meeting={m} {...actions} />
            </View>
          );
        })
      )}
      <ProposeMeetingModal visible={open} conversationId={conversationId} onClose={() => setOpen(false)} />
    </View>
  );
}

const tomorrowNoon = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  return d;
};

function ProposeMeetingModal({
  visible,
  conversationId,
  onClose,
}: {
  visible: boolean;
  conversationId: string;
  onClose: () => void;
}) {
  const { colors } = useColorScheme();
  const { t } = useTranslation('inbox');
  const proposeMeeting = useProposeMeeting(conversationId);
  const [when, setWhen] = useState(tomorrowNoon);
  const [note, setNote] = useState('');
  // Captured once when the modal mounts — render must stay pure; onSubmit re-checks against the real clock.
  const [openedAt] = useState(() => new Date());

  const inFuture = when.getTime() > openedAt.getTime();

  const onSubmit = () => {
    if (!inFuture) return;
    if (when.getTime() <= Date.now()) {
      Alert.alert(t('meetings.pickLaterTitle'), t('meetings.pickLaterBody'));
      return;
    }
    proposeMeeting.mutate(
      { proposedAt: when.toISOString(), note },
      {
        onSuccess: () => {
          setWhen(tomorrowNoon());
          setNote('');
          onClose();
        },
        onError: (err) => Alert.alert(t('meetings.couldNotPropose'), getErrorMessage(err)),
      },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="gap-3 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted" />
          <Text variant="title3" className="font-bold">
            {t('meetings.modalTitle')}
          </Text>
          <DatePicker
            value={when}
            mode="datetime"
            minimumDate={openedAt}
            onChange={(_event, date) => {
              if (date) setWhen(date);
            }}
          />
          <TextInput
            value={note}
            onChangeText={(v) => setNote(v.slice(0, 500))}
            placeholder={t('meetings.notePlaceholder')}
            placeholderTextColor={colors.grey}
            multiline
            className="max-h-28 rounded-lg bg-muted px-3 py-2 text-foreground"
          />
          {!inFuture ? (
            <Text variant="caption1" className="text-destructive">
              {t('meetings.pickFuture')}
            </Text>
          ) : null}
          <Pressable
            onPress={onSubmit}
            disabled={!inFuture || proposeMeeting.isPending}
            className={`items-center rounded-2xl bg-primary py-3.5 ${
              inFuture && !proposeMeeting.isPending ? 'active:opacity-80' : 'opacity-50'
            }`}>
            <Text className="font-bold text-white">
              {proposeMeeting.isPending ? t('meetings.sending') : t('meetings.send')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
