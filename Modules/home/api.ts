/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Home Dashboard Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockHomeApi } from "./mock";
import type { AdsSummary, HomeOverview, SubscriptionSummary } from "./types";

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

const liveHomeApi = {
  getOverview: async (): Promise<HomeOverview> => {
    const response = await api.get<unknown>("/vendor/home/overview");
    return unwrapPayload<HomeOverview>(response.data);
  },

  getAdsSummary: async (): Promise<AdsSummary> => {
    const response = await api.get<unknown>("/vendor/home/ads-summary");
    return unwrapPayload<AdsSummary>(response.data);
  },

  getSubscriptionSummary: async (): Promise<SubscriptionSummary> => {
    const response = await api.get<unknown>("/vendor/home/subscription-summary");
    return unwrapPayload<SubscriptionSummary>(response.data);
  },
};

export const homeApi: typeof liveHomeApi = USE_MOCK_DATA ? mockHomeApi : liveHomeApi;
