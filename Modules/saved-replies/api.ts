/**
 * Saved Replies Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockSavedRepliesApi } from "./mock";
import type { CreateSavedReplyInput, SavedReply } from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

const liveSavedRepliesApi = {
  getSavedReplies: async (): Promise<SavedReply[]> => {
    const response = await api.get<unknown>("/vendor/saved-replies");
    return unwrap<SavedReply[]>(response.data);
  },

  createSavedReply: async (input: CreateSavedReplyInput): Promise<SavedReply> => {
    const response = await api.post<unknown>("/vendor/saved-replies", input);
    const created = unwrap<Partial<SavedReply>>(response.data);
    return { id: created.id ?? "", title: created.title ?? input.title, body: input.body };
  },

  deleteSavedReply: async (id: string): Promise<void> => {
    await api.delete(`/vendor/saved-replies/${id}`);
  },
};

export const savedRepliesApi: typeof liveSavedRepliesApi = USE_MOCK_DATA
  ? mockSavedRepliesApi
  : liveSavedRepliesApi;
