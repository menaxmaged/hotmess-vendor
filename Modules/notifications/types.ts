/**
 * Notifications Feature Types
 */

/** GET /v1/notifications row. `type` is the template type — finer-grained than a preference family. */
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  deepLink: string | null;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface NotificationsPage {
  notifications: AppNotification[];
  currentPage: number;
  hasNext: boolean;
}

/** Preference families. The server only returns the ones this account type can hold. */
export type NotificationPreferenceType =
  | "task_deadline"
  | "task_overdue"
  | "bridesmaid_task_completed"
  | "occasion_countdown"
  | "vendor_new_enquiry"
  | "vendor_chat_assigned"
  | "vendor_follow_up_due"
  | "vendor_instagram_disconnected"
  | "vendor_campaign_live"
  | "unread_message"
  | "meeting_accepted"
  | "subscription_expiry"
  | "platform_notice";

export interface NotificationPreference {
  type: NotificationPreferenceType;
  push: boolean;
  email: boolean;
  inApp: boolean;
}
