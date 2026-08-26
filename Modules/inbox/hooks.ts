/**
 * Inbox Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inboxApi } from "./api";
import type {
    AddNoteInput,
    AssignChatInput,
    ChatListParams,
    SendMessageInput,
    SetFollowUpInput,
    UpdateStatusInput,
} from "./types";

export const inboxKeys = {
  all: ["inbox"] as const,
  lists: () => [...inboxKeys.all, "chats"] as const,
  list: (params?: ChatListParams) => [...inboxKeys.lists(), params ?? {}] as const,
  details: () => [...inboxKeys.all, "chat"] as const,
  detail: (chatId: string) => [...inboxKeys.details(), chatId] as const,
};

export const useChats = (params?: ChatListParams) => {
  return useQuery({
    queryKey: inboxKeys.list(params),
    queryFn: () => inboxApi.getChats(params),
  });
};

export const useChat = (chatId: string | undefined) => {
  return useQuery({
    queryKey: inboxKeys.detail(chatId ?? ""),
    queryFn: () => inboxApi.getChat(chatId as string),
    enabled: !!chatId,
  });
};

export const useConversationCounts = () => {
  return useQuery({
    queryKey: [...inboxKeys.all, "counts"] as const,
    queryFn: inboxApi.getCounts,
  });
};

const useInvalidateInbox = (chatId?: string) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: inboxKeys.lists() });
    if (chatId) {
      queryClient.invalidateQueries({ queryKey: inboxKeys.detail(chatId) });
    }
  };
};

export const useSendMessage = (chatId: string) => {
  const invalidate = useInvalidateInbox(chatId);
  return useMutation({
    mutationFn: (input: Omit<SendMessageInput, "chatId">) =>
      inboxApi.sendMessage({ chatId, ...input }),
    onSuccess: invalidate,
    onError: (error) => {
      console.error("Send message error:", getErrorMessage(error));
    },
  });
};

export const useUpdateChatStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateStatusInput) => inboxApi.updateStatus(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.detail(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, "counts"] });
    },
    onError: (error) => {
      console.error("Update status error:", getErrorMessage(error));
    },
  });
};

export const useAssignChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignChatInput) => inboxApi.assignChat(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.detail(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, "counts"] });
    },
    onError: (error) => {
      console.error("Assign chat error:", getErrorMessage(error));
    },
  });
};

export const useTogglePin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, pinned }: { chatId: string; pinned: boolean }) =>
      inboxApi.togglePin(chatId, pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.lists() });
    },
    onError: (error) => {
      console.error("Pin chat error:", getErrorMessage(error));
    },
  });
};

export const useToggleArchive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, archived }: { chatId: string; archived: boolean }) =>
      inboxApi.toggleArchive(chatId, archived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.lists() });
    },
    onError: (error) => {
      console.error("Archive chat error:", getErrorMessage(error));
    },
  });
};

export const useSetFollowUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetFollowUpInput) => inboxApi.setFollowUp(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.detail(variables.chatId) });
    },
    onError: (error) => {
      console.error("Set follow-up error:", getErrorMessage(error));
    },
  });
};

export const useAddNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddNoteInput) => inboxApi.addNote(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.detail(variables.chatId) });
    },
    onError: (error) => {
      console.error("Add note error:", getErrorMessage(error));
    },
  });
};
