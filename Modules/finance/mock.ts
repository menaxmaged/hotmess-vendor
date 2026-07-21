/**
 * Finance Feature - Mock Data
 */

import { mockDelay } from "@/lib/mock-utils";
import type { BridePayment, FinanceOverview, FinanceRange } from "./types";

const now = Date.now();
const daysFromNow = (d: number) => new Date(now + d * 86400000).toISOString();

const PAYMENTS: BridePayment[] = [
  { id: "b1", brideName: "Nour Hassan", packageName: "Couture — Full", dueDate: daysFromNow(12), total: 85000, received: 85000, status: "paid" },
  { id: "b2", brideName: "Salma Farouk", packageName: "Signature Gown", dueDate: daysFromNow(30), total: 62000, received: 20000, status: "partial" },
  { id: "b3", brideName: "Yara Adel", packageName: "Bespoke Dress", dueDate: daysFromNow(5), total: 48000, received: 12000, status: "deposit_pending" },
  { id: "b4", brideName: "Mariam Zaki", packageName: "Atelier Package", dueDate: daysFromNow(45), total: 90000, received: 0, status: "quoted" },
  { id: "b5", brideName: "Habiba Nabil", packageName: "Evening Couture", dueDate: null, total: 40000, received: 16000, status: "partial" },
  { id: "b6", brideName: "Farida Sami", packageName: "Trial + Gown", dueDate: null, total: 35000, received: 0, status: "cancelled" },
];

export const mockFinanceApi = {
  getOverview: async (range: FinanceRange): Promise<FinanceOverview> => {
    await mockDelay();
    const active = PAYMENTS.filter((p) => p.status !== "cancelled");
    const received = active.reduce((s, p) => s + p.received, 0);
    const deposits = active
      .filter((p) => p.status === "deposit_pending" || p.status === "partial")
      .reduce((s, p) => s + p.received, 0);
    const remaining = active
      .filter((p) => p.status !== "quoted")
      .reduce((s, p) => s + (p.total - p.received), 0);
    const quoted = active
      .filter((p) => p.status === "quoted")
      .reduce((s, p) => s + p.total, 0);

    return {
      range,
      summary: { received, deposits, remaining, quoted },
      payments: PAYMENTS,
    };
  },
};
