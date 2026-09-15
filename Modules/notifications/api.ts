/**
 * Notifications Feature - API Service
 *
 * In-app list + badge + read state (tag "Notifications") and the per-type
 * channel toggles under /users/me/notification-preferences. Device-token
 * registration is not wired: it needs expo-notifications, which isn't a
 * dependency of this app yet.
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockNotificationsApi } from "./mock";
import type { AppNotification, NotificationPreference, NotificationsPage } from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

const PAGE_SIZE = 25;

const liveNotificationsApi = {
  list: async (page = 1, unreadOnly = false): Promise<NotificationsPage> => {
    const response = await api.get<unknown>("/notifications", {
      params: { page, limit: PAGE_SIZE, unreadOnly: unreadOnly ? "true" : "false" },
    });
    const raw = unwrap<AppNotification[]>(response.data);
    const meta = (response.data as { meta?: { currentPage?: number; hasNext?: boolean } })?.meta;
    return {
      notifications: Array.isArray(raw) ? raw : [],
      currentPage: meta?.currentPage ?? page,
      hasNext: meta?.hasNext ?? false,
    };
  },

  // Excludes dispatch-only rows, so the badge never counts something with no list item.
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<unknown>("/notifications/unread-count");
    return unwrap<{ unread?: number }>(response.data)?.unread ?? 0;
  },

  markRead: async (id: string): Promise<AppNotification> => {
    const response = await api.post<unknown>(`/notifications/${id}/read`);
    return unwrap<AppNotification>(response.data);
  },

  markAllRead: async (): Promise<number> => {
    const response = await api.post<unknown>("/notifications/read-all");
    return unwrap<{ readCount?: number }>(response.data)?.readCount ?? 0;
  },

  getPreferences: async (): Promise<NotificationPreference[]> => {
    const response = await api.get<unknown>("/users/me/notification-preferences");
    const raw = unwrap<NotificationPreference[]>(response.data);
    return Array.isArray(raw) ? raw : [];
  },

  // Full replace — the client always posts the whole grid back.
  updatePreferences: async (preferences: NotificationPreference[]): Promise<NotificationPreference[]> => {
    const response = await api.put<unknown>("/users/me/notification-preferences", {
      preferences: preferences.map(({ type, push, email, inApp }) => ({ type, push, email, inApp })),
    });
    const raw = unwrap<NotificationPreference[]>(response.data);
    return Array.isArray(raw) ? raw : preferences;
  },
};

export const notificationsApi: typeof liveNotificationsApi = USE_MOCK_DATA
  ? mockNotificationsApi
  : liveNotificationsApi;
