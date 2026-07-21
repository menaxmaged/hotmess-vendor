/**
 * Analytics Feature - Hooks
 */

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "./api";
import type { AnalyticsRange } from "./types";

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: (range: AnalyticsRange) => [...analyticsKeys.all, "overview", range] as const,
};

export const useAnalyticsOverview = (range: AnalyticsRange) => {
  return useQuery({
    queryKey: analyticsKeys.overview(range),
    queryFn: () => analyticsApi.getOverview(range),
  });
};
