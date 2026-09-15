/**
 * Campaign status display — shared by the Ads screen and Home's Ads tab.
 * No status enum is published; unknown values fall back to their raw label.
 */
import i18n from "@/lib/i18n";

const KNOWN = ["pending_payment", "scheduled", "live", "active", "paused", "completed", "cancelled", "flagged", "removed"] as const;
type KnownStatus = (typeof KNOWN)[number];
const isKnown = (status: string): status is KnownStatus => (KNOWN as readonly string[]).includes(status);

const STATUS_CLASS: Record<KnownStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  live: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  active: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  paused: "bg-muted text-muted-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
  flagged: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  removed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const statusMeta = (status: string) =>
  isKnown(status)
    ? { label: i18n.t(`growth:campaignStatus.${status}`), className: STATUS_CLASS[status] }
    : { label: status.replace(/_/g, " "), className: "bg-muted text-muted-foreground" };

export const isLive = (status: string) => status === "live" || status === "active";
