/**
 * Analytics Feature - Mock Data
 */

import { mockDelay } from "@/lib/mock-utils";
import type {
  AnalyticsFunnel,
  AnalyticsKpis,
  AnalyticsRange,
  AnalyticsSources,
  ConversionRates,
  Gated,
} from "./types";

const RANGE_DAYS: Record<AnalyticsRange, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

const windowFor = (range: AnalyticsRange) => {
  const to = new Date();
  const from = new Date(to.getTime() - RANGE_DAYS[range] * 86400000);
  return { range, from: from.toISOString(), to: to.toISOString() };
};

const scaled = (range: AnalyticsRange, n: number) => Math.round((n * RANGE_DAYS[range]) / 30);

export const mockAnalyticsApi = {
  getKpis: async (range: AnalyticsRange): Promise<AnalyticsKpis> => {
    await mockDelay();
    return {
      ...windowFor(range),
      profileViews: scaled(range, 18904),
      saves: scaled(range, 312),
      messagesReceived: scaled(range, 47),
      meetingsScheduled: scaled(range, 14),
      averageResponseMinutes: 42,
      bookingsClosed: scaled(range, 12),
    };
  },

  getFunnel: async (range: AnalyticsRange): Promise<AnalyticsFunnel> => {
    await mockDelay();
    return {
      ...windowFor(range),
      stages: [
        { key: "views", count: scaled(range, 18904) },
        { key: "saves", count: scaled(range, 312) },
        { key: "messages", count: scaled(range, 47) },
        { key: "meetings", count: scaled(range, 14) },
        { key: "bookings", count: scaled(range, 12) },
      ],
    };
  },

  getConversion: async (range: AnalyticsRange): Promise<Gated<ConversionRates>> => {
    await mockDelay();
    return {
      locked: false,
      data: {
        range,
        available: true,
        reason: null,
        viewToSave: 1.7,
        saveToMessage: 15.1,
        messageToMeeting: 29.8,
        meetingToBooking: 85.7,
        overall: 0.1,
      },
    };
  },

  getSources: async (range: AnalyticsRange): Promise<Gated<AnalyticsSources>> => {
    await mockDelay();
    return {
      locked: false,
      data: {
        ...windowFor(range),
        adAttributedBookings: scaled(range, 3),
        bySource: [
          { source: "browse", conversations: scaled(range, 21), bookings: scaled(range, 5), revenue: scaled(range, 160000) },
          { source: "ad", conversations: scaled(range, 11), bookings: scaled(range, 3), revenue: scaled(range, 98000) },
          { source: "explore", conversations: scaled(range, 9), bookings: scaled(range, 2), revenue: scaled(range, 64000) },
          { source: "direct", conversations: scaled(range, 6), bookings: scaled(range, 2), revenue: scaled(range, 52000) },
        ],
      },
    };
  },
};
