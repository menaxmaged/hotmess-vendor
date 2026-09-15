/**
 * Notifications Feature - Mock Data
 */

import { mockDelay } from "@/lib/mock-utils";
import type { AppNotification, NotificationPreference, NotificationsPage } from "./types";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

let notifications: AppNotification[] = [
  { id: "n1", type: "vendor_new_enquiry", title: "New enquiry", body: "Salma Adel asked about June availability.", deepLink: "/inbox/chat-1", readAt: null, sentAt: hoursAgo(1), createdAt: hoursAgo(1) },
  { id: "n2", type: "vendor_follow_up_due", title: "Follow-up due", body: "Nourhan Samir is waiting on a quote.", deepLink: "/inbox/chat-2", readAt: null, sentAt: hoursAgo(5), createdAt: hoursAgo(5) },
  { id: "n3", type: "vendor_campaign_live", title: "Your campaign is live", body: "Spring atelier slots is now showing on the home banner.", deepLink: "/more/ads", readAt: hoursAgo(20), sentAt: hoursAgo(24), createdAt: hoursAgo(24) },
  { id: "n4", type: "subscription_expiry", title: "Premium renews soon", body: "Your plan renews in 3 days.", deepLink: "/more/premium", readAt: hoursAgo(40), sentAt: hoursAgo(48), createdAt: hoursAgo(48) },
];

let preferences: NotificationPreference[] = [
  { type: "vendor_new_enquiry", push: true, email: true, inApp: true },
  { type: "vendor_chat_assigned", push: true, email: false, inApp: true },
  { type: "vendor_follow_up_due", push: true, email: true, inApp: true },
  { type: "vendor_instagram_disconnected", push: true, email: true, inApp: true },
  { type: "vendor_campaign_live", push: true, email: true, inApp: true },
  { type: "unread_message", push: true, email: false, inApp: true },
  { type: "meeting_accepted", push: true, email: true, inApp: true },
  { type: "subscription_expiry", push: true, email: true, inApp: true },
  { type: "platform_notice", push: true, email: true, inApp: true },
];

export const mockNotificationsApi = {
  registerDeviceToken: async (_token: string, _platform: "ios" | "android" | "web"): Promise<void> => {
    await mockDelay(100);
  },

  revokeDeviceToken: async (_token: string): Promise<void> => {
    await mockDelay(100);
  },

  list: async (page = 1, unreadOnly = false): Promise<NotificationsPage> => {
    await mockDelay();
    return {
      notifications: unreadOnly ? notifications.filter((n) => !n.readAt) : notifications,
      currentPage: page,
      hasNext: false,
    };
  },

  getUnreadCount: async (): Promise<number> => {
    await mockDelay(150);
    return notifications.filter((n) => !n.readAt).length;
  },

  markRead: async (id: string): Promise<AppNotification> => {
    await mockDelay(150);
    notifications = notifications.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n));
    const found = notifications.find((n) => n.id === id);
    if (!found) throw new Error("Notification not found");
    return found;
  },

  markAllRead: async (): Promise<number> => {
    await mockDelay(150);
    const count = notifications.filter((n) => !n.readAt).length;
    const now = new Date().toISOString();
    notifications = notifications.map((n) => (n.readAt ? n : { ...n, readAt: now }));
    return count;
  },

  getPreferences: async (): Promise<NotificationPreference[]> => {
    await mockDelay();
    return preferences;
  },

  updatePreferences: async (next: NotificationPreference[]): Promise<NotificationPreference[]> => {
    await mockDelay();
    preferences = next;
    return preferences;
  },
};
