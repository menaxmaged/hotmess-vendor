/**
 * Notifications Feature - Hooks
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "./api";
import type { NotificationPreference } from "./types";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly: boolean) => [...notificationKeys.all, "list", { unreadOnly }] as const,
  unread: () => [...notificationKeys.all, "unread-count"] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
};

export const useNotifications = (unreadOnly = false) => {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam, unreadOnly),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.currentPage + 1 : undefined),
  });
};

// No realtime channel — the badge polls, same as the inbox badge.
export const useNotificationUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 60_000,
  });
};

const useInvalidateNotifications = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [...notificationKeys.all, "list"] });
    queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
  };
};

export const useMarkNotificationRead = () => {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: invalidate,
  });
};

export const useMarkAllNotificationsRead = () => {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: invalidate,
  });
};

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: notificationsApi.getPreferences,
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: NotificationPreference[]) =>
      notificationsApi.updatePreferences(preferences),
    onSuccess: (saved) => {
      queryClient.setQueryData(notificationKeys.preferences(), saved);
    },
  });
};
