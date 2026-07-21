/**
 * Calendar Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockCalendarApi } from "./mock";
import type { CalendarEvent } from "./types";

const unwrapList = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.items ?? c.results;
    if (Array.isArray(nested)) return nested as T[];
  }
  return [];
};

const liveCalendarApi = {
  getEvents: async (): Promise<CalendarEvent[]> => {
    const response = await api.get<unknown>("/vendor/calendar/events");
    return unwrapList<CalendarEvent>(response.data);
  },
};

export const calendarApi: typeof liveCalendarApi = USE_MOCK_DATA
  ? mockCalendarApi
  : liveCalendarApi;
