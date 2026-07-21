/**
 * Analytics Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockAnalyticsApi } from "./mock";
import type { AnalyticsOverview, AnalyticsRange } from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

const liveAnalyticsApi = {
  getOverview: async (range: AnalyticsRange): Promise<AnalyticsOverview> => {
    const response = await api.get<unknown>("/vendor/analytics", { params: { range } });
    return unwrap<AnalyticsOverview>(response.data);
  },
};

export const analyticsApi: typeof liveAnalyticsApi = USE_MOCK_DATA
  ? mockAnalyticsApi
  : liveAnalyticsApi;
