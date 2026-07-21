/**
 * Finance Feature - Hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "./api";
import type { AddPaymentInput, FinanceRange } from "./types";

export const financeKeys = {
  all: ["finance"] as const,
  overview: (range: FinanceRange) => [...financeKeys.all, "overview", range] as const,
};

export const useFinanceOverview = (range: FinanceRange) => {
  return useQuery({
    queryKey: financeKeys.overview(range),
    queryFn: () => financeApi.getOverview(range),
  });
};

export const useAddPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddPaymentInput) => financeApi.addPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
};
