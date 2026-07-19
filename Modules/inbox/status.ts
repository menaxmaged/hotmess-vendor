/**
 * Lead status vocabulary metadata — PRD Section 13
 */
import type { LeadStatus } from "./types";

export interface StatusMeta {
  label: string;
  colorClassName: string;
  bgClassName: string;
  actionRequired: boolean;
}

export const STATUS_META: Record<LeadStatus, StatusMeta> = {
  new_inquiry: {
    label: "New inquiry",
    colorClassName: "text-pink-700 dark:text-pink-300",
    bgClassName: "bg-pink-100 dark:bg-pink-950",
    actionRequired: true,
  },
  needs_reply: {
    label: "Needs reply",
    colorClassName: "text-amber-700 dark:text-amber-300",
    bgClassName: "bg-amber-100 dark:bg-amber-950",
    actionRequired: true,
  },
  needs_quotation: {
    label: "Needs quotation",
    colorClassName: "text-amber-700 dark:text-amber-300",
    bgClassName: "bg-amber-100 dark:bg-amber-950",
    actionRequired: true,
  },
  quotation_sent: {
    label: "Quotation sent",
    colorClassName: "text-blue-700 dark:text-blue-300",
    bgClassName: "bg-blue-100 dark:bg-blue-950",
    actionRequired: false,
  },
  needs_follow_up: {
    label: "Needs follow-up",
    colorClassName: "text-amber-700 dark:text-amber-300",
    bgClassName: "bg-amber-100 dark:bg-amber-950",
    actionRequired: true,
  },
  waiting_for_bride: {
    label: "Waiting for bride",
    colorClassName: "text-blue-700 dark:text-blue-300",
    bgClassName: "bg-blue-100 dark:bg-blue-950",
    actionRequired: false,
  },
  meeting_scheduled: {
    label: "Meeting scheduled",
    colorClassName: "text-purple-700 dark:text-purple-300",
    bgClassName: "bg-purple-100 dark:bg-purple-950",
    actionRequired: false,
  },
  tentative_booking: {
    label: "Tentative booking",
    colorClassName: "text-purple-700 dark:text-purple-300",
    bgClassName: "bg-purple-100 dark:bg-purple-950",
    actionRequired: true,
  },
  deposit_pending: {
    label: "Deposit pending",
    colorClassName: "text-orange-700 dark:text-orange-300",
    bgClassName: "bg-orange-100 dark:bg-orange-950",
    actionRequired: true,
  },
  booked: {
    label: "Booked",
    colorClassName: "text-green-700 dark:text-green-300",
    bgClassName: "bg-green-100 dark:bg-green-950",
    actionRequired: false,
  },
  fully_paid: {
    label: "Fully paid",
    colorClassName: "text-emerald-800 dark:text-emerald-300",
    bgClassName: "bg-emerald-100 dark:bg-emerald-950",
    actionRequired: false,
  },
  no_lead: {
    label: "No lead",
    colorClassName: "text-muted-foreground",
    bgClassName: "bg-muted",
    actionRequired: false,
  },
  lost_declined: {
    label: "Lost / Declined",
    colorClassName: "text-muted-foreground",
    bgClassName: "bg-muted",
    actionRequired: false,
  },
  unavailable: {
    label: "Unavailable",
    colorClassName: "text-red-700 dark:text-red-300",
    bgClassName: "bg-red-100 dark:bg-red-950",
    actionRequired: false,
  },
  archived: {
    label: "Archived",
    colorClassName: "text-muted-foreground",
    bgClassName: "bg-muted",
    actionRequired: false,
  },
};

export const STATUS_ORDER: LeadStatus[] = [
  "new_inquiry",
  "needs_reply",
  "needs_quotation",
  "quotation_sent",
  "needs_follow_up",
  "waiting_for_bride",
  "meeting_scheduled",
  "tentative_booking",
  "deposit_pending",
  "booked",
  "fully_paid",
  "no_lead",
  "lost_declined",
  "unavailable",
  "archived",
];
