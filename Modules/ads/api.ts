/**
 * Sponsored Ads Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockAdsApi } from "./mock";
import type { AdsData, Campaign, CampaignInput } from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

const liveAdsApi = {
  getAds: async (): Promise<AdsData> => {
    const response = await api.get<unknown>("/vendor/ads");
    return unwrap<AdsData>(response.data);
  },

  createCampaign: async (input: CampaignInput): Promise<Campaign> => {
    const response = await api.post<unknown>("/vendor/ads/campaigns", input);
    return unwrap<Campaign>(response.data);
  },
};

export const adsApi: typeof liveAdsApi = USE_MOCK_DATA ? mockAdsApi : liveAdsApi;
