/**
 * Inbox Feature - API Service
 */

import { api } from "@/lib/api-client";
import { filesApi, resolveFileUrl } from "@/Modules/files/api";
import { mockInboxApi } from "./mock";
import type {
    AddNoteInput,
    AssignChatInput,
    BrideDetail,
    ChatListParams,
    ChatListResponse,
    ChatSummary,
    ChatThread,
    ConversationCounts,
    MeetingProposal,
    Message,
    MessagesPage,
    MeetingSummary,
    PaymentSummary,
    QuoteSummary,
    SendMessageInput,
    SetFollowUpInput,
    ProposeMeetingInput,
    UnreadCount,
    UpdateStatusInput,
} from "./types";

const unwrapPayload = <T>(payload: unknown, key?: string): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const container = payload as Record<string, unknown>;
    if (key && container[key] !== undefined) {
      return container[key] as T;
    }

    const nested = container.data ?? container.item ?? container.result;
    if (nested !== undefined) {
      return nested as T;
    }

    return container as T;
  }

  return payload as T;
};

/**
 * GET /v1/vendor/conversations items are a much thinner projection than
 * ChatSummary: { id, leadStatus, assignedMemberId, followUpAt, isReadOnly,
 * archivedAt, lastMessageAt, createdAt, bride: {id,name}, unreadCount }.
 * No occasionType, city, eventDate, lastMessagePreview, pin flag, or contract
 * value exist server-side at all (not "not returned" — not modeled). Those
 * fields default to null/empty below; UI renders them blank rather than
 * crashing. `archived` maps from leadStatus === "archived" (its own status
 * value, matching the `includeArchived` list param) — there's no separate
 * archive boolean. `pinned` has a real toggle endpoint now, but the list/
 * detail projections still never echo `isPinned` back — no way to read the
 * current state from here, so it stays false (see api.togglePin below).
 */
const mapConversation = (raw: any): ChatSummary => ({
  id: raw.id,
  brideName: raw.bride?.name ?? "Unknown",
  brideAvatarUrl: null,
  occasionType: "",
  eventDate: null,
  city: null,
  status: raw.leadStatus,
  unreadCount: raw.unreadCount ?? 0,
  lastMessagePreview: "",
  lastMessageAt: raw.lastMessageAt ?? raw.createdAt,
  // Real payload only has assignedMemberId, no name — resolving the name
  // needs Modules/team, not wired here. Shown as a generic label.
  assignee: raw.assignedMemberId
    ? { id: raw.assignedMemberId, name: "Team member" }
    : null,
  followUpDate: raw.followUpAt ?? null,
  pinned: false,
  archived: raw.leadStatus === "archived",
  contractValue: null,
  readOnly: !!raw.isReadOnly,
});

/**
 * GET/POST /v1/conversations/{id}/messages — shared by both sides and
 * projected per caller. `senderSide` is relative to the thread, not to this
 * seat: every vendor-side message renders as "vendor", including other team
 * members'. No sender name is returned.
 */
const mapMessage = (raw: any, chatId: string): Message => ({
  id: raw.id,
  chatId: raw.conversationId ?? chatId,
  sender:
    raw.senderSide === "bride" ? "bride" : raw.senderSide === "vendor" ? "vendor" : "system",
  kind: raw.kind ?? "text",
  text: raw.body ?? undefined,
  file: raw.file ? { ...raw.file, url: resolveFileUrl(raw.file.url) } : null,
  fileExpired: !!raw.fileExpired,
  meetingProposalId: raw.meetingProposalId ?? null,
  readAt: raw.readAt ?? null,
  createdAt: raw.createdAt,
});

/**
 * Everything is live except mark-unread (no endpoint) and vendor-side
 * unarchive (POST /conversations/{id}/unarchive exists but is bride-side
 * only — a vendor seat gets 404). Both fall to `notAvailable`. The message
 * thread itself comes from getMessages (day 12), not getChat.
 */
const notAvailable = (feature: string): Promise<never> =>
  Promise.reject(
    new Error(`${feature} isn't available yet — no backend endpoint for it.`),
  );

/** Re-fetches and re-maps a single conversation — used after a mutation whose
 * own response only echoes back the field it changed, so callers that expect
 * a full ChatSummary get one instead of a partially-filled stand-in. */
const fetchSummary = async (chatId: string): Promise<ChatSummary> => {
  const response = await api.get<unknown>(`/vendor/conversations/${chatId}`);
  return mapConversation(unwrapPayload<any>(response.data));
};

/**
 * GET /vendor/conversations/{id}/bride — richer than what the list/detail
 * endpoints expose: occasions (event date/guest count/budget), meetings, and
 * a finance block (quotes/payments/totals). No `city` field exists at all.
 * Amount units aren't confirmed against a minor/major-unit convention in the
 * spec, so quote/payment amounts are passed through as-is.
 */
