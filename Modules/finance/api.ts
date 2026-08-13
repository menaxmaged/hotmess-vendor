/**
 * Finance Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockFinanceApi } from "./mock";
import type {
    FinanceReport,
    FinanceSummary,
    LedgerPayment,
    PaymentsPage,
    PaymentsQuery,
    RecordPaymentInput,
    ReportDateRange,
    ReportExport,
    ReportType,
    UpdatePaymentInput,
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

interface RealSummary {
  currencyCode: string;
  totalReceived: number;
  receivedThisMonth: number;
  outstanding: number;
  openQuotes: number;
  paymentsCount: number;
}

interface RealPayment {
  id: string;
  conversationId: string;
  bride: { id: string; name: string };
  package: { id: string; name: string } | null;
  amount: number;
  kind: LedgerPayment["kind"];
  paidOn: string;
  receiptFileId: string | null;
  createdAt: string;
}

interface PageMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
}

const mapSummary = (s: RealSummary): FinanceSummary => ({
  currencyCode: s.currencyCode,
  totalReceived: s.totalReceived / 100,
  receivedThisMonth: s.receivedThisMonth / 100,
  outstanding: s.outstanding / 100,
  openQuotes: s.openQuotes,
  paymentsCount: s.paymentsCount,
});

const mapPayment = (p: RealPayment): LedgerPayment => ({
  id: p.id,
  conversationId: p.conversationId,
  brideName: p.bride?.name ?? "",
  packageName: p.package?.name ?? null,
  amount: p.amount / 100,
  kind: p.kind,
  paidOn: p.paidOn,
  receiptFileId: p.receiptFileId,
  createdAt: p.createdAt,
});

const liveFinanceApi = {
  getSummary: async (): Promise<FinanceSummary> => {
    const response = await api.get<unknown>("/vendor/finance/summary");
    return mapSummary(unwrap<RealSummary>(response.data));
  },

  getPayments: async (query: PaymentsQuery = {}): Promise<PaymentsPage> => {
    const response = await api.get<unknown>("/vendor/finance/payments", { params: query });
    const payments = unwrap<RealPayment[]>(response.data).map(mapPayment);
    const meta = (response.data as { meta?: PageMeta })?.meta;
    return {
      payments,
      totalItems: meta?.totalItems ?? payments.length,
      totalPages: meta?.totalPages ?? 1,
      currentPage: meta?.currentPage ?? 1,
      hasNext: meta?.hasNext ?? false,
    };
  },

  addPayment: async (input: RecordPaymentInput): Promise<LedgerPayment> => {
    const response = await api.post<unknown>("/vendor/finance/payments", {
      ...input,
      amount: Math.round(input.amount * 100),
    });
    const created = unwrap<Partial<RealPayment>>(response.data);
    return {
      id: created.id ?? "",
      conversationId: input.conversationId,
      brideName: "",
      packageName: null,
      amount: created.amount != null ? created.amount / 100 : input.amount,
      kind: created.kind ?? input.kind,
      paidOn: input.paidOn,
      receiptFileId: input.receiptFileId ?? null,
      createdAt: new Date().toISOString(),
    };
  },

  updatePayment: async (input: UpdatePaymentInput): Promise<void> => {
    const { paymentId, ...rest } = input;
    await api.patch<unknown>(`/vendor/finance/payments/${paymentId}`, {
      ...rest,
      amount: rest.amount != null ? Math.round(rest.amount * 100) : undefined,
    });
  },

  deletePayment: async (paymentId: string): Promise<void> => {
    await api.delete(`/vendor/finance/payments/${paymentId}`);
  },

  getReport: async (type: ReportType, range: ReportDateRange = {}): Promise<FinanceReport> => {
    const response = await api.get<unknown>(`/vendor/finance/reports/${type}`, { params: range });
    return unwrap<FinanceReport>(response.data);
  },

  exportReport: async (type: ReportType, range: ReportDateRange = {}): Promise<ReportExport> => {
    const response = await api.post<unknown>(`/vendor/finance/reports/${type}/export`, range);
    return unwrap<ReportExport>(response.data);
  },

  getExportStatus: async (exportId: string): Promise<ReportExport> => {
    const response = await api.get<unknown>(`/vendor/finance/reports/exports/${exportId}`);
    return unwrap<ReportExport>(response.data);
  },

  getRecentExports: async (): Promise<ReportExport[]> => {
    const response = await api.get<unknown>("/vendor/finance/reports/exports");
    return unwrap<ReportExport[]>(response.data);
  },
};

export const financeApi: typeof liveFinanceApi = USE_MOCK_DATA ? mockFinanceApi : liveFinanceApi;
