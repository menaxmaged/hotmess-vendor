/**
 * Analytics Feature - Mock Data
 */

import { mockDelay } from "@/lib/mock-utils";
import type { AnalyticsOverview, AnalyticsRange } from "./types";

const BASE: Omit<AnalyticsOverview, "range"> = {
  isPremium: true,
  hasEnoughData: true,
  kpis: {
    profileViews: { value: 18904, deltaPct: 24 },
    saves: { value: 312, deltaPct: 18 },
    messages: { value: 47, deltaPct: 12 },
    meetings: { value: 14, deltaPct: 9 },
    avgResponseMins: { value: 42, deltaPct: -15 },
    bookings: { value: 12, deltaPct: 3 },
  },
  conversion: {
    saveToMessage: 15,
    messageToMeeting: 30,
    meetingToBooking: 86,
  },
  finance: {
    received: 133000,
    pending: 273000,
    quoted: 277000,
  },
  ads: {
    roiX: 4.2,
    impressions: 46600,
    activeCampaigns: 2,
  },
};

const RANGE_SCALE: Record<AnalyticsRange, number> = {
  "7d": 0.25,
  "30d": 1,
  "90d": 2.6,
  "1y": 9.4,
};

export const mockAnalyticsApi = {
  getOverview: async (range: AnalyticsRange): Promise<AnalyticsOverview> => {
    await mockDelay();
    const scale = RANGE_SCALE[range];
    return {
      ...BASE,
      range,
      kpis: {
        profileViews: { value: Math.round(BASE.kpis.profileViews.value * scale), deltaPct: BASE.kpis.profileViews.deltaPct },
        saves: { value: Math.round(BASE.kpis.saves.value * scale), deltaPct: BASE.kpis.saves.deltaPct },
        messages: { value: Math.round(BASE.kpis.messages.value * scale), deltaPct: BASE.kpis.messages.deltaPct },
        meetings: { value: Math.round(BASE.kpis.meetings.value * scale), deltaPct: BASE.kpis.meetings.deltaPct },
        avgResponseMins: BASE.kpis.avgResponseMins,
        bookings: { value: Math.round(BASE.kpis.bookings.value * scale), deltaPct: BASE.kpis.bookings.deltaPct },
      },
    };
  },
};
