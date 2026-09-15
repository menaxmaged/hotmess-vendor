import type { Href } from "expo-router";
import { router } from "expo-router";
import { Linking } from "react-native";

/**
 * Backend `deepLink` values are API-shaped paths, not this app's routes —
 * the spec's own examples are `/conversations/{id}`, `/vendor/profile`,
 * `/vendor/profile/packages`, `/community`. Map the first segment (after an
 * optional `/vendor` prefix) onto the vendor app's screens. Absolute URLs
 * open externally; anything unrecognised is ignored rather than pushed as a
 * route that would 404.
 */
// `/vendor/profile/<x>` sub-paths → the profile screen's tab that edits <x>.
const PROFILE_SUBPATH_TABS: Record<string, string> = {
  packages: "files",
  files: "files",
  portfolio: "files",
  categories: "categories",
  coverage: "categories",
  booking: "booking",
  "booking-rules": "booking",
  instagram: "instagram",
};

export type ResolvedDeepLink = { type: "internal"; href: Href } | { type: "external"; url: string };

export function resolveDeepLink(link: string | null | undefined): ResolvedDeepLink | null {
  if (!link) return null;
  if (/^https?:\/\//i.test(link)) return { type: "external", url: link };
  if (!link.startsWith("/")) return null;

  const path = link.split(/[?#]/)[0]!.replace(/^\/vendor(?=\/|$)/, "");
  const [, first = "", second] = path.split("/");

  switch (first) {
    case "conversations":
    case "inbox":
      return { type: "internal", href: (second ? `/(app)/inbox/${second}` : "/(app)/inbox") as Href };
    case "profile": {
      const tab = second ? PROFILE_SUBPATH_TABS[second] : undefined;
      return { type: "internal", href: (tab ? `/(app)/more/profile?tab=${tab}` : "/(app)/more/profile") as Href };
    }
    case "ad-campaigns":
    case "ads":
      return { type: "internal", href: "/(app)/more/ads" };
    case "subscription":
    case "premium":
      return { type: "internal", href: "/(app)/more/premium" };
    case "team":
    case "roles":
      return { type: "internal", href: "/(app)/more/team" as Href };
    case "automation":
      return { type: "internal", href: "/(app)/more/automation" };
    case "saved-replies":
      return { type: "internal", href: "/(app)/more/saved-replies" as Href };
    case "onboarding-checklist":
      return { type: "internal", href: "/(app)/more/onboarding-checklist" as Href };
    case "notifications":
      return { type: "internal", href: "/(app)/more/notifications" as Href };
    case "calendar":
      return { type: "internal", href: "/(app)/calendar" };
    case "finance":
    case "quotes":
      return { type: "internal", href: "/(app)/finance" };
    case "analytics":
      return { type: "internal", href: "/(app)/analytics" };
    case "more":
      return { type: "internal", href: `/(app)${path}` as Href };
    default:
      return null;
  }
}

/** Follows a backend deep link. Returns false when there was nowhere to go. */
export function openDeepLink(link: string | null | undefined): boolean {
  const resolved = resolveDeepLink(link);
  if (!resolved) return false;
  if (resolved.type === "external") {
    void Linking.openURL(resolved.url);
  } else {
    router.push(resolved.href);
  }
  return true;
}
