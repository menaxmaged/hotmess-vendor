/**
 * Analytics Feature - Hooks
 */

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "./api";
import type { AnalyticsRange } from "./types";

export const analyticsKeys = {
  all: ["analytics"] as const,
  kpis: (range: AnalyticsRange) => [...analyticsKeys.all, "kpis", range] as const,
  funnel: (range: AnalyticsRange) => [...analyticsKeys.all, "funnel", range] as const,
  conversion: (range: AnalyticsRange) => [...analyticsKeys.all, "conversion", range] as const,
  sources: (range: AnalyticsRange) => [...analyticsKeys.all, "sources", range] as const,
};

export const useAnalyticsKpis = (range: AnalyticsRange) => {
  return useQuery({
    queryKey: analyticsKeys.kpis(range),
    queryFn: () => analyticsApi.getKpis(range),
  });
};

export const useAnalyticsFunnel = (range: AnalyticsRange) => {
  return useQuery({
    queryKey: analyticsKeys.funnel(range),
    queryFn: () => analyticsApi.getFunnel(range),
  });
};

export const useConversionRates = (range: AnalyticsRange) => {
  return useQuery({
    queryKey: analyticsKeys.conversion(range),
    queryFn: () => analyticsApi.getConversion(range),
  });
};

export const useSourceBreakdown = (range: AnalyticsRange) => {
  return useQuery({
    queryKey: analyticsKeys.sources(range),
    queryFn: () => analyticsApi.getSources(range),
  });
};
