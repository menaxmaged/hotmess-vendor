/**
 * Sponsored Ads Feature - Mock Data
 */

import { mockDelay } from "@/lib/mock-utils";
import type { AdsData } from "./types";

const MOCK_ADS: AdsData = {
  roiX: 4.2,
  spent: 18000,
  quoted: 75000,
  placements: [
    { id: "p1", name: "Home banner", description: "Top of bride home feed, per city.", demand: "Highest", slots: "4 slots/month", priceFrom: 3500 },
    { id: "p2", name: "Community top", description: "Pinned card above community feed, per city.", demand: "High", slots: "4 slots/month", priceFrom: 2800 },
    { id: "p3", name: "Community feed", description: "Native card inside community scroll.", demand: "Medium", slots: "16–24 slots/month", priceFrom: 1500 },
    { id: "p4", name: "Explore top", description: "First card in the Explore category grid.", demand: "High", slots: "12 slots/category", priceFrom: 3000 },
    { id: "p5", name: "Task priority", description: "First suggestion when a bride adds a task in your category.", demand: "Highest", slots: "12 slots/category", priceFrom: 4200 },
    { id: "p6", name: "Push campaign", description: "Targeted push to brides who saved you or browsed your category.", demand: "High", slots: "12–16/month", priceFrom: 3800 },
  ],
  campaigns: [
    { id: "c1", name: "Spring atelier slots", placement: "Home banner · Cairo", status: "active", impressions: 12400, clicks: 184 },
    { id: "c2", name: "Engagement tasting", placement: "Community · Sahel", status: "pending", impressions: 0, clicks: 0 },
    { id: "c3", name: "Pre-wedding shoots", placement: "Explore · Photo", status: "completed", impressions: 34200, clicks: 312 },
  ],
};

export const mockAdsApi = {
  getAds: async (): Promise<AdsData> => {
    await mockDelay();
    return MOCK_ADS;
  },
};
