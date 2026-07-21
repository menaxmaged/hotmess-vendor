/**
 * Sponsored Ads Feature - Hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adsApi } from "./api";
import type { CampaignInput } from "./types";

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

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CampaignInput) => adsApi.createCampaign(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adsKeys.all });
    },
  });
};
