# HOTMESS Vendor App — Wire Real Backend

> **Status: implemented and verified** (`tsc --noEmit` clean, lint 0 errors). Kept here as a record of what's live vs. still mock, and why — useful before wiring any further module.

## Context

`hotmess-vendor` (Expo/React Native) has a UI layer that's essentially done — every tab (Home, Inbox, Calendar, Analytics, Finance, More/Profile/Team/Ads/Automation/Premium) is a real built screen wired to a consistent `Modules/<name>/{api,hooks,types,mock}.ts` pattern. Every module currently talks to mock data only (`EXPO_PUBLIC_USE_MOCK_DATA=true`), and the live-mode paths it would otherwise call (`/auth/*`, `/vendor/*`, no `/v1` prefix) don't match the real backend.

A real backend now exists at `https://hotmess-api.codexeg.net` (OpenAPI 3.0.3, confirmed by fetching `/docs/swagger-ui-init.js`). Comparing it against the app in detail surfaced a critical fact that shapes this whole plan: **the backend only covers a fraction of what the app's modules assume.**

**What's real:**
- Auth: login, logout, `/auth/me` (replaces the app's fictional `/auth/check`).
- Vendor Studio → Conversations: list, counts, get-one, update-status only (**no send-message, assign, pin, archive, follow-up, notes, or mark-unread endpoints exist**).
- Vendor Studio → Calendar: full CRUD + availability (**richer than the app's current read-only calendar module**).

**What's fictional / has zero backend coverage** — Home, Profile (studio name/categories/cover/packages/Instagram), Team, Finance, Ads, Analytics modules, `/auth/register` + OTP verify/resend (backend's `/v1/auth/register` only creates **bride** accounts — there is no vendor self-serve signup endpoint at all), authenticated password-change, and profile-avatar update. A Notifications module could be built (real endpoints exist) but the app currently has no client code or `expo-notifications` dependency for it at all — a new-module effort, not a remap.

**What this deliberately did NOT do:** flip `EXPO_PUBLIC_USE_MOCK_DATA` off globally. That flag currently gates 9 modules as all-mock-or-all-live; since 6 of them (home/profile/team/finance/analytics/ads) have no real endpoint to call, a global flip would 404 most of the app. Instead the mock/live decision moved to **per-method**, inside just the 3 modules that have real coverage.

## What was built

1. **`lib/api-client.ts`** — base URL → real API (`https://hotmess-api.codexeg.net/v1`), stripped debug `console.log`s. Token manager, interceptors, web cache, error mapping untouched.
2. **`Modules/auth`** — `login`, `logout`, `checkAuth` (→ `GET /auth/me`) call the real backend unconditionally. `register`/`verifyOTP`/`resendOTP`/`resetPassword`/`updateProfile` still call their mock implementations, each commented with why: `register` would silently create a **bride** account for a vendor user; no OTP endpoints exist; no authenticated change-password endpoint exists; profile fields don't match `/v1/users/me`'s bride-shaped schema. `User` type aligned to the real schema (`accountType`, not the old `role` field — which was a leftover from an unrelated medical-app template). Also fixed: `context.logout()` previously never called the server revoke endpoint at all (dead `useLogout`/`authApi.logout` hook, settings screen only cleared the local token) — now it does, best-effort.
3. **`Modules/inbox`** — `getChats` + `updateStatus` live against `/vendor/conversations`, with a mapper for the real (much thinner) payload — no `occasionType`/`city`/`eventDate`/`lastMessagePreview`/`pinned`/`contractValue` exist server-side at all, those render blank rather than crash. `getChat` (detail/thread) **stays mock** — the real detail endpoint returns the same thin shape as the list, no messages and no bride occasion/budget detail (no message-read endpoint exists anywhere under Vendor Studio), so going live there would replace a working screen with a status header over an empty thread. A fallback was added so tapping a *live* conversation (real id) degrades to a thin real detail instead of crashing mock's hardcoded-id lookup. `sendMessage`/`assignChat`/`togglePin`/`toggleArchive`/`setFollowUp`/`addNote`/`markUnread` now throw a clear "not available — no backend endpoint" error (caught by react-query's `onError`, no crash) instead of writing into the mock's id-mismatched local store.
4. **`Modules/calendar`** — `getEvents` now ranged (`GET /vendor/calendar?from&to`, defaults to the current month internally — `app/(app)/calendar.tsx` needed no changes). Added `createEvent`/`updateEvent`/`deleteEvent`/`getAvailability` as new live methods (full CRUD, richer than before) — **exposed at the API layer only, no UI yet** (calendar screen has no add/edit/delete affordance today).
5. **`.env` / `.env.example`** — real API URL; `EXPO_PUBLIC_USE_MOCK_DATA=true` kept (still fully protects the 6 modules with zero backend, and the auth methods with no real equivalent).

