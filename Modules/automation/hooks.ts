/**
 * Automation Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { automationApi } from "./api";
import type { CreateRuleInput, SetWelcomeFlowInput, UpdateRuleInput } from "./types";

export const automationKeys = {
  all: ["automation"] as const,
  rules: () => [...automationKeys.all, "rules"] as const,
  welcomeFlow: () => [...automationKeys.all, "welcome-flow"] as const,
  mergeFields: () => [...automationKeys.all, "merge-fields"] as const,
};

// No screen renders rule CRUD yet — automation.tsx only has the welcome-flow
// form. Exposed and callable, same "API-only, no UI" pattern as prior days.
export const useAutoAssignRules = () => {
  return useQuery({
    queryKey: automationKeys.rules(),
    queryFn: automationApi.getRules,
  });
};

const useInvalidateRules = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: automationKeys.rules() });
};

export const useCreateAutoAssignRule = () => {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: (input: CreateRuleInput) => automationApi.createRule(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Create rule error:", getErrorMessage(error)),
  });
};

export const useUpdateAutoAssignRule = () => {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: (input: UpdateRuleInput) => automationApi.updateRule(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Update rule error:", getErrorMessage(error)),
  });
};

export const useDeleteAutoAssignRule = () => {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: (ruleId: string) => automationApi.deleteRule(ruleId),
    onSuccess: invalidate,
    onError: (error) => console.error("Delete rule error:", getErrorMessage(error)),
  });
};

export const useWelcomeFlow = () => {
  return useQuery({
    queryKey: automationKeys.welcomeFlow(),
    queryFn: automationApi.getWelcomeFlow,
  });
};

export const useSetWelcomeFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetWelcomeFlowInput) => automationApi.setWelcomeFlow(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: automationKeys.welcomeFlow() }),
    onError: (error) => console.error("Set welcome flow error:", getErrorMessage(error)),
  });
};

export const useMergeFields = () => {
  return useQuery({
    queryKey: automationKeys.mergeFields(),
    queryFn: automationApi.getMergeFields,
    staleTime: 1000 * 60 * 30,
  });
};
