/**
 * Inbox Feature Types
 */

// 15-status lead vocabulary — see PRD Section 13
export type LeadStatus =
  | "new_inquiry"
  | "needs_reply"
  | "needs_quotation"
  | "quotation_sent"
  | "needs_follow_up"
  | "waiting_for_bride"
  | "meeting_scheduled"
  | "tentative_booking"
  | "deposit_pending"
  | "booked"
  | "fully_paid"
  | "no_lead"
  | "lost_declined"
  | "unavailable"
  | "archived";

// Real backend's `sort` param only supports recent|oldest|follow_up — "unread"
// and "amount" have no server equivalent and fall back to "recent" in api.ts.
export type SortOption = "recent" | "unread" | "follow_up" | "amount";

export type AssigneeFilter = "all" | "me" | "unassigned" | string;

export interface TeamMemberLite {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface AssigneeBucket {
  id: AssigneeFilter;
  label: string;
  count: number;
}

export interface ChatSummary {
  id: string;
  brideName: string;
  brideAvatarUrl?: string | null;
  occasionType: string;
  eventDate: string | null;
  city: string | null;
  status: LeadStatus;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  assignee: TeamMemberLite | null;
  followUpDate?: string | null;
  pinned: boolean;
  archived: boolean;
  contractValue?: number | null;
  /** Server `isReadOnly` — the thread can no longer take bride-facing messages. Internal notes still work. */
  readOnly?: boolean;
}

export interface ChatListParams {
  assignee?: AssigneeFilter;
  status?: LeadStatus;
  sort?: SortOption;
  search?: string;
}

export interface ChatListResponse {
  chats: ChatSummary[];
}

// GET /vendor/conversations/counts — a status a lead is a real key only if at
// least one lead has it; `byAssignee` uses `unassigned` for the null bucket.
export interface ConversationCounts {
  total: number;
  byStatus: Partial<Record<LeadStatus, number>>;
  byAssignee: Record<string, number>;
}

export interface Attachment {
  url: string;
  name: string;
  type: string;
}

// GET /v1/conversations/{id}/messages `kind`. meeting_card and system are
// written server-side only — a client can never send them.
export type MessageKind = "text" | "file" | "meeting_card" | "system";

export interface MessageFile {
  id: string;
  originalName: string | null;
  mimeType: string;
  byteSize: number;
  /** Resolved to an absolute URL at the api.ts boundary. */
  url: string;
}

export interface Message {
  id: string;
  chatId: string;
  sender: "vendor" | "bride" | "system";
  authorName?: string;
  text?: string;
  attachments?: Attachment[];
  isNote?: boolean;
  kind?: MessageKind;
  file?: MessageFile | null;
  /** The bytes were swept; the message row survives. */
  fileExpired?: boolean;
  meetingProposalId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

/** Keyset page — `nextCursor` names a fixed position, so new messages never shift a boundary. */
export interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UnreadCount {
  conversations: number;
  messages: number;
}

export type MeetingStatus = "pending" | "confirmed" | "cancelled";

export interface MeetingProposal {
  id: string;
  conversationId: string;
  proposedByUserId: string;
  /** The meeting's own datetime, not when it was proposed. */
  proposedAt: string;
  note: string | null;
  status: MeetingStatus;
  respondedByUserId: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface ProposeMeetingInput {
  chatId: string;
  proposedAt: string;
  note?: string;
}

export interface OutgoingAttachment {
  uri: string;
  name: string;
  type: string;
}

export interface PaymentSummary {
  id: string;
  amount: number;
  type: "deposit" | "instalment" | "final";
  date: string;
}

export interface QuoteSummary {
  id: string;
  amount: number;
  sentAt: string;
  status: "sent" | "accepted" | "declined";
}

export interface MeetingSummary {
  id: string;
  type: "meeting" | "confirmed_booking" | "tentative_hold";
  date: string;
}

export interface BrideDetail {
  id: string;
  name: string;
  occasionType: string;
  eventDate: string | null;
  city: string | null;
  guestCount?: number | null;
  budgetRange?: string | null;
  source?: string | null;
  payments: PaymentSummary[];
  quotes: QuoteSummary[];
  meetings: MeetingSummary[];
}

export interface ChatThread {
  chat: ChatSummary;
  bride: BrideDetail;
  messages: Message[];
}

export interface SendMessageInput {
  chatId: string;
  text?: string;
  /** jpeg/png/webp/gif/pdf only — uploaded via POST /files first. */
  attachment?: OutgoingAttachment;
}

export interface UpdateStatusInput {
  chatId: string;
  status: LeadStatus;
}

export interface AssignChatInput {
  chatId: string;
  assigneeId: string | null;
}

export interface SetFollowUpInput {
  chatId: string;
  followUpDate: string | null;
}

export interface AddNoteInput {
  chatId: string;
  note: string;
}
