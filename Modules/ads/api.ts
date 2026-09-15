/**
 * Sponsored Ads Feature - API Service
 *
 * Real routes: GET /ads/placements(/{id}(/availability)) and
 * /vendor/ad-campaigns(/{id}(/pay|pause|resume)). The previous
 * /vendor/ads + /vendor/ads/campaigns paths never existed.
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { filesApi } from "@/Modules/files/api";
import { mockAdsApi } from "./mock";
import type {
  AvailabilityParams,
  Campaign,
  CheckoutSession,
  CreateCampaignInput,
  OutgoingFile,
  Placement,
  PlacementAvailability,
  PlacementDetail,
  PlacementPrice,
  UpdateCreativeInput,
} from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

/** Every money value in this API is an integer in minor units. */
const minorToMajor = (v: unknown): number | null => (typeof v === "number" ? v / 100 : null);
const numOrNull = (v: unknown): number | null => (typeof v === "number" ? v : null);

const mapPlacement = (raw: any): Placement => ({
  id: raw.id,
  key: raw.key,
  nameEn: raw.nameEn ?? raw.key ?? "Placement",
  nameAr: raw.nameAr ?? "",
  demandLabel: raw.demandLabel ?? null,
  previewImageKey: raw.previewImageKey ?? null,
});

// Detail schema is unpublished. The admin side's live-verified shape is
// `prices: {marketId, durationTier, amount}[]`; the vendor route already
// narrows to the caller's market, so every row here should be usable.
const mapPrice = (raw: any): PlacementPrice => ({
  durationTier: raw.durationTier,
  amount: minorToMajor(raw.amount ?? raw.amountMinor) ?? 0,
  currencyCode: raw.currencyCode ?? raw.currency?.code ?? null,
});

const mapPlacementDetail = (raw: any): PlacementDetail => ({
  ...mapPlacement(raw),
  description: raw.description ?? null,
  prices: ((raw.prices ?? raw.pricing ?? raw.tiers ?? []) as any[])
    .map(mapPrice)
    .filter((p) => !!p.durationTier),
});

// Campaign item schema is unpublished ("with impressions, clicks, CTR and
// ROI"). Field names follow the create body where one exists; nested
// placement/city objects and flat *Name fields are both accepted.
const mapCampaign = (raw: any): Campaign => ({
  id: raw.id,
  name: raw.name ?? "Untitled campaign",
  status: raw.status ?? "pending_payment",
  placementId: raw.placementId ?? raw.placement?.id ?? null,
  placementName: raw.placement?.nameEn ?? raw.placementName ?? null,
  cityId: raw.cityId ?? raw.city?.id ?? null,
  cityName: raw.city?.nameEn ?? raw.cityName ?? null,
  vendorCategoryId: raw.vendorCategoryId ?? null,
  durationTier: raw.durationTier ?? null,
  startsOn: raw.startsOn ?? raw.startDate ?? null,
  endsOn: raw.endsOn ?? raw.endDate ?? null,
  headline: raw.headline ?? null,
  ctaText: raw.ctaText ?? null,
  creativeFileId: raw.creativeFileId ?? null,
  impressions: raw.impressions ?? raw.stats?.impressions ?? 0,
  clicks: raw.clicks ?? raw.stats?.clicks ?? 0,
  ctr: numOrNull(raw.ctr ?? raw.stats?.ctr),
  roi: numOrNull(raw.roi ?? raw.stats?.roi),
  amount: minorToMajor(raw.amount ?? raw.priceAmount ?? raw.amountMinor),
  currencyCode: raw.currencyCode ?? null,
});

/**
 * Creative images go up as `vendor_portfolio`, not `chat_attachment`: the
 * files route says chat_attachment "is the only kind a sweep ever reclaims",
 * and a creative is referenced by a campaign, not a message — so it would be
 * swept. No creative-specific kind is documented.
 */
const uploadCreative = async (file: OutgoingFile): Promise<string> =>
  (await filesApi.upload(file, "vendor_portfolio")).id;

