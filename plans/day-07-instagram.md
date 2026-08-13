# Day 7 — Instagram: Real OAuth

> Status: implemented 2026-08-13.

## Context

Instagram is currently folded into `profile/instagram/connect` as a bare toggle (`connect()`/`disconnect()`) — that shape can't work against the real endpoint. Confirmed live: **Instagram is now its own top-level resource**, real OAuth-code-exchange flow: `GET /vendor/instagram` (connection status), `POST /vendor/instagram/connect` (exchanges an OAuth code — not a toggle), `DELETE /vendor/instagram`.

## Scope

1. Extract Instagram out of `Modules/profile` into its own `Modules/instagram/` (decide during implementation whether it stays a `profile` sub-namespace or a fully separate module — either is fine, but the API calls must go through the real OAuth-code-exchange shape either way).
2. Find wherever the profile screen's Instagram tab currently handles the connect toggle and wire in the actual OAuth redirect/code-capture flow feeding `connect(code)`.
3. `disconnect()` → `DELETE /vendor/instagram`.

## Verification

1. `npx tsc --noEmit` clean.
2. Profile → Instagram tab: connect flow completes a real OAuth code exchange (not an instant toggle), status reflects real connection state, disconnect works.

## What was actually built

Pulled exact request/response schemas from the live spec (`/vendor/instagram*`, plus checked `/vendors/{id}/instagram-posts` for the portfolio grid — see below).

- **Went fully separate**: `Modules/instagram/` (`types.ts`, `api.ts`, `mock.ts`, `hooks.ts`, `oauth.ts`), matching the pattern the other new modules this pass settled into (roles, subscription, automation). `Modules/profile` had `InstagramStatus`, `connectInstagram`/`disconnectInstagram`, and the `instagram` field on `ProfileOverview` stripped out entirely — `InstagramTab.tsx` stays in `Modules/profile/components` (it's still a tab on the Profile screen) but now sources its own data from the new module instead of taking a `status` prop, so `profile.tsx` no longer passes one.
- **`connect` is a real OAuth code exchange, not a toggle, exactly as the plan warned.** `POST /vendor/instagram/connect` requires `{code, redirectUri}` — the client never holds a long-lived token, only a short-lived authorization code it hands to the server once. Built `oauth.ts`: constructs the Instagram authorize URL, opens it with `expo-web-browser`'s `openAuthSessionAsync` (already a dependency — no new package installed), captures the `code` off the redirect via `expo-linking`, then hands it to `connect()`.
- **Genuinely blocked on external configuration, flagged rather than faked**: there is no real Meta/Instagram App ID anywhere in this codebase or its env (checked — `EXPO_PUBLIC_INSTAGRAM_CLIENT_ID` doesn't exist), and the live backend's own `GET /vendor/instagram` reports `configured: false` in its example — meaning even a perfectly-built client flow gets a 503 today because the backend's own Meta app registration is outstanding too. Same shape of gap as day-5's missing payment-provider SDK. `isInstagramOAuthConfigured()` checks for the env var and the Instagram tab shows a plain "not fully set up" message instead of attempting (and silently failing) a broken exchange. The OAuth `scope` constant (`instagram_business_basic`) is a best-guess against Meta's current product naming, flagged in code as unconfirmed against whatever the backend's Meta app actually registers under — whoever sets up that app needs to verify it.
- **`disconnect` → `DELETE /vendor/instagram`** wired for real, no blockers — this direction needs no external credential, just the studio's own bearer token.
- **Dropped fields the real connection-status endpoint doesn't have**: no `username`, no `portfolioImages` (both were mock inventions). Status now shows the raw `igUserId` instead of a handle. **Found but not wired**: `GET /vendors/{id}/instagram-posts` is a real, separate endpoint that *would* supply actual portfolio grid images (proxied server-side, up to 12 posts) — it wasn't in this day's scoped endpoint list, needs the studio's own vendor id threaded in from `Modules/profile`, and is Premium-gated (403 `upgrade_required` tag on the route). Flagged as a good next step, not built now — the plan's own verification only asks for connection status + connect + disconnect, not the grid.

## Verification actually performed

- `npx tsc --noEmit` — clean.
- `npx eslint Modules/instagram Modules/profile app/(app)/more/profile.tsx` — 0 errors after fixing two `react/no-unescaped-entities` (apostrophes).
- `git status --short` — diff scoped to new `Modules/instagram/*`, `Modules/profile/*` (Instagram removed), and `app/(app)/more/profile.tsx`.
- **Not done, and can't be done without the missing Meta App ID + backend registration**: an actual end-to-end OAuth handshake. No live device/simulator test either — same gap as days 1–6.