const fetchBridePanel = async (chatId: string, brideName: string): Promise<BrideDetail> => {
  const response = await api.get<unknown>(`/vendor/conversations/${chatId}/bride`);
  const panel = unwrapPayload<any>(response.data);
  const firstOccasion = panel?.occasions?.[0];

  const quotes: QuoteSummary[] = (panel?.finance?.quotes ?? []).map((q: any) => ({
    id: q.id,
    amount: q.amount,
    sentAt: q.sentAt,
    status: q.status,
  }));
  const payments: PaymentSummary[] = (panel?.finance?.payments ?? []).map((p: any) => ({
    id: p.id,
    amount: p.amount,
    type: p.type,
    date: p.date,
  }));
  const meetings: MeetingSummary[] = (panel?.meetings ?? []).map((m: any) => ({
    id: m.id,
    type: m.type,
    date: m.date,
  }));

  return {
    id: chatId,
    name: panel?.bride?.name ?? brideName,
    occasionType: firstOccasion?.name ?? "",
    eventDate: firstOccasion?.date ?? null,
    city: null,
    guestCount: firstOccasion?.guestCount ?? null,
    budgetRange: firstOccasion?.budgetAmount != null ? String(firstOccasion.budgetAmount) : null,
    source: panel?.leadSource ?? null,
    payments,
    quotes,
    meetings,
  };
};

/**
 * GET /vendor/conversations/{id}/notes — team-internal, bride-invisible.
 * Mapped straight into `Message[]` (isNote: true) so the detail screen's
 * single reversed-chronological list can render them inline with everything
 * else, same shape `addNote`'s optimistic return already used.
 */
const fetchNotes = async (chatId: string): Promise<Message[]> => {
  const response = await api.get<unknown>(`/vendor/conversations/${chatId}/notes`);
  const raw = unwrapPayload<any[]>(response.data);
  return (Array.isArray(raw) ? raw : []).map((note: any) => ({
    id: note.id,
    chatId,
    sender: "vendor" as const,
    authorName: note.author?.name,
    text: note.body,
    isNote: true,
    createdAt: note.createdAt,
  }));
};

