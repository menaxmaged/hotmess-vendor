/**
 * Calendar Feature Types
 */

export type CalendarView = "month" | "week" | "agenda";

export type EventType = "meeting" | "booking" | "tentative" | "blocked";

export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  /** ISO date (day granularity) */
  date: string;
  /** Optional display time, e.g. "4:00 PM" */
  time?: string | null;
  brideName?: string | null;
  city?: string | null;
  startsAt: string;
  endsAt: string | null;
  notes: string | null;
  /** Written by a confirmed meeting and owned by its conversation — not editable here. */
  isDerived: boolean;
  conversationId: string | null;
}
