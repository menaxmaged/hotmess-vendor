/**
 * Onboarding Checklist Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { onboardingChecklistApi } from "./api";

export const onboardingChecklistKeys = {
  all: ["onboarding-checklist"] as const,
};

export const useOnboardingChecklist = () => {
  return useQuery({
    queryKey: onboardingChecklistKeys.all,
    queryFn: onboardingChecklistApi.getChecklist,
  });
};

export const useCompleteChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => onboardingChecklistApi.completeItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingChecklistKeys.all }),
    onError: (error) => console.error("Complete checklist item error:", getErrorMessage(error)),
  });
};
