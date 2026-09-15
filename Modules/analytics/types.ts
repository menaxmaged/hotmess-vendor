/**
 * Analytics Feature Types
 *
 * Mirrors GET /v1/vendor/analytics/{kpis,funnel,conversion,sources}. The API
 * has no period-over-period deltas — nothing here carries one.
 */

export type AnalyticsRange = "7d" | "30d" | "90d" | "1y";

export interface RangeWindow {
  range: AnalyticsRange;
  from: string;
  to: string;
}

/** Raw counts — available on Free and Premium alike. */
export interface AnalyticsKpis extends RangeWindow {
  profileViews: number;
  saves: number;
  messagesReceived: number;
  meetingsScheduled: number;
  /** `null` when nobody on the team replied to a bride in the window. */
  averageResponseMinutes: number | null;
  bookingsClosed: number;
}

export type FunnelStageKey = "views" | "saves" | "messages" | "meetings" | "bookings";

export interface FunnelStage {
  key: FunnelStageKey;
  count: number;
}

export interface AnalyticsFunnel extends RangeWindow {
  stages: FunnelStage[];
}

/** Percentages (0–100). `available: false` below 10 profile views in the window. */
export interface ConversionRates {
  range: AnalyticsRange;
  available: boolean;
  reason: string | null;
  viewToSave: number | null;
  saveToMessage: number | null;
  messageToMeeting: number | null;
  meetingToBooking: number | null;
  overall: number | null;
}

export type InquirySource = "browse" | "explore" | "ad" | "task" | "direct" | "unknown";

export interface SourceBreakdown {
  source: InquirySource;
  conversations: number;
  bookings: number;
  /** Major units. */
  revenue: number;
}

export interface AnalyticsSources extends RangeWindow {
  adAttributedBookings: number;
  bySource: SourceBreakdown[];
}

/** Premium-only reads: a 403 paywall becomes `locked`, never an error. */
export type Gated<T> = { locked: true } | { locked: false; data: T };
