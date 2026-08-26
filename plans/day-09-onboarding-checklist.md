# Day 9 — Onboarding Checklist (New Module)

> Status: implemented 2026-08-13.

## Context

A vendor-wide route-coverage audit (comparing all 58 `/v1/vendor/*` path+method combinations against every module's actual call sites) found three real endpoint groups with no app coverage at all, flagged since day-1's own plan as "net-new features, not covered by these day-plans." This is the first: `GET /vendor/onboarding-checklist` + `POST .../{itemId}/complete`.

Unlike the other two (quotes, saved-replies), this one already had a live UI slot: the home screen's `SetupNudge` widget ("N of M setup steps") existed but read from `Modules/home`'s permanently-mock `setupChecklist` field, and tapping it just navigated to the generic `/more` screen.

## Scope

1. New `Modules/onboarding-checklist/` (`api.ts`, `hooks.ts`, `types.ts`, `mock.ts`): `getChecklist`, `completeItem`.
2. Move the home screen's setup-nudge widget off `Modules/home`'s mock onto this real module (`Modules/home` itself stays mock — untouched — this is one field's source swapping, same pattern as days 5/6 moving `premium.tsx`/`automation.tsx` off home's mock subscription flag).
3. New screen `app/(app)/more/onboarding-checklist.tsx` — full item list with descriptions, required badges, deep-link navigation, and a manual "mark done" checkbox — replacing the nudge's generic `/more` destination.

## What was actually built

- `Modules/onboarding-checklist` built exactly to the live spec's `ChecklistItem` shape (`id`, `labelEn`/`labelAr`, `descriptionEn`/`descriptionAr`, `deepLink`, `isRequired`, `completedAt`).
- Home screen (`app/(app)/index.tsx`): `SetupNudge` now takes plain `completed`/`total` numbers computed from the real checklist array instead of `Modules/home`'s `SetupChecklist` type; tap routes to the new dedicated screen instead of `/more`.
- New screen registered in `app/(app)/more/_layout.tsx`'s explicit `Stack.Screen` list (this app doesn't rely on implicit route registration for the `more/` group).
- **Completion is presented as both automatic and manual**: the spec doesn't say whether items complete themselves when the underlying action happens (e.g., profile finished) or need an explicit client call — the screen offers a tappable checkbox calling `completeItem` directly, and a deep-link row-tap to go do the underlying task, covering either backend behavior without guessing which one is real.
- `deepLink` values in the live example (`"/profile"`) don't obviously match this app's actual route paths (`/(app)/more/profile`). Mock data uses this app's real paths (`/more/profile`, `/more/team`); the real backend's actual `deepLink` strings are unconfirmed against this app's routing and may 404 if they don't match — flagged, not fixable from the client side (the vocabulary is admin-authored server content, not app code).

## Verification actually performed

- `npx tsc --noEmit` — clean.
- `npx eslint Modules/onboarding-checklist app/(app)/index.tsx app/(app)/more/index.tsx app/(app)/more/_layout.tsx app/(app)/more/onboarding-checklist.tsx` — 0 errors.
- `git status --short` — diff scoped to the new module, the new screen, and the home/more screens that reference it.
- **Not done**: no live device/simulator test, no confirmation that real `deepLink` values actually resolve to routes in this app. Same no-running-session gap as every other day.
