/**
 * Finance Feature - Hooks
 */

import { useQuery } from "@tanstack/react-query";
import { financeApi } from "./api";
import type { FinanceRange } from "./types";

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
