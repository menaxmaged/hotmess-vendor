/**
 * Calendar Feature - Hooks
 */

import { useQuery } from "@tanstack/react-query";
import { calendarApi } from "./api";

export const calendarKeys = {
  all: ["calendar"] as const,
  events: () => [...calendarKeys.all, "events"] as const,
};

export const useCalendarEvents = () => {
  return useQuery({
    queryKey: calendarKeys.events(),
    // Explicit wrapper, not a bare `calendarApi.getEvents` reference — react-query
    // calls queryFn with a context object ({queryKey, signal, ...}) as its first
    // arg, which would otherwise leak into getEvents' optional `range` param.
    queryFn: () => calendarApi.getEvents(),
  });
};
