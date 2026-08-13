/**
 * Instagram Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockInstagramApi } from "./mock";
import type { ConnectInstagramInput, InstagramConnection } from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

const liveInstagramApi = {
  getConnection: async (): Promise<InstagramConnection> => {
    const response = await api.get<unknown>("/vendor/instagram");
    return unwrap<InstagramConnection>(response.data);
  },

  connect: async (input: ConnectInstagramInput): Promise<InstagramConnection> => {
    const response = await api.post<unknown>("/vendor/instagram/connect", input);
    return unwrap<InstagramConnection>(response.data);
  },

  disconnect: async (): Promise<InstagramConnection> => {
    const response = await api.delete<unknown>("/vendor/instagram");
    return unwrap<InstagramConnection>(response.data);
  },
};

export const instagramApi: typeof liveInstagramApi = USE_MOCK_DATA
  ? mockInstagramApi
  : liveInstagramApi;
