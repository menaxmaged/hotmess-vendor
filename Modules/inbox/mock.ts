/**
 * Inbox Feature - Mock Data
 */

import { mockDelay, mockId } from "@/lib/mock-utils";
import type {
    AddNoteInput,
    AssignChatInput,
    ChatListParams,
    ChatListResponse,
    ChatSummary,
    ChatThread,
    Message,
    SendMessageInput,
    SetFollowUpInput,
    UpdateStatusInput,
} from "./types";

const OWNER = { id: "mock-vendor-1", name: "Amira Studio" };
const TEAM = [
  { id: "tm-1", name: "Mona Adel" },
  { id: "tm-2", name: "Youssef Nabil" },
];

const now = Date.now();
const daysFromNow = (days: number) => new Date(now + days * 86400000).toISOString();
const hoursAgo = (hours: number) => new Date(now - hours * 3600000).toISOString();

const chats: ChatSummary[] = [
  {
    id: "chat-1",
    brideName: "Salma Adel",
    occasionType: "Wedding",
    eventDate: daysFromNow(120),
    city: "Cairo",
    status: "new_inquiry",
    unreadCount: 2,
    lastMessagePreview: "Hi! I love your bridal collection, do you have availability in June?",
    lastMessageAt: hoursAgo(1),
    assignee: null,
    followUpDate: null,
    pinned: true,
    archived: false,
    contractValue: null,
  },
  {
    id: "chat-2",
    brideName: "Nourhan Samir",
    occasionType: "Engagement",
    eventDate: daysFromNow(60),
    city: "Giza",
    status: "needs_quotation",
    unreadCount: 0,
    lastMessagePreview: "That sounds great, can you send me a quote for the silver package?",
    lastMessageAt: hoursAgo(5),
    assignee: TEAM[0]!,
    followUpDate: daysFromNow(1),
    pinned: false,
    archived: false,
    contractValue: null,
  },
  {
    id: "chat-3",
    brideName: "Farida Hussein",
    occasionType: "Wedding",
    eventDate: daysFromNow(200),
    city: "Cairo",
    status: "quotation_sent",
    unreadCount: 0,
    lastMessagePreview: "Quote sent — EGP 65,000 for the Premium Bridal package.",
    lastMessageAt: hoursAgo(20),
    assignee: { id: OWNER.id, name: OWNER.name },
    followUpDate: daysFromNow(3),
    pinned: false,
    archived: false,
    contractValue: 65000,
  },
  {
    id: "chat-4",
    brideName: "Mariam Tarek",
    occasionType: "Photography",
    eventDate: daysFromNow(45),
    city: "Alexandria",
    status: "booked",
    unreadCount: 0,
    lastMessagePreview: "Perfect, see you at the fitting on the 12th!",
    lastMessageAt: hoursAgo(30),
    assignee: TEAM[1]!,
    followUpDate: null,
    pinned: false,
    archived: false,
    contractValue: 32000,
  },
  {
    id: "chat-5",
    brideName: "Rana Fathy",
    occasionType: "Wedding",
    eventDate: daysFromNow(10),
    city: "Cairo",
    status: "unavailable",
    unreadCount: 0,
    lastMessagePreview: "Unfortunately we're fully booked that weekend.",
    lastMessageAt: hoursAgo(72),
    assignee: null,
    followUpDate: null,
    pinned: false,
    archived: false,
    contractValue: null,
  },
  {
    id: "chat-6",
    brideName: "Dina Kamal",
    occasionType: "Engagement",
    eventDate: daysFromNow(-5),
    city: "Cairo",
    status: "fully_paid",
    unreadCount: 0,
    lastMessagePreview: "Thank you so much, everything was perfect!",
    lastMessageAt: hoursAgo(200),
    assignee: { id: OWNER.id, name: OWNER.name },
    followUpDate: null,
    pinned: false,
    archived: false,
    contractValue: 48000,
  },
];