export const inboxApi = {
  getChats: async (params?: ChatListParams): Promise<ChatListResponse> => {
    const response = await api.get<unknown>("/vendor/conversations", {
      params: {
        limit: 50,
        assignee: params?.assignee,
        status: params?.status,
        // Server sort enum is recent|oldest|follow_up — "unread"/"amount"
        // have no server equivalent; fall back to the default (recent).
        sort:
          params?.sort === "unread" || params?.sort === "amount"
            ? undefined
            : params?.sort,
        q: params?.search,
      },
    });
    const raw = unwrapPayload<any[]>(response.data);
    const chats = (Array.isArray(raw) ? raw : []).map(mapConversation);
    return { chats };
  },

  // Real per-status/per-assignee chip counts, computed server-side over the
  // same scope the list renders — was previously faked by counting the
  // already-fetched (and possibly filtered/paginated) chat list client-side.
  getCounts: async (): Promise<ConversationCounts> => {
    const response = await api.get<unknown>("/vendor/conversations/counts");
    const counts = unwrapPayload<Partial<ConversationCounts>>(response.data);
    // Screens index into byAssignee directly; a missing map crashed the inbox.
    return {
      total: counts?.total ?? 0,
      byStatus: counts?.byStatus ?? {},
      byAssignee: counts?.byAssignee ?? {},
    };
  },

  // mockInboxApi.getChat only knows its own 6 hardcoded chat ids — since
  // getChats above is live, tapping a real conversation falls through to the
  // real detail endpoint. `messages` here is internal notes only; the
  // bride<->vendor thread is a separate paged query (getMessages).
  getChat: async (chatId: string): Promise<ChatThread> => {
    try {
      return await mockInboxApi.getChat(chatId);
    } catch {
      const response = await api.get<unknown>(`/vendor/conversations/${chatId}`);
      const chat = mapConversation(unwrapPayload<any>(response.data));
      const [bride, notes] = await Promise.all([
        fetchBridePanel(chatId, chat.brideName),
        fetchNotes(chatId),
      ]);
      return { chat, bride, messages: notes };
    }
  },

  updateStatus: async (input: UpdateStatusInput): Promise<ChatSummary> => {
    const response = await api.patch<unknown>(
      `/vendor/conversations/${input.chatId}/status`,
      { status: input.status },
    );
    return mapConversation(unwrapPayload<any>(response.data));
  },

  getMessages: async (chatId: string, cursor?: string): Promise<MessagesPage> => {
    const response = await api.get<unknown>(`/conversations/${chatId}/messages`, {
      params: { limit: 30, cursor },
    });
    const raw = unwrapPayload<any[]>(response.data);
    const meta = (response.data as any)?.meta ?? {};
    return {
      messages: (Array.isArray(raw) ? raw : []).map((m) => mapMessage(m, chatId)),
      nextCursor: meta.nextCursor ?? null,
      hasMore: !!meta.hasMore,
    };
  },

  // A file message is two calls: upload the bytes to POST /files (only
  // `chat_attachment` is swept if never sent), then send the returned id. If
  // the send fails, release the upload's quota instead of waiting for the sweep.
  sendMessage: async (input: SendMessageInput): Promise<Message> => {
    const text = input.text?.trim();
    const uploaded = input.attachment
      ? await filesApi.upload(input.attachment, "chat_attachment")
      : null;
    const body = uploaded
      ? { kind: "file", fileId: uploaded.id, ...(text ? { body: text } : {}) }
      : { body: text };
    try {
      const response = await api.post<unknown>(`/conversations/${input.chatId}/messages`, body);
      return mapMessage(unwrapPayload<any>(response.data), input.chatId);
    } catch (error) {
      if (uploaded) void filesApi.remove(uploaded.id).catch(() => {});
      throw error;
    }
  },

  markRead: async (chatId: string, messageId: string): Promise<void> => {
    await api.post(`/conversations/${chatId}/read`, { messageId });
  },

  getUnreadCount: async (): Promise<UnreadCount> => {
    const response = await api.get<unknown>("/conversations/unread-count");
    const raw = unwrapPayload<Partial<UnreadCount>>(response.data);
    return { conversations: raw?.conversations ?? 0, messages: raw?.messages ?? 0 };
  },

  getMeetings: async (chatId: string): Promise<MeetingProposal[]> => {
    const response = await api.get<unknown>(`/conversations/${chatId}/meetings`);
    const raw = unwrapPayload<MeetingProposal[]>(response.data);
    return Array.isArray(raw) ? raw : [];
  },

  // Locked on a trial plan server-side (proposing is part of the calendar);
  // answering is never gated.
  proposeMeeting: async (input: ProposeMeetingInput): Promise<MeetingProposal> => {
    const response = await api.post<unknown>(`/conversations/${input.chatId}/meetings`, {
      proposedAt: input.proposedAt,
      ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    });
    return unwrapPayload<MeetingProposal>(response.data);
  },

  // Writes exactly one calendar event; a double-tap is a 409, not a second event.
  confirmMeeting: async (meetingId: string): Promise<void> => {
    await api.post(`/meetings/${meetingId}/confirm`);
  },

  cancelMeeting: async (meetingId: string, reason?: string): Promise<void> => {
    await api.post(`/meetings/${meetingId}/cancel`, reason?.trim() ? { reason: reason.trim() } : {});
  },

  assignChat: async (input: AssignChatInput): Promise<ChatSummary> => {
    await api.patch(`/vendor/conversations/${input.chatId}/assignee`, {
      memberId: input.assigneeId,
    });
    return fetchSummary(input.chatId);
  },

  // Real backend has no read-back for pin state (list/detail items never
  // include `isPinned`) — the toggle persists server-side, but the UI's
  // pinned badge won't reflect it until the backend adds that field.
  togglePin: async (chatId: string, pinned: boolean): Promise<ChatSummary> => {
    if (pinned) {
      await api.post(`/vendor/conversations/${chatId}/pin`);
    } else {
      await api.delete(`/vendor/conversations/${chatId}/pin`);
    }
    return fetchSummary(chatId);
  },

  toggleArchive: async (chatId: string, archived: boolean): Promise<ChatSummary> => {
    if (!archived) return notAvailable("Unarchiving a conversation");
    await api.post(`/vendor/conversations/${chatId}/archive`);
    return fetchSummary(chatId);
  },

  setFollowUp: async (input: SetFollowUpInput): Promise<ChatSummary> => {
    await api.patch(`/vendor/conversations/${input.chatId}/follow-up`, {
      followUpAt: input.followUpDate,
    });
    return fetchSummary(input.chatId);
  },

  addNote: async (input: AddNoteInput): Promise<Message> => {
    const response = await api.post<unknown>(
      `/vendor/conversations/${input.chatId}/notes`,
      { body: input.note },
    );
    const note = unwrapPayload<any>(response.data);
    return {
      id: note.id,
      chatId: input.chatId,
      sender: "vendor",
      authorName: note.author?.name,
      text: note.body,
      isNote: true,
      createdAt: note.createdAt ?? new Date().toISOString(),
    };
  },

  markUnread: (_chatId: string): Promise<ChatSummary> =>
    notAvailable("Marking a conversation unread"),
};
