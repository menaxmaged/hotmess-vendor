/**
 * Home Dashboard Feature - Mock Data
 */

import { mockDelay } from "@/lib/mock-utils";
import type { AdsSummary, HomeOverview, SubscriptionSummary } from "./types";

const now = Date.now();
const daysFromNow = (days: number) => new Date(now + days * 86400000).toISOString();

const MOCK_OVERVIEW: HomeOverview = {
  setupChecklist: {
    completed: 5,
    total: 9,
    missingItems: [
      "Add at least 3 portfolio images",
      "Connect Instagram",
      "Set your availability rules",
      "Invite a team member",
    ],
  },
  revenue: {
    label: "May 1–18 · Live",
    amount: 285000,
    deltaPct: 34,
    spark: [40, 38, 34, 32, 26, 30, 22, 24, 18, 14, 16, 10, 12, 6, 4],
    monthly: [
      { month: "Dec", value: 165000 },
      { month: "Jan", value: 190000 },
      { month: "Feb", value: 210000 },
      { month: "Mar", value: 245000 },
      { month: "Apr", value: 212000 },
      { month: "May", value: 285000 },
    ],
  },
  kpis: {
    profileViews: { value: 482, deltaPct: 12 },
    saves: { value: 63, deltaPct: 8 },
    newInquiries: { value: 14, deltaPct: -4 },
    bookingsClosed: { value: 3, deltaPct: 50 },
  },
  funnel: [
    { stage: "views", label: "Views", count: 482 },
    { stage: "saves", label: "Saves", count: 63 },
    { stage: "messages", label: "Messages", count: 21 },
    { stage: "meetings", label: "Meetings", count: 9 },
    { stage: "bookings", label: "Bookings", count: 3 },
  ],
  teamToday: [
    { id: "mock-vendor-1", name: "Amira Studio", online: true, openChats: 3, repliedToday: 5 },
    { id: "tm-1", name: "Mona Adel", online: true, openChats: 2, repliedToday: 4 },
    { id: "tm-2", name: "Youssef Nabil", online: false, openChats: 1, repliedToday: 1 },
  ],
  insight: {
    headline: "482 profile views this week",
    description: "See your full funnel and conversion rates →",
  },
};

const MOCK_ADS: AdsSummary = {
  roiPct: 240,
  campaigns: [
    { id: "camp-1", name: "Home banner — Cairo", status: "active", impressions: 12400, clicks: 340 },
    { id: "camp-2", name: "Task priority — Couture", status: "active", impressions: 6100, clicks: 210 },
    { id: "camp-3", name: "Push — Saved vendors", status: "completed", impressions: 3200, clicks: 88 },
  ],
};

const MOCK_SUBSCRIPTION: SubscriptionSummary = {
  plan: "premium",
  renewalDate: daysFromNow(21),
  price: 1200,
  usage: {
    teamSeatsUsed: 3,
    teamSeatsTotal: 10,
    replySends: 214,
    adCredits: 2,
  },
};

export const mockHomeApi = {
  getOverview: async (): Promise<HomeOverview> => {
    await mockDelay();
    return MOCK_OVERVIEW;
  },

  getAdsSummary: async (): Promise<AdsSummary> => {
    await mockDelay();
    return MOCK_ADS;
  },

  getSubscriptionSummary: async (): Promise<SubscriptionSummary> => {
    await mockDelay();
    return MOCK_SUBSCRIPTION;
  },
};
