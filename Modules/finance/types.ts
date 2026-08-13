/**
 * Finance Feature Types
 *
 * Rewritten 2026-08-13 for the real `/vendor/finance/*` shape. The old mock
 * modeled a per-bride running-total ledger (`total`/`received`/`status`) —
 * the real API has no such concept. It's a flat list of individual payment
 * transactions (a bride can have many rows: deposit, instalment, final) with
 * no "total owed" field anywhere in finance's API at all — that would come
 * from a package price or a quote, which live in other modules.
 */

export type PaymentKind = "deposit" | "instalment" | "final";

export interface FinanceSummary {
  currencyCode: string;
  totalReceived: number;
  receivedThisMonth: number;
  outstanding: number;
  openQuotes: number;
  paymentsCount: number;
}

export interface LedgerPayment {
  id: string;
  conversationId: string;
  brideName: string;
  packageName: string | null;
  amount: number;
  kind: PaymentKind;
  paidOn: string;
  receiptFileId: string | null;
  createdAt: string;
}

export interface PaymentsPage {
  payments: LedgerPayment[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
}

export interface PaymentsQuery {
  conversationId?: string;
  brideUserId?: string;
  kind?: PaymentKind;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface RecordPaymentInput {
  conversationId: string;
  packageId?: string | null;
  amount: number;
  kind: PaymentKind;
  /** yyyy-mm-dd */
  paidOn: string;
  receiptFileId?: string | null;
}

export interface UpdatePaymentInput {
  paymentId: string;
  packageId?: string | null;
  amount?: number;
  kind?: PaymentKind;
  paidOn?: string;
  receiptFileId?: string | null;
}

export type ReportType = "monthly_revenue" | "by_bride" | "by_package" | "outstanding";

export interface ReportColumn {
  key: string;
  label: string;
  format: "text" | "money" | "integer" | "date";
  weight?: number;
}

export interface ReportMetaLine {
  label: string;
  value: string;
}

export interface FinanceReport {
  title: string;
  subtitle: string;
  currencyCode: string;
  generatedAt: string;
  meta: ReportMetaLine[];
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  totals: Record<string, unknown>;
}

export interface ReportDateRange {
  from?: string;
  to?: string;
}

export type ReportExportStatus = "queued" | "running" | "done" | "failed";

export interface ReportExport {
  id: string;
  type: ReportType;
  status: ReportExportStatus;
  storedFileId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
