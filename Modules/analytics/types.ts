/**
 * Analytics Feature Types
 */

export type AnalyticsRange = "7d" | "30d" | "90d" | "1y";

export interface MetricValue {
  value: number;
  deltaPct: number;
}

export interface AnalyticsKpis {
  profileViews: MetricValue;
  saves: MetricValue;
  messages: MetricValue;
  meetings: MetricValue;
  avgResponseMins: MetricValue;
  bookings: MetricValue;
}

export interface ConversionRates {
  saveToMessage: number;
  messageToMeeting: number;
  meetingToBooking: number;
}

export interface FinanceEntry {
  received: number;
  pending: number;
  quoted: number;
}

export interface AdsEntry {
  roiX: number;
  impressions: number;
  activeCampaigns: number;
}

export interface AnalyticsOverview {
  range: AnalyticsRange;
  isPremium: boolean;
  hasEnoughData: boolean;
  kpis: AnalyticsKpis;
  conversion: ConversionRates | null;
  finance: FinanceEntry;
  ads: AdsEntry;
}
