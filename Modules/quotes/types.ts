/**
 * Quotes Feature Types
 */

export type QuoteStatus = "open" | "accepted" | "expired";

export interface QuoteLineItem {
  description: string;
  quantity: number;
  /** Major units (EGP) — converted to/from minor units at the api.ts boundary. */
  unitAmount: number;
}

export interface Quote {
  id: string;
  conversationId: string;
  lineItems: QuoteLineItem[];
  /** Computed server-side from lineItems — never sent, only read. */
  totalAmount: number;
  status: QuoteStatus;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteInput {
  conversationId: string;
  lineItems: QuoteLineItem[];
  /** yyyy-mm-dd */
  validUntil?: string | null;
}

export interface UpdateQuoteInput {
  quoteId: string;
  status?: QuoteStatus;
  validUntil?: string | null;
  lineItems?: QuoteLineItem[];
}

export interface QuotesQuery {
  conversationId?: string;
  status?: QuoteStatus;
  page?: number;
  pageSize?: number;
}

export interface QuotesPage {
  quotes: Quote[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
