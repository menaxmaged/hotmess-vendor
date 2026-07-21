/**
 * Finance Feature Types
 */

export type FinanceRange = "month" | "quarter" | "ytd" | "all";

export type PaymentStatus =
  | "paid"
  | "partial"
  | "deposit_pending"
  | "quoted"
  | "cancelled";

export interface FinanceSummary {
  received: number;
  deposits: number;
  remaining: number;
  quoted: number;
}

export interface BridePayment {
  id: string;
  brideName: string;
  packageName: string;
  dueDate?: string | null;
  total: number;
  received: number;
  status: PaymentStatus;
}

export interface FinanceOverview {
  range: FinanceRange;
  summary: FinanceSummary;
  payments: BridePayment[];
}

export type PaymentType = "deposit" | "instalment" | "final";

export interface AddPaymentInput {
  brideId: string;
  amount: number;
  type: PaymentType;
  date: string;
}
