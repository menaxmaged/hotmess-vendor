# Day 15 — In-App Notifications & Preferences

> Status: implemented 2026-09-15

## Context

2026-09-15 re-audit: the Notifications tag (6 ops) and the notification-preference routes (2 ops) have zero client code. The home bell icon opens "More" and shows a permanent fake unread dot; Settings → "Notification preferences" is an `Alert` saying "not wired up".

Real routes:
- `GET /v1/notifications?page&limit(≤100)&unreadOnly=true|false` — newest first, offset-paged; `{id, type, title, body, deepLink, readAt, sentAt, createdAt}`. Copy is stored as rendered, in the recipient's language.
- `GET /v1/notifications/unread-count` — `{unread}`.
- `POST /v1/notifications/{id}/read` (idempotent), `POST /v1/notifications/read-all` (`{readCount}`).
- `GET /v1/users/me/notification-preferences` — every type the account can hold (a vendor sees studio families + shared ones), unset = all channels on; `{type, push, email, inApp}[]`.
- `PUT /v1/users/me/notification-preferences` — full replace `{preferences: [...]}`; a type not applicable to the account is a 422.
- `POST /v1/notifications/device-tokens` / `DELETE .../{id}` — push registration.

## Scope

1. New `Modules/notifications` (api/types/hooks/mock): list (infinite), unread count (polled), mark one / all read, get / replace preferences.
2. New `app/(app)/more/notifications.tsx` — list with unread styling, tap marks read and follows `deepLink` (in-app path → router, absolute URL → `Linking`), "Mark all read".
3. New `app/(app)/more/notification-preferences.tsx` — per-type rows with Push / Email / In-app toggles, saves the whole grid.
4. Wire entry points: Home bell → notifications with a real unread dot; More menu item with count; Settings row → preferences.

**Not in scope — blocked on a decision:** device-token registration needs `expo-notifications` (not installed; native module → new dev-client build). The two device-token routes stay unwired until that dependency is approved.

## Verification

- `npx tsc --noEmit`, `npx eslint Modules/notifications "app/(app)/more" "app/(app)/index.tsx"`.
- Cross-reference re-run: 4 notification ops + 2 preference ops called.
- `git status --short`.
- No live run.

## What was actually built

- **`Modules/notifications`** (api/types/hooks/mock) — `list` (offset-paged, `meta.currentPage`/`hasNext`), `getUnreadCount`, `markRead`, `markAllRead`, `getPreferences`, `updatePreferences` (full-grid PUT). Hooks: `useNotifications` (infinite), `useNotificationUnreadCount` (polls 60s), `useMarkNotificationRead`, `useMarkAllNotificationsRead`, `useNotificationPreferences`, `useUpdateNotificationPreferences` (writes the server's returned grid straight into the cache).
- **`lib/deep-link.ts`** — `resolveDeepLink` / `openDeepLink`. The spec's own `deepLink` examples are backend paths (`/conversations/{id}`, `/vendor/profile`, `/vendor/profile/packages`, `/tasks/{id}`, `/community`), not app routes. Maps the first segment (after an optional `/vendor`) to the vendor screens; absolute URLs open externally; unknown paths are ignored instead of pushed.
- **`app/(app)/more/notifications.tsx`** — All/Unread filter, unread styling, relative time, tap marks read + follows the mapped deep link (chevron only when it resolves), "Mark all read" header action, infinite scroll, pull to refresh, gear → preferences.
- **`app/(app)/more/notification-preferences.tsx`** — renders exactly the types the server returns (it only returns what the account can hold), Push/Email/In-app switches per type, sticky Save/Discard bar that PUTs the whole grid.
- **Entry points:** Home bell → notifications, dot only when `unread > 0` (was a permanent fake dot, and opened More); More menu gets "Notifications" with the unread count; Settings "Notification preferences" row → real screen (was an "isn't wired up" alert); two new screens registered in the More stack.

**Changed from plan / found:**
- **Bug fixed along the way:** `app/(app)/more/onboarding-checklist.tsx` did `router.push(item.deepLink)` with the backend's `/vendor/profile`-style values — not an app route, so every checklist tap would land on not-found against the live API. Now goes through `openDeepLink`.
- Used RN `Switch` directly instead of the nativewindui `Toggle` wrapper.

**Blocked, not built:** `POST /notifications/device-tokens` and `DELETE /notifications/device-tokens/{id}`. Registering needs a push token from `expo-notifications`, which isn't installed; adding it is a native module → new dev-client/EAS build. Needs a go-ahead.

## Verification actually performed

- `npx tsc --noEmit` — exit 0.
- `npx eslint Modules/notifications lib/deep-link.ts "app/(app)/more" "app/(app)/index.tsx"` — 0 errors, 1 warning (`router` unused in onboarding-checklist after the deep-link change) → removed → clean in the next run.
- Cross-reference re-run — the 4 notification ops + 2 preference ops no longer listed as uncalled; only the 2 device-token routes remain.
- **Not done:** no device run, no real notification rows to tap through; the deep-link mapping is based only on the spec's examples.
