/**
 * Automation Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockAutomationApi } from "./mock";
import type {
    AutoAssignRule,
    CreateRuleInput,
    MergeField,
    SetWelcomeFlowInput,
    UpdateRuleInput,
    WelcomeFlow,
} from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

const liveAutomationApi = {
  getRules: async (): Promise<AutoAssignRule[]> => {
    const response = await api.get<unknown>("/vendor/automation/auto-assign-rules");
    return unwrap<AutoAssignRule[]>(response.data);
  },

  createRule: async (input: CreateRuleInput): Promise<AutoAssignRule> => {
    const response = await api.post<unknown>("/vendor/automation/auto-assign-rules", input);
    const created = unwrap<Partial<AutoAssignRule>>(response.data);
    return {
      id: created.id ?? "",
      name: created.name ?? input.name,
      criteria: input.criteria,
      assignToMemberId: input.assignToMemberId ?? null,
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
      firedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  updateRule: async (input: UpdateRuleInput): Promise<void> => {
    const { ruleId, ...rest } = input;
    await api.patch<unknown>(`/vendor/automation/auto-assign-rules/${ruleId}`, rest);
  },

  deleteRule: async (ruleId: string): Promise<void> => {
    await api.delete(`/vendor/automation/auto-assign-rules/${ruleId}`);
  },

  getWelcomeFlow: async (): Promise<WelcomeFlow> => {
    const response = await api.get<unknown>("/vendor/automation/welcome-flow");
    return unwrap<WelcomeFlow>(response.data);
  },

  setWelcomeFlow: async (input: SetWelcomeFlowInput): Promise<WelcomeFlow> => {
    const response = await api.put<unknown>("/vendor/automation/welcome-flow", input);
    return unwrap<WelcomeFlow>(response.data);
  },

  getMergeFields: async (): Promise<MergeField[]> => {
    const response = await api.get<unknown>("/vendor/automation/merge-fields");
    return unwrap<MergeField[]>(response.data);
  },
};

export const automationApi: typeof liveAutomationApi = USE_MOCK_DATA
  ? mockAutomationApi
  : liveAutomationApi;
