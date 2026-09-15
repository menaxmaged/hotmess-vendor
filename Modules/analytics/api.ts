/**
 * Analytics Feature - API Service
 *
 * Four real routes under /vendor/analytics. The old single
 * GET /vendor/analytics "overview" never existed.
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockAnalyticsApi } from "./mock";
import type {
  AnalyticsFunnel,
  AnalyticsKpis,
  AnalyticsRange,
  AnalyticsSources,
  ConversionRates,
  Gated,
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

/** Conversion + sources are Premium (`canSeeConversionRates`); Free gets a 403 paywall. */
const gated = async <T>(load: () => Promise<T>): Promise<Gated<T>> => {
  try {
    return { locked: false, data: await load() };
  } catch (error: any) {
    if (error?.response?.status === 403) return { locked: true };
    throw error;
  }
};

const RATE_KEYS = ["viewToSave", "saveToMessage", "messageToMeeting", "meetingToBooking", "overall"] as const;

/**
 * The spec types the rates as bare `number` with no unit. Treat the set as
 * fractions only when every present value is ≤ 1 — a single rate above 1 can
 * only be a percentage.
 */
const mapConversion = (raw: any, range: AnalyticsRange): ConversionRates => {
  const values = RATE_KEYS.map((k) => raw?.[k]).filter((v): v is number => typeof v === "number");
  const scale = values.length > 0 && values.every((v) => v <= 1) ? 100 : 1;
  const rate = (v: unknown) => (typeof v === "number" ? Math.round(v * scale * 10) / 10 : null);
  return {
    range: raw?.range ?? range,
    available: raw?.available !== false,
    reason: raw?.reason ?? null,
    viewToSave: rate(raw?.viewToSave),
    saveToMessage: rate(raw?.saveToMessage),
    messageToMeeting: rate(raw?.messageToMeeting),
    meetingToBooking: rate(raw?.meetingToBooking),
    overall: rate(raw?.overall),
  };
};

const liveAnalyticsApi = {
  getKpis: async (range: AnalyticsRange): Promise<AnalyticsKpis> => {
    const response = await api.get<unknown>("/vendor/analytics/kpis", { params: { range } });
    return unwrap<AnalyticsKpis>(response.data);
  },

  getFunnel: async (range: AnalyticsRange): Promise<AnalyticsFunnel> => {
    const response = await api.get<unknown>("/vendor/analytics/funnel", { params: { range } });
    const raw = unwrap<AnalyticsFunnel>(response.data);
    return { ...raw, stages: raw?.stages ?? [] };
  },

  getConversion: (range: AnalyticsRange): Promise<Gated<ConversionRates>> =>
    gated(async () => {
      const response = await api.get<unknown>("/vendor/analytics/conversion", { params: { range } });
      return mapConversion(unwrap<any>(response.data), range);
    }),

  getSources: (range: AnalyticsRange): Promise<Gated<AnalyticsSources>> =>
    gated(async () => {
      const response = await api.get<unknown>("/vendor/analytics/sources", { params: { range } });
      const raw = unwrap<any>(response.data);
      return {
        range: raw?.range ?? range,
        from: raw?.from,
        to: raw?.to,
        adAttributedBookings: raw?.adAttributedBookings ?? 0,
        bySource: ((raw?.bySource ?? []) as any[]).map((s) => ({
          source: s.source,
          conversations: s.conversations ?? 0,
          bookings: s.bookings ?? 0,
          revenue: (s.revenueMinor ?? 0) / 100,
        })),
      };
    }),
};

export const analyticsApi: typeof liveAnalyticsApi = USE_MOCK_DATA
  ? mockAnalyticsApi
  : liveAnalyticsApi;
