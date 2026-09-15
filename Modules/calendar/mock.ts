/**
 * Calendar Feature - Mock Data
 */

import { mockDelay } from "@/lib/mock-utils";
import type { CalendarEvent } from "./types";

function dayISO(offsetDays: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

type MockEventSeed = Omit<CalendarEvent, "startsAt" | "endsAt" | "notes" | "isDerived" | "conversationId">;

const SEEDS: MockEventSeed[] = [
  { id: "e1", type: "meeting", title: "First fitting", date: dayISO(0), time: "4:00 PM", brideName: "Nour Hassan", city: "Cairo" },
  { id: "e2", type: "booking", title: "Wedding — confirmed", date: dayISO(2), time: "All day", brideName: "Salma Farouk", city: "Sahel" },
  { id: "e3", type: "tentative", title: "Tentative hold", date: dayISO(3), time: null, brideName: "Yara Adel", city: "Cairo" },
  { id: "e4", type: "meeting", title: "Consultation", date: dayISO(5), time: "1:30 PM", brideName: "Mariam Zaki", city: "Alexandria" },
  { id: "e5", type: "blocked", title: "Studio closed", date: dayISO(7), time: "All day" },
  { id: "e6", type: "booking", title: "Engagement — confirmed", date: dayISO(9), time: "All day", brideName: "Habiba Nabil", city: "Cairo" },
  { id: "e7", type: "meeting", title: "Final fitting", date: dayISO(12), time: "5:00 PM", brideName: "Farida Sami", city: "Cairo" },
  { id: "e8", type: "tentative", title: "Tentative hold", date: dayISO(18), time: null, brideName: "Layla Kamal", city: "Sahel" },
];

const EVENTS: CalendarEvent[] = SEEDS.map((e) => ({
  ...e,
  startsAt: e.date,
  endsAt: null,
  notes: null,
  isDerived: e.type === "booking",
  conversationId: null,
}));

export const mockCalendarApi = {
  getEvents: async (): Promise<CalendarEvent[]> => {
    await mockDelay();
    return EVENTS;
  },
};