## Explicitly out of scope (flagged, not built)
Notifications module, calendar CRUD UI, forgot-password screens, vendor self-registration (backend doesn't support it), and the 6 modules with no backend at all (Home, Profile, Team, Finance, Ads, Analytics).

## Verification performed

1. `npx tsc --noEmit` — clean.
2. `npx eslint Modules/auth Modules/inbox Modules/calendar lib/api-client.ts` — 0 errors (6 pre-existing-pattern warnings, not new).
3. `git status --short` — diff scoped to exactly the intended files.
4. Confirmed all 6 untouched modules (home/profile/team/finance/ads/analytics) still `USE_MOCK_DATA`-gated, no regression.

## Next up

**All 11 days done, 2026-08-13** (`plans/day-01-*.md` through `day-11-*.md`, each with a "what was actually built" section — read the specific day before touching that module again). All `tsc`/lint clean; none live-tested, no running Expo session or test/session account this pass, across every day.

Days 1–8 were the original planned remap (inbox → profile → team+roles → finance → subscription → automation → instagram → vendor signup), **committed and pushed** to both remotes (`menaxmaged/hotmess-vendor`, `hatchingducks/hotmess-vendor`) as 6 commits on `main` (day-01/08 predate this pass's commits; days 2–7 each own commit). Days 9–11 came from a follow-up vendor-wide route-coverage audit (all 58 `/v1/vendor/*` path+method combos cross-referenced against every module's actual call sites) that found 6 real endpoints nothing called — 3 small wiring fixes folded into days 1/6/7's own plan docs as addenda, 3 full new modules got their own day file. **Days 9–11 and the day-1/6/7 addenda are not yet committed** — working-tree edits only as of this writing.

Highlights and open flags, newest-relevant first:
- **Day 11 (quotes)**: new `Modules/quotes`, real line-items-and-computed-total model. Replaced the old day-1 read-only bride-panel quote summary in chat detail with a full quote-builder (create + accept/expire).
- **Day 10 (saved-replies)**: new `Modules/saved-replies`, Premium-gated management screen + quick-insert in the chat composer. Found and fixed the same stale-mock Premium-gate bug (More menu reading `Modules/home`'s mock plan flag) that days 5/6 already fixed elsewhere.
- **Day 9 (onboarding-checklist)**: new module, moved the home screen's setup-nudge widget off `Modules/home`'s mock onto it, added a real checklist screen. Real `deepLink` values are unconfirmed against this app's actual routes.
- **Day 1/6 addenda**: wired `GET /vendor/conversations/counts` (real chip counts, were client-computed) and `GET .../notes` (notes could be created but never read back). Found and fixed a related bug while in there: the assign-to picker could never target a team member with zero current leads. Also found and removed a duplicate, fully-mock `auto-assign.tsx` screen that would have shipped alongside day-6's real one.
- **Day 7 addendum**: Instagram portfolio grid now wired for real (`GET /vendors/{id}/instagram-posts`), needed threading the studio's own id out of `Modules/profile`.
- **Day 7**: split into its own `Modules/instagram/`, real OAuth code-exchange flow built (`expo-web-browser` + `expo-linking`, no new deps) — but blocked on a missing Meta/Instagram App ID (`EXPO_PUBLIC_INSTAGRAM_CLIENT_ID` doesn't exist) and the backend's own Meta app registration also being outstanding (`configured: false`). Flagged in the UI, not faked.
- **Day 6**: `Modules/automation/` wired into `automation.tsx`'s Save button for real (was a bare `Alert`); "Welcome + files" modes are still selectable with no file-attach UI anywhere — pre-existing gap, now visible since save is real.
- **Day 5**: `premium.tsx` moved off `Modules/home`'s mock onto real `Modules/subscription`. Upgrade opens a real checkout (webhook-confirmed, not instant). Invoice PDF download is real on web, flagged-unwired on native (no expo-file-system/expo-sharing installed). "Change payment method" stays a flagged no-op — no payment-provider SDK in the app.
- **Day 3**: split `Modules/roles` out of `Modules/team`. `acceptInvite` is wired to `app/(auth)/accept-invite.tsx` — public pre-auth screen, reuses `useAuth().login()` for sign-in.
- **Day 4**: rebuilt around a flat per-transaction ledger — the real API has no per-bride running-total concept at all. Report export/poll wired API-only, no UI.
- **Day 2**: `updateCore`/`uploadCoverImage` still on mock — no cover-image upload endpoint exists in the live spec, and `businessName` isn't editable server-side at all.

Still not planned:
- Notifications module (real endpoints exist, zero client code today — needs `expo-notifications` dep + device-token registration + new screens).
- Calendar create/edit/delete UI (API layer ready, screen has no affordance yet).
- Revisit `Modules/inbox#getChat` once the backend adds a message-read endpoint and richer bride detail — the thin-detail fallback should be replaced with the real thing at that point.
- Home, Ads, Analytics modules — still zero backend coverage.
