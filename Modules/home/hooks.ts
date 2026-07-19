/**
 * Home Dashboard Feature - Hooks
 */

import { useQuery } from "@tanstack/react-query";
import { homeApi } from "./api";

export const homeKeys = {
  all: ["home"] as const,
  overview: () => [...homeKeys.all, "overview"] as const,
  ads: () => [...homeKeys.all, "ads-summary"] as const,
  subscription: () => [...homeKeys.all, "subscription-summary"] as const,
};

export const useHomeOverview = () => {
  return useQuery({
    queryKey: homeKeys.overview(),
    queryFn: homeApi.getOverview,
  });
};

export const useHomeAdsSummary = () => {
  return useQuery({
    queryKey: homeKeys.ads(),
    queryFn: homeApi.getAdsSummary,
  });
};

export const useHomeSubscriptionSummary = () => {
  return useQuery({
    queryKey: homeKeys.subscription(),
    queryFn: homeApi.getSubscriptionSummary,
  });
};
