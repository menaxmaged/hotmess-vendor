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
    queryFn: calendarApi.getEvents,
  });
};
