/**
 * Finance Feature - Mock Data
 */

import { mockDelay, mockId } from "@/lib/mock-utils";
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

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();
const dateOnly = (iso: string) => iso.slice(0, 10);

const PAYMENTS: LedgerPayment[] = [
  { id: "p1", conversationId: "chat-1", brideName: "Nour Hassan", packageName: "Couture — Full", amount: 85000, kind: "deposit", paidOn: dateOnly(daysAgo(30)), receiptFileId: null, createdAt: daysAgo(30) },
  { id: "p2", conversationId: "chat-2", brideName: "Salma Farouk", packageName: "Signature Gown", amount: 20000, kind: "deposit", paidOn: dateOnly(daysAgo(20)), receiptFileId: null, createdAt: daysAgo(20) },
  { id: "p3", conversationId: "chat-3", brideName: "Yara Adel", packageName: "Bespoke Dress", amount: 12000, kind: "deposit", paidOn: dateOnly(daysAgo(10)), receiptFileId: null, createdAt: daysAgo(10) },
  { id: "p4", conversationId: "chat-5", brideName: "Habiba Nabil", packageName: "Evening Couture", amount: 16000, kind: "instalment", paidOn: dateOnly(daysAgo(5)), receiptFileId: null, createdAt: daysAgo(5) },
  { id: "p5", conversationId: "chat-1", brideName: "Nour Hassan", packageName: "Couture — Full", amount: 40000, kind: "final", paidOn: dateOnly(daysAgo(2)), receiptFileId: null, createdAt: daysAgo(2) },
];

export const mockFinanceApi = {
  getSummary: async (): Promise<FinanceSummary> => {
    await mockDelay();
    const totalReceived = PAYMENTS.reduce((s, p) => s + p.amount, 0);
    const receivedThisMonth = PAYMENTS.filter((p) => Date.parse(p.paidOn) >= now - 30 * 86400000).reduce(
      (s, p) => s + p.amount,
      0,
    );
    return {
      currencyCode: "EGP",
      totalReceived,
      receivedThisMonth,
      outstanding: 78000,
      openQuotes: 3,
      paymentsCount: PAYMENTS.length,
    };
  },

  getPayments: async (query: PaymentsQuery = {}): Promise<PaymentsPage> => {
    await mockDelay();
    let payments = [...PAYMENTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (query.conversationId) payments = payments.filter((p) => p.conversationId === query.conversationId);
    if (query.kind) payments = payments.filter((p) => p.kind === query.kind);
    if (query.from) payments = payments.filter((p) => p.paidOn >= query.from!);
    if (query.to) payments = payments.filter((p) => p.paidOn <= query.to!);
    return {
      payments,
      totalItems: payments.length,
      totalPages: 1,
      currentPage: 1,
      hasNext: false,
    };
  },

  addPayment: async (input: RecordPaymentInput): Promise<LedgerPayment> => {
    await mockDelay();
    const created: LedgerPayment = {
      id: mockId(),
      conversationId: input.conversationId,
      brideName: "New payment",
      packageName: null,
      amount: input.amount,
      kind: input.kind,
      paidOn: input.paidOn,
      receiptFileId: input.receiptFileId ?? null,
      createdAt: new Date().toISOString(),
    };
    PAYMENTS.push(created);
    return created;
  },

  updatePayment: async (input: UpdatePaymentInput): Promise<void> => {
    await mockDelay();
    const payment = PAYMENTS.find((p) => p.id === input.paymentId);
    if (!payment) throw new Error(`Mock payment not found: ${input.paymentId}`);
    if (input.amount != null) payment.amount = input.amount;
    if (input.kind) payment.kind = input.kind;
    if (input.paidOn) payment.paidOn = input.paidOn;
  },

  deletePayment: async (paymentId: string): Promise<void> => {
    await mockDelay();
    const index = PAYMENTS.findIndex((p) => p.id === paymentId);
    if (index !== -1) PAYMENTS.splice(index, 1);
  },

  getReport: async (type: ReportType, _range: ReportDateRange = {}): Promise<FinanceReport> => {
    await mockDelay();
    return {
      title: type,
      subtitle: "Mock report",
      currencyCode: "EGP",
      generatedAt: new Date().toISOString(),
      meta: [],
      columns: [{ key: "total", label: "Total", format: "money" }],
      rows: [{ total: PAYMENTS.reduce((s, p) => s + p.amount, 0) }],
      totals: { total: PAYMENTS.reduce((s, p) => s + p.amount, 0) },
    };
  },

  exportReport: async (type: ReportType, _range: ReportDateRange = {}): Promise<ReportExport> => {
    await mockDelay();
    return {
      id: mockId(),
      type,
      status: "queued",
      storedFileId: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  getExportStatus: async (exportId: string): Promise<ReportExport> => {
    await mockDelay();
    return {
      id: exportId,
      type: "monthly_revenue",
      status: "done",
      storedFileId: mockId(),
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  getRecentExports: async (): Promise<ReportExport[]> => {
    await mockDelay();
    return [];
  },
};