const messagesByChat: Record<string, Message[]> = {
  "chat-1": [
    {
      id: mockId(),
      chatId: "chat-1",
      sender: "bride",
      authorName: "Salma Adel",
      text: "Hi! I love your bridal collection, do you have availability in June?",
      createdAt: hoursAgo(1),
    },
  ],
  "chat-2": [
    {
      id: mockId(),
      chatId: "chat-2",
      sender: "bride",
      authorName: "Nourhan Samir",
      text: "That sounds great, can you send me a quote for the silver package?",
      createdAt: hoursAgo(5),
    },
    {
      id: mockId(),
      chatId: "chat-2",
      sender: "vendor",
      text: "Absolutely, putting a quote together now!",
      createdAt: hoursAgo(4),
    },
  ],
  "chat-3": [
    {
      id: mockId(),
      chatId: "chat-3",
      sender: "vendor",
      text: "Quote sent — EGP 65,000 for the Premium Bridal package.",
      createdAt: hoursAgo(20),
    },
  ],
  "chat-4": [
    {
      id: mockId(),
      chatId: "chat-4",
      sender: "bride",
      authorName: "Mariam Tarek",
      text: "Perfect, see you at the fitting on the 12th!",
      createdAt: hoursAgo(30),
    },
  ],
  "chat-5": [
    {
      id: mockId(),
      chatId: "chat-5",
      sender: "vendor",
      text: "Unfortunately we're fully booked that weekend.",
      createdAt: hoursAgo(72),
    },
  ],
  "chat-6": [
    {
      id: mockId(),
      chatId: "chat-6",
      sender: "bride",
      authorName: "Dina Kamal",
      text: "Thank you so much, everything was perfect!",
      createdAt: hoursAgo(200),
    },
  ],
};

const brideDetailByChat: Record<string, ChatThread["bride"]> = {
  "chat-1": {
    id: "bride-1",
    name: "Salma Adel",
    occasionType: "Wedding",
    eventDate: daysFromNow(120),
    city: "Cairo",
    guestCount: 180,
    budgetRange: "EGP 50,000 – 80,000",
    source: "Instagram",
    payments: [],
    quotes: [],
    meetings: [],
  },
  "chat-2": {
    id: "bride-2",
    name: "Nourhan Samir",
    occasionType: "Engagement",
    eventDate: daysFromNow(60),
    city: "Giza",
    guestCount: 60,
    budgetRange: "EGP 20,000 – 30,000",
    source: "Hot Mess search",
    payments: [],
    quotes: [],
    meetings: [],
  },
  "chat-3": {
    id: "bride-3",
    name: "Farida Hussein",
    occasionType: "Wedding",
    eventDate: daysFromNow(200),
    city: "Cairo",
    guestCount: 220,
    budgetRange: "EGP 60,000 – 90,000",
    source: "Referral",
    payments: [],
    quotes: [{ id: mockId(), amount: 65000, sentAt: hoursAgo(20), status: "sent" }],
    meetings: [{ id: mockId(), type: "meeting", date: daysFromNow(5) }],
  },
  "chat-4": {
    id: "bride-4",
    name: "Mariam Tarek",
    occasionType: "Photography",
    eventDate: daysFromNow(45),
    city: "Alexandria",
    guestCount: 90,
    budgetRange: "EGP 30,000 – 40,000",
    source: "Instagram",
    payments: [{ id: mockId(), amount: 8000, type: "deposit", date: hoursAgo(200) }],
    quotes: [{ id: mockId(), amount: 32000, sentAt: hoursAgo(250), status: "accepted" }],
    meetings: [{ id: mockId(), type: "confirmed_booking", date: daysFromNow(45) }],
  },
  "chat-5": {
    id: "bride-5",
    name: "Rana Fathy",
    occasionType: "Wedding",
    eventDate: daysFromNow(10),
    city: "Cairo",
    guestCount: 150,
    budgetRange: "EGP 40,000 – 60,000",
    source: "Hot Mess search",
    payments: [],
    quotes: [],
    meetings: [],
  },
  "chat-6": {
    id: "bride-6",
    name: "Dina Kamal",
    occasionType: "Engagement",
    eventDate: daysFromNow(-5),
    city: "Cairo",
    guestCount: 40,
    budgetRange: "EGP 40,000 – 50,000",
    source: "Referral",
    payments: [
      { id: mockId(), amount: 12000, type: "deposit", date: hoursAgo(400) },
      { id: mockId(), amount: 36000, type: "final", date: hoursAgo(210) },
    ],
    quotes: [{ id: mockId(), amount: 48000, sentAt: hoursAgo(410), status: "accepted" }],
    meetings: [{ id: mockId(), type: "confirmed_booking", date: daysFromNow(-5) }],
  },
};

const buildBuckets = () => {
  const counts = { all: 0, me: 0, unassigned: 0 } as Record<string, number>;
  for (const member of TEAM) counts[member.id] = 0;

  for (const chat of chats) {
    if (chat.archived) continue;
    counts.all!++;
    if (!chat.assignee) counts.unassigned!++;
    else if (chat.assignee.id === OWNER.id) counts.me!++;
    else counts[chat.assignee.id] = (counts[chat.assignee.id] ?? 0) + 1;
  }

  return [
    { id: "all" as const, label: "All", count: counts.all! },
    { id: "me" as const, label: "Me", count: counts.me! },
    ...TEAM.map((m) => ({ id: m.id, label: m.name, count: counts[m.id] ?? 0 })),
    { id: "unassigned" as const, label: "Unassigned", count: counts.unassigned! },
  ];
};

