/**
 * Subscription Feature - API Service
 */

import { api, apiClient, USE_MOCK_DATA } from "@/lib/api-client";
import { mockSubscriptionApi } from "./mock";
import type {
    Invoice,
    InvoicesPage,
    SetPaymentMethodInput,
    SubscriptionPlan,
    SubscriptionState,
    UpgradeCheckout,
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

interface RealPlan {
  id: string;
  nameEn: string;
  nameAr: string;
  billingCycle: string;
  isPremium: boolean;
  trialDays: number;
  priceMinor: number | null;
  currencyCode: string;
  isCurrent: boolean;
}

interface RealInvoice {
  id: string;
  number: string;
  amount: number;
  currencyCode: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
}

interface PageMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

const mapPlan = (p: RealPlan): SubscriptionPlan => ({
  id: p.id,
  nameEn: p.nameEn,
  nameAr: p.nameAr,
  billingCycle: p.billingCycle,
  isPremium: p.isPremium,
  trialDays: p.trialDays,
  price: p.priceMinor != null ? p.priceMinor / 100 : null,
  currencyCode: p.currencyCode,
  isCurrent: p.isCurrent,
});

const mapInvoice = (i: RealInvoice): Invoice => ({
  id: i.id,
  number: i.number,
  amount: i.amount / 100,
  currencyCode: i.currencyCode,
  periodStart: i.periodStart,
  periodEnd: i.periodEnd,
  issuedAt: i.issuedAt,
});

const liveSubscriptionApi = {
  getSubscription: async (): Promise<SubscriptionState> => {
    const response = await api.get<unknown>("/vendor/subscription");
    return unwrap<SubscriptionState>(response.data);
  },

  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await api.get<unknown>("/vendor/subscription/plans");
    return unwrap<RealPlan[]>(response.data).map(mapPlan);
  },

  upgrade: async (planId: string): Promise<UpgradeCheckout> => {
    const response = await api.post<unknown>("/vendor/subscription/upgrade", { planId });
    return unwrap<UpgradeCheckout>(response.data);
  },

  cancel: async (reason?: string): Promise<void> => {
    await api.post<unknown>("/vendor/subscription/cancel", reason ? { reason } : undefined);
  },

  getInvoices: async (page = 1, pageSize = 20): Promise<InvoicesPage> => {
    const response = await api.get<unknown>("/vendor/subscription/invoices", {
      params: { page, pageSize },
    });
    const invoices = unwrap<RealInvoice[]>(response.data).map(mapInvoice);
    const meta = (response.data as { meta?: PageMeta })?.meta;
    return {
      invoices,
      totalItems: meta?.totalItems ?? invoices.length,
      totalPages: meta?.totalPages ?? 1,
      currentPage: meta?.currentPage ?? 1,
    };
  },

  // Bypasses the `api` JSON-envelope wrapper — this response is a raw PDF
  // stream, not an ApiResponse. Web can build a Blob URL and trigger a real
  // download from this; native has nowhere to put the bytes (no
  // expo-file-system/expo-sharing installed in this app) — see day-05's plan
  // doc for that gap.
  getInvoicePdf: async (invoiceId: string): Promise<ArrayBuffer> => {
    const response = await apiClient.get(`/vendor/subscription/invoices/${invoiceId}/pdf`, {
      responseType: "arraybuffer",
    });
    return response.data as ArrayBuffer;
  },

  setPaymentMethod: async (input: SetPaymentMethodInput): Promise<void> => {
    await api.put<unknown>("/vendor/subscription/payment-method", input);
  },
};

export const subscriptionApi: typeof liveSubscriptionApi = USE_MOCK_DATA
  ? mockSubscriptionApi
  : liveSubscriptionApi;
