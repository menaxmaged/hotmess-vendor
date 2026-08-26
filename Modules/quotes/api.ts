/**
 * Quotes Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockQuotesApi } from "./mock";
import type { CreateQuoteInput, Quote, QuotesPage, QuotesQuery, UpdateQuoteInput } from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

interface RealLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
}

interface RealQuote {
  id: string;
  conversationId: string;
  lineItems: RealLineItem[];
  totalAmount: number;
  status: Quote["status"];
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PageMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

const mapQuote = (q: RealQuote): Quote => ({
  id: q.id,
  conversationId: q.conversationId,
  lineItems: q.lineItems.map((li) => ({
    description: li.description,
    quantity: li.quantity,
    unitAmount: li.unitAmount / 100,
  })),
  totalAmount: q.totalAmount / 100,
  status: q.status,
  validUntil: q.validUntil,
  createdAt: q.createdAt,
  updatedAt: q.updatedAt,
});

const liveQuotesApi = {
  getQuotes: async (query: QuotesQuery = {}): Promise<QuotesPage> => {
    const response = await api.get<unknown>("/vendor/quotes", { params: query });
    const quotes = unwrap<RealQuote[]>(response.data).map(mapQuote);
    const meta = (response.data as { meta?: PageMeta })?.meta;
    return {
      quotes,
      totalItems: meta?.totalItems ?? quotes.length,
      totalPages: meta?.totalPages ?? 1,
      currentPage: meta?.currentPage ?? 1,
    };
  },

  getQuote: async (quoteId: string): Promise<Quote> => {
    const response = await api.get<unknown>(`/vendor/quotes/${quoteId}`);
    return mapQuote(unwrap<RealQuote>(response.data));
  },

  createQuote: async (input: CreateQuoteInput): Promise<Quote> => {
    const response = await api.post<unknown>("/vendor/quotes", {
      conversationId: input.conversationId,
      validUntil: input.validUntil,
      lineItems: input.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitAmount: Math.round(li.unitAmount * 100),
      })),
    });
    const created = unwrap<Partial<RealQuote>>(response.data);
    return {
      id: created.id ?? "",
      conversationId: input.conversationId,
      lineItems: input.lineItems,
      totalAmount: created.totalAmount != null ? created.totalAmount / 100 : 0,
      status: created.status ?? "open",
      validUntil: input.validUntil ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  updateQuote: async (input: UpdateQuoteInput): Promise<void> => {
    const { quoteId, lineItems, ...rest } = input;
    await api.patch<unknown>(`/vendor/quotes/${quoteId}`, {
      ...rest,
      lineItems: lineItems?.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitAmount: Math.round(li.unitAmount * 100),
      })),
    });
  },
};

export const quotesApi: typeof liveQuotesApi = USE_MOCK_DATA ? mockQuotesApi : liveQuotesApi;
