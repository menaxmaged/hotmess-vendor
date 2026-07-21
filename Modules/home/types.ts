/**
 * Home Dashboard Feature Types
 */

export interface SetupChecklist {
  completed: number;
  total: number;
  missingItems: string[];
}

export interface KpiValue {
  value: number;
  deltaPct: number;
}

export interface HomeKpis {
  profileViews: KpiValue;
  saves: KpiValue;
  newInquiries: KpiValue;
  bookingsClosed: KpiValue;
}

export type FunnelStage = "views" | "saves" | "messages" | "meetings" | "bookings";

export interface FunnelStep {
  stage: FunnelStage;
  label: string;
  count: number;
}

export interface TeamMemberActivity {
  id: string;
  name: string;
  avatarUrl?: string | null;
  online: boolean;
  openChats: number;
  repliedToday: number;
}

export interface HomeInsight {
  headline: string;
  description: string;
}

export interface RevenuePoint {
  month: string;
  value: number;
}

export interface HomeRevenue {
  label: string;
  amount: number;
  deltaPct: number;
  spark: number[];
  monthly: RevenuePoint[];
}

export interface HomeOverview {
  setupChecklist: SetupChecklist | null;
  revenue: HomeRevenue | null;
  kpis: HomeKpis;
  funnel: FunnelStep[];
  teamToday: TeamMemberActivity[] | null;
  insight: HomeInsight | null;
}

export interface AdCampaignSummary {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  impressions: number;
  clicks: number;
}

export interface AdsSummary {
  roiPct: number;
  campaigns: AdCampaignSummary[];
}

export interface SubscriptionUsage {
  teamSeatsUsed: number;
  teamSeatsTotal: number;
  replySends: number;
  adCredits: number;
}

export interface SubscriptionSummary {
  plan: "free" | "premium";
  renewalDate?: string | null;
  price?: number | null;
  usage: SubscriptionUsage;
}
