/**
 * Subscription Feature Types
 */

export type SubscriptionStatus = "trialing" | "active" | "grace" | "cancelled" | "expired";

export interface PlanRef {
  id: string;
  nameEn: string;
  nameAr: string;
  billingCycle: string;
}

export interface PaymentMethodRef {
  brand: string;
  last4: string;
}

export interface SeatUsage {
  used: number;
  suspended: number;
  max: number | null;
}

export interface SubscriptionState {
  status: SubscriptionStatus;
  /** The stored value — lets the UI render "cancels on the 30th" instead of claiming everything's normal. */
  rawStatus: string;
  isPremium: boolean;
  /** `null` means Free — Free is the absence of a subscription, not a plan named Free. */
  plan: PlanRef | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  graceEndsAt: string | null;
  cancelledAt: string | null;
  paymentMethod: PaymentMethodRef | null;
  seats: SeatUsage;
  currencyCode: string;
}

export interface SubscriptionPlan {
  id: string;
  nameEn: string;
  nameAr: string;
  billingCycle: string;
  isPremium: boolean;
  trialDays: number;
  /** `null` = not purchasable in this studio's market. Never render as free. */
  price: number | null;
  currencyCode: string;
  isCurrent: boolean;
}

export interface UpgradeCheckout {
  transactionId: string;
  redirectUrl: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currencyCode: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
}

export interface InvoicesPage {
  invoices: Invoice[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface SetPaymentMethodInput {
  brand: string;
  last4: string;
  /** The payment gateway's own token — never a raw card number/expiry/CVV. */
  ref: string;
}