const matchesAssignee = (chat: ChatSummary, assignee?: string) => {
  if (!assignee || assignee === "all") return true;
  if (assignee === "me") return chat.assignee?.id === OWNER.id;
  if (assignee === "unassigned") return !chat.assignee;
  return chat.assignee?.id === assignee;
};

const sortChats = (list: ChatSummary[], sort?: string) => {
  const sorted = [...list];
  switch (sort) {
    case "unread":
      return sorted.sort((a, b) => b.unreadCount - a.unreadCount);
    case "follow_up":
      return sorted.sort((a, b) => {
        if (!a.followUpDate) return 1;
        if (!b.followUpDate) return -1;
        return new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
      });
    case "amount":
      return sorted.sort((a, b) => (b.contractValue ?? 0) - (a.contractValue ?? 0));
    default:
      return sorted.sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      );
  }
};

const findChat = (chatId: string): ChatSummary => {
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) throw new Error(`Mock chat not found: ${chatId}`);
  return chat;
};

export const mockInboxApi = {
  getChats: async (params?: ChatListParams): Promise<ChatListResponse> => {
    await mockDelay();
    let filtered = chats.filter((c) => !c.archived);
    filtered = filtered.filter((c) => matchesAssignee(c, params?.assignee));
    if (params?.status) filtered = filtered.filter((c) => c.status === params.status);
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.brideName.toLowerCase().includes(q) ||
          c.occasionType.toLowerCase().includes(q) ||
          (c.city ?? "").toLowerCase().includes(q) ||
          c.lastMessagePreview.toLowerCase().includes(q),
      );
    }
    filtered = sortChats(filtered, params?.sort);

    return { chats: filtered, assigneeBuckets: buildBuckets() };
  },

  getChat: async (chatId: string): Promise<ChatThread> => {
    await mockDelay();
    const chat = findChat(chatId);
    const bride = brideDetailByChat[chatId];
    if (!bride) throw new Error(`Mock bride detail not found: ${chatId}`);
    return { chat, bride, messages: messagesByChat[chatId] ?? [] };
  },

  sendMessage: async (input: SendMessageInput): Promise<Message> => {
    await mockDelay(200);
    const message: Message = {
      id: mockId(),
      chatId: input.chatId,
      sender: "vendor",
      text: input.text,
      attachments: input.attachments?.map((a) => ({ url: a.uri, name: a.name, type: a.type })),
      createdAt: new Date().toISOString(),
    };
    messagesByChat[input.chatId] = [...(messagesByChat[input.chatId] ?? []), message];

    const chat = findChat(input.chatId);
    chat.lastMessagePreview = input.text ?? "Sent an attachment";
    chat.lastMessageAt = message.createdAt;

    return message;
  },

  updateStatus: async (input: UpdateStatusInput): Promise<ChatSummary> => {
    await mockDelay(200);
    const chat = findChat(input.chatId);
    chat.status = input.status;
    return chat;
  },

  assignChat: async (input: AssignChatInput): Promise<ChatSummary> => {
    await mockDelay(200);
    const chat = findChat(input.chatId);
    const member = [OWNER, ...TEAM].find((m) => m.id === input.assigneeId);
    chat.assignee = member ? { id: member.id, name: member.name } : null;
    return chat;
  },

  togglePin: async (chatId: string, pinned: boolean): Promise<ChatSummary> => {
    await mockDelay(150);
    const chat = findChat(chatId);
    chat.pinned = pinned;
    return chat;
  },

  toggleArchive: async (chatId: string, archived: boolean): Promise<ChatSummary> => {
    await mockDelay(150);
    const chat = findChat(chatId);
    chat.archived = archived;
    return chat;
  },

  setFollowUp: async (input: SetFollowUpInput): Promise<ChatSummary> => {
    await mockDelay(150);
    const chat = findChat(input.chatId);
    chat.followUpDate = input.followUpDate;
    return chat;
  },

  addNote: async (input: AddNoteInput): Promise<Message> => {
    await mockDelay(200);
    const note: Message = {
      id: mockId(),
      chatId: input.chatId,
      sender: "system",
      text: input.note,
      isNote: true,
      createdAt: new Date().toISOString(),
    };
    messagesByChat[input.chatId] = [...(messagesByChat[input.chatId] ?? []), note];
    return note;
  },

  markUnread: async (chatId: string): Promise<ChatSummary> => {
    await mockDelay(150);
    const chat = findChat(chatId);
    chat.unreadCount = Math.max(chat.unreadCount, 1);
    return chat;
  },
};
