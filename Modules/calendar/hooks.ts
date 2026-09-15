/**
 * Calendar Feature - Hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarApi, type CreateEventInput, type UpdateEventInput } from "./api";

export interface CalendarRange {
  from: string;
  to: string;
}

export const calendarKeys = {
  all: ["calendar"] as const,
  events: (range: CalendarRange) => [...calendarKeys.all, "events", range] as const,
  availability: (date: string) => [...calendarKeys.all, "availability", date] as const,
};

export const useCalendarEvents = (range: CalendarRange) => {
  return useQuery({
    queryKey: calendarKeys.events(range),
    queryFn: () => calendarApi.getEvents(range),
  });
};

/** `date` is yyyy-mm-dd. Reflects booking rules, blocked time and day/weekend caps. */
export const useDayAvailability = (date: string) => {
  return useQuery({
    queryKey: calendarKeys.availability(date),
    queryFn: () => calendarApi.getAvailability(date),
    enabled: !!date,
  });
};

const useInvalidateCalendar = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: calendarKeys.all });
};

export const useCreateEvent = () => {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (input: CreateEventInput) => calendarApi.createEvent(input),
    onSuccess: invalidate,
  });
};

export const useUpdateEvent = () => {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      calendarApi.updateEvent(id, input),
    onSuccess: invalidate,
  });
};

export const useDeleteEvent = () => {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (id: string) => calendarApi.deleteEvent(id),
    onSuccess: invalidate,
  });
};
