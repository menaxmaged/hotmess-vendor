/**
 * Sponsored Ads Feature - Mock Data
 *
 * Mirrors the real route set (see api.ts). `payCampaign` rejects with the
 * same 503 the shipped backend returns while no payment provider is set.
 */

import { mockDelay, mockId } from "@/lib/mock-utils";
import type {
  AvailabilityParams,
  Campaign,
  CheckoutSession,
  CreateCampaignInput,
  DurationTier,
  Placement,
  PlacementAvailability,
  PlacementDetail,
  UpdateCreativeInput,
} from "./types";

const TIER_MULT: Record<DurationTier, number> = { one_week: 1, two_weeks: 1.8, one_month: 3.2 };

const PLACEMENTS: (Placement & { description: string; base: number })[] = [
  { id: "p1", key: "home_banner", nameEn: "Home banner", nameAr: "بانر الرئيسية", demandLabel: "Highest demand", previewImageKey: null, description: "Top of the bride home feed, per city.", base: 3500 },
  { id: "p2", key: "community_top", nameEn: "Community top", nameAr: "أعلى المجتمع", demandLabel: "High demand", previewImageKey: null, description: "Pinned card above the community feed.", base: 2800 },
  { id: "p3", key: "community_feed", nameEn: "Community feed", nameAr: "داخل المجتمع", demandLabel: null, previewImageKey: null, description: "Native card inside the community scroll.", base: 1500 },
  { id: "p4", key: "explore_top", nameEn: "Explore top", nameAr: "أعلى الاستكشاف", demandLabel: "High demand", previewImageKey: null, description: "First card in the Explore category grid.", base: 3000 },
  { id: "p5", key: "task_priority", nameEn: "Task priority", nameAr: "أولوية المهام", demandLabel: "Highest demand", previewImageKey: null, description: "First suggestion when a bride adds a task in your category.", base: 4200 },
  { id: "p6", key: "push_campaign", nameEn: "Push campaign", nameAr: "حملة إشعارات", demandLabel: null, previewImageKey: null, description: "Push to brides who saved you or browsed your category.", base: 3800 },
];

let campaigns: Campaign[] = [
  { id: "c1", name: "Spring atelier slots", status: "live", placementId: "p1", placementName: "Home banner", cityId: null, cityName: "Cairo", vendorCategoryId: null, durationTier: "two_weeks", startsOn: new Date(Date.now() - 5 * 86400000).toISOString(), endsOn: new Date(Date.now() + 9 * 86400000).toISOString(), headline: "Couture gowns, made for you", ctaText: "Book now", creativeFileId: null, impressions: 12400, clicks: 184, ctr: 1.48, roi: 4.2, amount: 6300, currencyCode: "EGP" },
  { id: "c2", name: "Engagement tasting", status: "pending_payment", placementId: "p2", placementName: "Community top", cityId: null, cityName: "Sahel", vendorCategoryId: null, durationTier: "one_week", startsOn: new Date(Date.now() + 3 * 86400000).toISOString(), endsOn: null, headline: null, ctaText: null, creativeFileId: null, impressions: 0, clicks: 0, ctr: null, roi: null, amount: 2800, currencyCode: "EGP" },
  { id: "c3", name: "Pre-wedding shoots", status: "completed", placementId: "p4", placementName: "Explore top", cityId: null, cityName: null, vendorCategoryId: null, durationTier: "one_month", startsOn: new Date(Date.now() - 60 * 86400000).toISOString(), endsOn: new Date(Date.now() - 30 * 86400000).toISOString(), headline: "Your story, beautifully told", ctaText: "See portfolio", creativeFileId: null, impressions: 34200, clicks: 312, ctr: 0.91, roi: 2.1, amount: 9600, currencyCode: "EGP" },
];

const findCampaign = (id: string): Campaign => {
  const c = campaigns.find((x) => x.id === id);
  if (!c) throw new Error("Campaign not found");
  return c;
};

const patchCampaign = (id: string, patch: Partial<Campaign>): Campaign => {
  const next = { ...findCampaign(id), ...patch };
  campaigns = campaigns.map((c) => (c.id === id ? next : c));
  return next;
};

export const mockAdsApi = {
  getPlacements: async (): Promise<Placement[]> => {
    await mockDelay();
    return PLACEMENTS.map(({ description: _d, base: _b, ...p }) => p);
  },

  getPlacement: async (id: string): Promise<PlacementDetail> => {
    await mockDelay();
    const p = PLACEMENTS.find((x) => x.id === id);
    if (!p) throw new Error("Placement not found");
    const { base, ...rest } = p;
    return {
      ...rest,
      prices: (Object.keys(TIER_MULT) as DurationTier[]).map((durationTier) => ({
        durationTier,
        amount: Math.round(base * TIER_MULT[durationTier]),
        currencyCode: "EGP",
      })),
    };
  },

  getAvailability: async (_id: string, params: AvailabilityParams): Promise<PlacementAvailability> => {
    await mockDelay();
    return { month: params.month, slotsPerMonth: 4, booked: 3, remaining: 1 };
  },

  getCampaigns: async (): Promise<Campaign[]> => {
    await mockDelay();
    return campaigns;
  },

  getCampaign: async (id: string): Promise<Campaign> => {
    await mockDelay();
    return findCampaign(id);
  },

  createCampaign: async (input: CreateCampaignInput): Promise<Campaign> => {
    await mockDelay();
    const placement = PLACEMENTS.find((p) => p.id === input.placementId);
    const campaign: Campaign = {
      id: mockId(),
      name: input.name,
      status: "pending_payment",
      placementId: input.placementId,
      placementName: placement?.nameEn ?? null,
      cityId: input.cityId ?? null,
      cityName: null,
      vendorCategoryId: input.vendorCategoryId ?? null,
      durationTier: input.durationTier,
      startsOn: input.startsOn,
      endsOn: null,
      headline: input.headline ?? null,
      ctaText: input.ctaText ?? null,
      creativeFileId: input.creative ? mockId() : null,
      impressions: 0,
      clicks: 0,
      ctr: null,
      roi: null,
      amount: placement ? Math.round(placement.base * TIER_MULT[input.durationTier]) : null,
      currencyCode: "EGP",
    };
    campaigns = [campaign, ...campaigns];
    return campaign;
  },

  updateCreative: async (input: UpdateCreativeInput): Promise<Campaign> => {
    await mockDelay();
    return patchCampaign(input.id, {
      ...(input.headline !== undefined ? { headline: input.headline } : {}),
      ...(input.ctaText !== undefined ? { ctaText: input.ctaText } : {}),
      ...(input.creative ? { creativeFileId: mockId() } : {}),
    });
  },

  payCampaign: async (_id: string): Promise<CheckoutSession> => {
    await mockDelay();
    throw Object.assign(new Error("No payment provider is configured."), {
      response: {
        status: 503,
        data: { code: "payment_provider_unavailable", message_en: "No payment provider is configured." },
      },
    });
  },

  pauseCampaign: async (id: string): Promise<Campaign> => {
    await mockDelay();
    return patchCampaign(id, { status: "paused" });
  },

  resumeCampaign: async (id: string): Promise<Campaign> => {
    await mockDelay();
    return patchCampaign(id, { status: "live" });
  },

  cancelCampaign: async (id: string): Promise<Campaign> => {
    await mockDelay();
    return patchCampaign(id, { status: "cancelled" });
  },
};
