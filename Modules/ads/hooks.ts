/**
 * Sponsored Ads Feature - Hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adsApi } from "./api";
import type { AvailabilityParams, CreateCampaignInput, UpdateCreativeInput } from "./types";

export const adsKeys = {
  all: ["ads"] as const,
  placements: () => [...adsKeys.all, "placements"] as const,
  placement: (id: string) => [...adsKeys.all, "placement", id] as const,
  availability: (id: string, params: AvailabilityParams) =>
    [...adsKeys.all, "availability", id, params] as const,
  campaigns: () => [...adsKeys.all, "campaigns"] as const,
};

export const usePlacements = () => {
  return useQuery({
    queryKey: adsKeys.placements(),
    queryFn: adsApi.getPlacements,
  });
};

export const usePlacement = (id: string | null) => {
  return useQuery({
    queryKey: adsKeys.placement(id ?? ""),
    queryFn: () => adsApi.getPlacement(id as string),
    enabled: !!id,
  });
};

export const useAvailability = (id: string | null, params: AvailabilityParams) => {
  return useQuery({
    queryKey: adsKeys.availability(id ?? "", params),
    queryFn: () => adsApi.getAvailability(id as string, params),
    enabled: !!id,
  });
};

export const useCampaigns = () => {
  return useQuery({
    queryKey: adsKeys.campaigns(),
    queryFn: adsApi.getCampaigns,
  });
};

export const useCampaign = (id: string | null) => {
  return useQuery({
    queryKey: [...adsKeys.campaigns(), id ?? ""] as const,
    queryFn: () => adsApi.getCampaign(id as string),
    enabled: !!id,
  });
};

const useInvalidateCampaigns = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: adsKeys.campaigns() });
    // availability moves once a slot is paid for or released
    queryClient.invalidateQueries({ queryKey: [...adsKeys.all, "availability"] });
  };
};

export const useCreateCampaign = () => {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: CreateCampaignInput) => adsApi.createCampaign(input),
    onSuccess: invalidate,
  });
};

export const useUpdateCreative = () => {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: UpdateCreativeInput) => adsApi.updateCreative(input),
    onSuccess: invalidate,
  });
};

export const usePayCampaign = () => {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (id: string) => adsApi.payCampaign(id),
    onSettled: invalidate,
  });
};

export const usePauseCampaign = () => {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (id: string) => adsApi.pauseCampaign(id),
    onSuccess: invalidate,
  });
};

export const useResumeCampaign = () => {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (id: string) => adsApi.resumeCampaign(id),
    onSuccess: invalidate,
  });
};

export const useCancelCampaign = () => {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (id: string) => adsApi.cancelCampaign(id),
    onSuccess: invalidate,
  });
};
