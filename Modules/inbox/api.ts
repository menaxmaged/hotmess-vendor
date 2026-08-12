/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Inbox Feature - API Service
 */

import { api } from "@/lib/api-client";
import { mockInboxApi } from "./mock";
import type {
    AddNoteInput,
    AssigneeBucket,
    AssignChatInput,
    BrideDetail,
    ChatListParams,
    ChatListResponse,
    ChatSummary,
    ChatThread,
    Message,
    MeetingSummary,
    PaymentSummary,
    QuoteSummary,
    SendMessageInput,
    SetFollowUpInput,
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
});

const buildAssigneeBuckets = (chats: ChatSummary[]): AssigneeBucket[] => {
  const byMember = new Map<string, number>();
  let unassigned = 0;
  for (const chat of chats) {
    if (!chat.assignee) unassigned++;
    else byMember.set(chat.assignee.id, (byMember.get(chat.assignee.id) ?? 0) + 1);
  }
  return [
    { id: "all", label: "All", count: chats.length },
    ...Array.from(byMember.entries()).map(([id, count]) => ({ id, label: "Team member", count })),
    { id: "unassigned", label: "Unassigned", count: unassigned },
  ];
};

/**
 * List, status-update, detail, notes, pin, archive, assignee, and follow-up
 * are all live now. send-message and mark-unread still have no endpoint —
 * see `notAvailable`. Unarchiving has no endpoint either (only
 * POST .../archive exists, no DELETE) — toggleArchive(id, false) also falls
 * to `notAvailable`. getChat's message thread is deliberately still mock:
 * the real detail endpoint has no message-read endpoint anywhere under
 * Vendor Studio, so wiring it live would replace a working thread with an
 * empty one. Revisit once the backend adds message-read.
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
    return { chats, assigneeBuckets: buildAssigneeBuckets(chats) };
  },

  // mockInboxApi.getChat only knows its own 6 hardcoded chat ids — since
  // getChats above is now live, tapping a real conversation would throw
  // "Mock chat not found" there. Fall back to the real (thin) detail
  // endpoint instead of crashing: same status/assignee data as the list,
  // just an empty message thread and bride panel rather than a broken screen.
  getChat: async (chatId: string): Promise<ChatThread> => {
    try {
      return await mockInboxApi.getChat(chatId);
    } catch {
      const response = await api.get<unknown>(`/vendor/conversations/${chatId}`);
      const chat = mapConversation(unwrapPayload<any>(response.data));
      const bride = await fetchBridePanel(chatId, chat.brideName);
      return { chat, bride, messages: [] };
    }
  },

  updateStatus: async (input: UpdateStatusInput): Promise<ChatSummary> => {
    const response = await api.patch<unknown>(
      `/vendor/conversations/${input.chatId}/status`,
      { status: input.status },
    );
    return mapConversation(unwrapPayload<any>(response.data));
  },

  sendMessage: (_input: SendMessageInput): Promise<Message> =>
    notAvailable("Sending a message"),

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
