/**
 * Quotes Feature - Mock Data
 */

import { mockDelay, mockId } from "@/lib/mock-utils";
import type { CreateQuoteInput, Quote, QuotesPage, QuotesQuery, UpdateQuoteInput } from "./types";

const computeTotal = (lineItems: Quote["lineItems"]): number =>
  lineItems.reduce((sum, li) => sum + li.quantity * li.unitAmount, 0);

const quotes: Quote[] = [
  {
    id: "quote-1",
    conversationId: "chat-1",
    lineItems: [{ description: "Full-day coverage", quantity: 1, unitAmount: 12000 }],
    totalAmount: 12000,
    status: "open",
    validUntil: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export const mockQuotesApi = {
  getQuotes: async (query: QuotesQuery = {}): Promise<QuotesPage> => {
    await mockDelay();
    let filtered = [...quotes];
    if (query.conversationId) filtered = filtered.filter((q) => q.conversationId === query.conversationId);
    if (query.status) filtered = filtered.filter((q) => q.status === query.status);
    return { quotes: filtered, totalItems: filtered.length, totalPages: 1, currentPage: 1 };
  },

  getQuote: async (quoteId: string): Promise<Quote> => {
    await mockDelay(200);
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) throw new Error(`Mock quote not found: ${quoteId}`);
    return { ...quote };
  },

  createQuote: async (input: CreateQuoteInput): Promise<Quote> => {
    await mockDelay(300);
    const created: Quote = {
      id: mockId(),
      conversationId: input.conversationId,
      lineItems: input.lineItems,
      totalAmount: computeTotal(input.lineItems),
      status: "open",
      validUntil: input.validUntil ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    quotes.push(created);
    return created;
  },

  updateQuote: async (input: UpdateQuoteInput): Promise<void> => {
    await mockDelay(200);
    const quote = quotes.find((q) => q.id === input.quoteId);
    if (!quote) throw new Error(`Mock quote not found: ${input.quoteId}`);
    if (input.status) quote.status = input.status;
    if (input.validUntil !== undefined) quote.validUntil = input.validUntil;
    if (input.lineItems) {
      quote.lineItems = input.lineItems;
      quote.totalAmount = computeTotal(input.lineItems);
    }
    quote.updatedAt = new Date().toISOString();
  },
};
