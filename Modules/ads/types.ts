/**
 * Sponsored Ads Feature Types
 */

export type CampaignStatus = "active" | "pending" | "completed" | "paused";

export type Demand = "Highest" | "High" | "Medium";

export interface Placement {
  id: string;
  name: string;
  description: string;
  demand: Demand;
  slots: string;
  priceFrom: number;
}

export interface Campaign {
  id: string;
  name: string;
  placement: string;
  status: CampaignStatus;
  impressions: number;
  clicks: number;
}

export interface AdsData {
  roiX: number;
  spent: number;
  quoted: number;
  placements: Placement[];
  campaigns: Campaign[];
}

export type CampaignDuration = "1w" | "2w" | "1m";

export interface CampaignInput {
  name: string;
  placementId: string;
  city: string;
  duration: CampaignDuration;
  headline: string;
  ctaText: string;
}
