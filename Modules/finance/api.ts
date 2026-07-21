/**
 * Finance Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockFinanceApi } from "./mock";
import type { FinanceOverview, FinanceRange } from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

const liveFinanceApi = {
  getOverview: async (range: FinanceRange): Promise<FinanceOverview> => {
    const response = await api.get<unknown>("/vendor/finance", { params: { range } });
    return unwrap<FinanceOverview>(response.data);
  },
};

export const financeApi: typeof liveFinanceApi = USE_MOCK_DATA ? mockFinanceApi : liveFinanceApi;
