/**
 * Sponsored Ads Feature Types
 *
 * The spec publishes the placement catalogue row and the availability shape,
 * but NOT the campaign or placement-detail item schemas (`{type: object}`).
 * Those fields are mapped defensively in api.ts and optional/nullable here.
 * Money is major units — converted from the API's minor units at the api.ts
 * boundary, like every other module.
 */

export type PlacementKey =
  | "home_banner"
  | "community_top"
  | "community_feed"
  | "explore_top"
  | "task_priority"
  | "push_campaign";

export type DurationTier = "one_week" | "two_weeks" | "one_month";

/** GET /v1/ads/placements row — published schema. */
export interface Placement {
  id: string;
  key: PlacementKey | string;
  nameEn: string;
  nameAr: string;
  demandLabel: string | null;
  previewImageKey: string | null;
}

export interface PlacementPrice {
  durationTier: DurationTier;
  amount: number;
  currencyCode: string | null;
}

/** GET /v1/ads/placements/{id} — "tiered pricing for the caller's market". */
export interface PlacementDetail extends Placement {
  description: string | null;
  prices: PlacementPrice[];
}

/** GET /v1/ads/placements/{id}/availability — published schema. */
export interface PlacementAvailability {
  month: string;
  slotsPerMonth: number;
  booked: number;
  remaining: number;
}

export interface AvailabilityParams {
  cityId?: string;
  vendorCategoryId?: string;
  /** Any date-time inside the month. */
  month: string;
}

/**
 * Known values from the spec's prose: created as `pending_payment`, a webhook
 * moves it live, vendors can pause/resume, DELETE cancels. Admin side adds
 * `flagged`/`removed`. Kept open-ended since no enum is published.
 */
export type CampaignStatus =
  | "pending_payment"
  | "scheduled"
  | "live"
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "flagged"
  | "removed";

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus | string;
  placementId: string | null;
  placementName: string | null;
  cityId: string | null;
  cityName: string | null;
  vendorCategoryId: string | null;
  durationTier: DurationTier | null;
  startsOn: string | null;
  endsOn: string | null;
  headline: string | null;
  ctaText: string | null;
  creativeFileId: string | null;
  impressions: number;
  clicks: number;
  /** Server-computed when present; otherwise derived from clicks/impressions in the UI. */
  ctr: number | null;
  roi: number | null;
  amount: number | null;
  currencyCode: string | null;
}

export interface OutgoingFile {
  uri: string;
  name: string;
  type: string;
}

export interface CreateCampaignInput {
  placementId: string;
  name: string;
  durationTier: DurationTier;
  startsOn: string;
  cityId?: string | null;
  vendorCategoryId?: string | null;
  headline?: string | null;
  ctaText?: string | null;
  /** Uploaded via POST /files first; its id becomes `creativeFileId`. */
  creative?: OutgoingFile | null;
}

/** PATCH /v1/vendor/ad-campaigns/{id} — creative only, and only once live. */
export interface UpdateCreativeInput {
  id: string;
  headline?: string | null;
  ctaText?: string | null;
  creative?: OutgoingFile | null;
}

export interface CheckoutSession {
  transactionId: string;
  redirectUrl: string;
}
