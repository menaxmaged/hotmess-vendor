/**
 * Account Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockAccountApi } from "./mock";
import type { AccountDeletion, Me, UpdateMeInput } from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

const liveAccountApi = {
  getMe: async (): Promise<Me> => {
    const response = await api.get<unknown>("/users/me");
    return unwrap<Me>(response.data);
  },

  // Strings are trimmed server-side; a whitespace-only value is a 422.
  updateMe: async (input: UpdateMeInput): Promise<Me> => {
    const response = await api.patch<unknown>("/users/me", input);
    return unwrap<Me>(response.data);
  },

  // Revokes every session immediately; the row is purged after 30 days.
  deleteMe: async (): Promise<AccountDeletion> => {
    const response = await api.delete<unknown>("/users/me");
    return unwrap<AccountDeletion>(response.data);
  },
};

export const accountApi: typeof liveAccountApi = USE_MOCK_DATA ? mockAccountApi : liveAccountApi;
