/**
 * Subscription Feature - Mock Data
 */

import { mockDelay, mockId } from "@/lib/mock-utils";
import type {
    Invoice,
    InvoicesPage,
    SetPaymentMethodInput,
    SubscriptionPlan,
    SubscriptionState,
    UpgradeCheckout,
} from "./types";

const PLAN_ID = "plan-premium";

let state: SubscriptionState = {
  status: "trialing",
  rawStatus: "trialing",
  isPremium: false,
  plan: null,
  trialEndsAt: null,
  currentPeriodEnd: null,
  graceEndsAt: null,
  cancelledAt: null,
  paymentMethod: null,
  seats: { used: 1, suspended: 0, max: 1 },
  currencyCode: "EGP",
};

const plans: SubscriptionPlan[] = [
  {
    id: PLAN_ID,
    nameEn: "Vendor Premium",
    nameAr: "باقة المورد المميزة",
    billingCycle: "monthly",
    isPremium: true,
    trialDays: 0,
    price: 1500,
    currencyCode: "EGP",
    isCurrent: false,
  },
];

const invoices: Invoice[] = [];

export const mockSubscriptionApi = {
  getSubscription: async (): Promise<SubscriptionState> => {
    await mockDelay();
    return { ...state };
  },

  getPlans: async (): Promise<SubscriptionPlan[]> => {
    await mockDelay(200);
    return plans.map((p) => ({ ...p, isCurrent: state.plan?.id === p.id }));
  },

  upgrade: async (planId: string): Promise<UpgradeCheckout> => {
    await mockDelay(300);
    const plan = plans.find((p) => p.id === planId);
    if (!plan) throw new Error(`Mock plan not found: ${planId}`);
    return { transactionId: mockId(), redirectUrl: "https://checkout.example.com/mock" };
  },

  cancel: async (_reason?: string): Promise<void> => {
    await mockDelay(300);
    state.rawStatus = "cancelled";
    state.cancelledAt = new Date().toISOString();
  },

  getInvoices: async (page = 1, pageSize = 20): Promise<InvoicesPage> => {
    await mockDelay(200);
    return { invoices: [...invoices], totalItems: invoices.length, totalPages: 1, currentPage: page };
  },

  getInvoicePdf: async (_invoiceId: string): Promise<ArrayBuffer> => {
    await mockDelay(200);
    return new ArrayBuffer(0);
  },

  setPaymentMethod: async (input: SetPaymentMethodInput): Promise<void> => {
    await mockDelay(200);
    state.paymentMethod = { brand: input.brand, last4: input.last4 };
  },
};
