/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Inbox Feature - API Service
 */

import { api, apiFormData } from "@/lib/api-client";
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

export const inboxApi = {
  getChats: async (params?: ChatListParams): Promise<ChatListResponse> => {
    const response = await api.get<unknown>("/vendor/chats", { params });
    return unwrapPayload<ChatListResponse>(response.data);
  },

  getChat: async (chatId: string): Promise<ChatThread> => {
    const response = await api.get<unknown>(`/vendor/chats/${chatId}`);
    return unwrapPayload<ChatThread>(response.data);
  },

  sendMessage: async (input: SendMessageInput): Promise<Message> => {
    if (input.attachments?.length) {
      const formData = new FormData();
      if (input.text) formData.append("text", input.text);
      input.attachments.forEach((file) => {
        formData.append("attachments", file as any);
      });
      const response = await apiFormData.post<unknown>(
        `/vendor/chats/${input.chatId}/messages`,
        formData,
      );
      return unwrapPayload<Message>(response.data);
    }

    const response = await api.post<unknown>(
      `/vendor/chats/${input.chatId}/messages`,
      { text: input.text },
    );
    return unwrapPayload<Message>(response.data);
  },

  updateStatus: async (input: UpdateStatusInput): Promise<ChatSummary> => {
    const response = await api.patch<unknown>(
      `/vendor/chats/${input.chatId}/status`,
      { status: input.status },
    );
    return unwrapPayload<ChatSummary>(response.data);
  },

  assignChat: async (input: AssignChatInput): Promise<ChatSummary> => {
    const response = await api.patch<unknown>(
      `/vendor/chats/${input.chatId}/assign`,
      { assigneeId: input.assigneeId },
    );
    return unwrapPayload<ChatSummary>(response.data);
  },

  togglePin: async (chatId: string, pinned: boolean): Promise<ChatSummary> => {
    const response = await api.patch<unknown>(
      `/vendor/chats/${chatId}/pin`,
      { pinned },
    );
    return unwrapPayload<ChatSummary>(response.data);
  },

  toggleArchive: async (
    chatId: string,
    archived: boolean,
  ): Promise<ChatSummary> => {
    const response = await api.patch<unknown>(
      `/vendor/chats/${chatId}/archive`,
      { archived },
    );
    return unwrapPayload<ChatSummary>(response.data);
  },

  setFollowUp: async (input: SetFollowUpInput): Promise<ChatSummary> => {
    const response = await api.patch<unknown>(
      `/vendor/chats/${input.chatId}/follow-up`,
      { followUpDate: input.followUpDate },
    );
    return unwrapPayload<ChatSummary>(response.data);
  },

  addNote: async (input: AddNoteInput): Promise<Message> => {
    const response = await api.post<unknown>(
      `/vendor/chats/${input.chatId}/notes`,
      { note: input.note },
    );
    return unwrapPayload<Message>(response.data);
  },

  markUnread: async (chatId: string): Promise<ChatSummary> => {
    const response = await api.patch<unknown>(
      `/vendor/chats/${chatId}/mark-unread`,
      {},
    );
    return unwrapPayload<ChatSummary>(response.data);
  },
};
