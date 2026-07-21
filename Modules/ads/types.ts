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