/** Shipped backend state: no payment provider, so /pay answers 503. */
export const isPaymentProviderUnavailable = (error: any): boolean =>
  error?.response?.status === 503 ||
  error?.response?.data?.code === "payment_provider_unavailable";

const liveAdsApi = {
  getPlacements: async (): Promise<Placement[]> => {
    const response = await api.get<unknown>("/ads/placements");
    const raw = unwrap<any[]>(response.data);
    return (Array.isArray(raw) ? raw : []).map(mapPlacement);
  },

  getPlacement: async (id: string): Promise<PlacementDetail> => {
    const response = await api.get<unknown>(`/ads/placements/${id}`);
    return mapPlacementDetail(unwrap<any>(response.data));
  },

  getAvailability: async (id: string, params: AvailabilityParams): Promise<PlacementAvailability> => {
    const response = await api.get<unknown>(`/ads/placements/${id}/availability`, {
      params: {
        month: params.month,
        cityId: params.cityId || undefined,
        vendorCategoryId: params.vendorCategoryId || undefined,
      },
    });
    return unwrap<PlacementAvailability>(response.data);
  },

  getCampaigns: async (): Promise<Campaign[]> => {
    const response = await api.get<unknown>("/vendor/ad-campaigns");
    const raw = unwrap<any[]>(response.data);
    return (Array.isArray(raw) ? raw : []).map(mapCampaign);
  },

  getCampaign: async (id: string): Promise<Campaign> => {
    const response = await api.get<unknown>(`/vendor/ad-campaigns/${id}`);
    return mapCampaign(unwrap<any>(response.data));
  },

  // Builder step 4. No availability check here — that happens at payment
  // settlement under a row lock. Created as `pending_payment`.
  createCampaign: async (input: CreateCampaignInput): Promise<Campaign> => {
    const creativeFileId = input.creative ? await uploadCreative(input.creative) : null;
    const response = await api.post<unknown>("/vendor/ad-campaigns", {
      placementId: input.placementId,
      name: input.name,
      durationTier: input.durationTier,
      startsOn: input.startsOn,
      cityId: input.cityId ?? null,
      vendorCategoryId: input.vendorCategoryId ?? null,
      headline: input.headline?.trim() || null,
      ctaText: input.ctaText?.trim() || null,
      creativeFileId,
    });
    return mapCampaign(unwrap<any>(response.data));
  },

  updateCreative: async (input: UpdateCreativeInput): Promise<Campaign> => {
    const body: Record<string, unknown> = {};
    if (input.headline !== undefined) body.headline = input.headline?.trim() || null;
    if (input.ctaText !== undefined) body.ctaText = input.ctaText?.trim() || null;
    if (input.creative) body.creativeFileId = await uploadCreative(input.creative);
    const response = await api.patch<unknown>(`/vendor/ad-campaigns/${input.id}`, body);
    return mapCampaign(unwrap<any>(response.data));
  },

  // Opens a checkout only — the campaign goes live when the webhook lands.
  payCampaign: async (id: string): Promise<CheckoutSession> => {
    const response = await api.post<unknown>(`/vendor/ad-campaigns/${id}/pay`);
    return unwrap<CheckoutSession>(response.data);
  },

  pauseCampaign: async (id: string): Promise<Campaign> => {
    const response = await api.post<unknown>(`/vendor/ad-campaigns/${id}/pause`);
    return mapCampaign(unwrap<any>(response.data));
  },

  resumeCampaign: async (id: string): Promise<Campaign> => {
    const response = await api.post<unknown>(`/vendor/ad-campaigns/${id}/resume`);
    return mapCampaign(unwrap<any>(response.data));
  },

  // Refund only if the platform's ad_refund_policy allows it (default: none).
  cancelCampaign: async (id: string): Promise<Campaign> => {
    const response = await api.delete<unknown>(`/vendor/ad-campaigns/${id}`);
    return mapCampaign(unwrap<any>(response.data));
  },
};

export const adsApi: typeof liveAdsApi = USE_MOCK_DATA ? mockAdsApi : liveAdsApi;
