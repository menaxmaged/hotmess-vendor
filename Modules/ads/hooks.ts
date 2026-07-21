/**
 * Sponsored Ads Feature - Hooks
 */

import { useQuery } from "@tanstack/react-query";
import { adsApi } from "./api";

export const adsKeys = {
  all: ["ads"] as const,
  data: () => [...adsKeys.all, "data"] as const,
};

export const useAds = () => {
  return useQuery({
    queryKey: adsKeys.data(),
    queryFn: adsApi.getAds,
  });
};
