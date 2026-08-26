/**
 * Onboarding Checklist Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockOnboardingChecklistApi } from "./mock";
import type { ChecklistItem } from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

const liveOnboardingChecklistApi = {
  getChecklist: async (): Promise<ChecklistItem[]> => {
    const response = await api.get<unknown>("/vendor/onboarding-checklist");
    return unwrap<ChecklistItem[]>(response.data);
  },

  completeItem: async (itemId: string): Promise<ChecklistItem> => {
    const response = await api.post<unknown>(`/vendor/onboarding-checklist/${itemId}/complete`);
    return unwrap<ChecklistItem>(response.data);
  },
};

export const onboardingChecklistApi: typeof liveOnboardingChecklistApi = USE_MOCK_DATA
  ? mockOnboardingChecklistApi
  : liveOnboardingChecklistApi;
