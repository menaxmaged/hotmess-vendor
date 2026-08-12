/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Calendar Feature - API Service
 */

import { api } from "@/lib/api-client";
import type { CalendarEvent, EventType } from "./types";

const unwrapList = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.items ?? c.results;
    if (Array.isArray(nested)) return nested as T[];
  }
  return [];
};

const unwrapItem = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    return (c.data ?? c) as T;
  }
  return payload as T;
};

// Server `kind` -> app `type`. confirmed_booking/tentative_hold/blocked_time
// are the same four kinds this module already models, just spelled
// differently server-side.
const KIND_TO_TYPE: Record<string, EventType> = {
  meeting: "meeting",
  confirmed_booking: "booking",
  tentative_hold: "tentative",
  blocked_time: "blocked",
};
const TYPE_TO_KIND: Record<EventType, string> = {
  meeting: "meeting",
  booking: "confirmed_booking",
  tentative: "tentative_hold",
  blocked: "blocked_time",
};

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

// Real event has no brideName/city — those live on the linked conversation
// (`conversationId`), not on the event itself; cross-referencing Modules/inbox
// isn't wired here, so both default null.
const mapEvent = (raw: any): CalendarEvent => ({
  id: raw.id,
  type: KIND_TO_TYPE[raw.kind] ?? "meeting",
  title: raw.title,
  date: raw.startsAt,
  time: raw.startsAt ? formatTime(raw.startsAt) : null,
  brideName: null,
  city: null,
});

const monthRange = (): { from: string; to: string } => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { from: from.toISOString(), to: to.toISOString() };
};

export interface CreateEventInput {
  type: EventType;
  title: string;
  startsAt: string;
  endsAt?: string;
  notes?: string;
}

export interface UpdateEventInput {
  title?: string;
  startsAt?: string;
  endsAt?: string | null;
  notes?: string | null;
}

export interface Availability {
  date: string;
  isAvailable: boolean;
  behaviour: "hide" | "show_busy" | "allow_request";
  reasons: string[];
}

export const calendarApi = {
  // Defaults to the current month so the existing screen/hook can keep
  // calling this with no args — `from`/`to` are required server-side.
  getEvents: async (range?: { from: string; to: string }): Promise<CalendarEvent[]> => {
    const { from, to } = range ?? monthRange();
    const response = await api.get<unknown>("/vendor/calendar", { params: { from, to } });
    return unwrapList<any>(response.data).map(mapEvent);
  },

  // Live and real (full CRUD, richer than this module previously modeled),
  // but not wired into any screen yet — calendar.tsx has no add/edit/delete
  // affordance today. Exposed here for a future pass to build that UI against.
  createEvent: async (input: CreateEventInput): Promise<CalendarEvent> => {
    const response = await api.post<unknown>("/vendor/calendar/events", {
      kind: TYPE_TO_KIND[input.type],
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      notes: input.notes,
    });
    return mapEvent(unwrapItem<any>(response.data));
  },

  updateEvent: async (id: string, input: UpdateEventInput): Promise<CalendarEvent> => {
    const response = await api.patch<unknown>(`/vendor/calendar/events/${id}`, input);
    return mapEvent(unwrapItem<any>(response.data));
  },

  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/vendor/calendar/events/${id}`);
  },

  getAvailability: async (date: string): Promise<Availability> => {
    const response = await api.get<unknown>("/vendor/calendar/availability", { params: { date } });
    return unwrapItem<Availability>(response.data);
  },
};
