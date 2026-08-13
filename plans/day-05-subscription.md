# Day 5 — Subscription (New Module)

> Status: implemented 2026-08-13.

## Context

`app/(app)/more/premium.tsx` exists but both action buttons are dead — no-ops today, zero backend coverage before now. Confirmed live: `GET /vendor/subscription/plans`, `POST /vendor/subscription/upgrade`, `POST /vendor/subscription/cancel`, `GET /vendor/subscription/invoices`, `GET /vendor/subscription/invoices/{id}/pdf`, `PUT /vendor/subscription/payment-method`.

This is the one day in the whole vendor pass with a direct, visible bug-fix payoff — two currently-broken buttons start working.

## Scope

1. New `Modules/subscription/` (`api.ts`, `hooks.ts`, `types.ts` — mirror existing module pattern): `getPlans`, `upgrade` (confirm exact response shape when wiring — expect it returns a checkout URL/session to redirect to, not an immediate state flip), `cancel`, `getInvoices` (+ PDF download), `setPaymentMethod`.
2. Wire directly into `premium.tsx`'s Upgrade and Cancel buttons.

## Verification

1. `npx tsc --noEmit` clean.
2. Premium screen: Upgrade button opens a real checkout flow (or redirect), Cancel button actually cancels and the screen reflects it.
3. Invoices list renders; PDF download works.

## What was actually built

Pulled exact request/response schemas from the live spec (`/vendor/subscription*`).

- **`Modules/subscription/`** created with `getSubscription`, `getPlans`, `upgrade`, `cancel`, `getInvoices`, `getInvoicePdf`, `setPaymentMethod` — matches the plan's item 1 list plus `getSubscription`, which the plan's context line didn't name but which turned out to be load-bearing: `premium.tsx` was reading its current-plan display from `Modules/home`'s permanently-mock `useHomeSubscriptionSummary` (home has no backend and isn't scheduled in any of the 8 days). Left wired that way, cancel would call the real endpoint but the screen would never visibly reflect it — failing this day's own verification item 2. Switched the screen onto the new module's real `GET /vendor/subscription` instead; `Modules/home` untouched, still mock, still used by the actual home dashboard.
- **`upgrade` behaves exactly as the plan warned it might**: `POST .../upgrade` opens a checkout (202, `{transactionId, redirectUrl}`) and explicitly does *not* change the subscription — only a verified payment-provider webhook does that later. Wired to `expo-web-browser`'s `openBrowserAsync(redirectUrl)` (already a dependency, previously unused anywhere in the app) rather than an in-app state flip; the screen refetches on return in case the webhook already landed, but there's no guarantee it has.
- **`cancel` is end-of-period, not immediate** — the studio keeps Premium until `currentPeriodEnd`. Screen now reads `rawStatus`/`currentPeriodEnd` to show "Cancels {date} — you keep Premium until then" instead of pretending the plan changed on tap, and hides the cancel action once already cancelling (nothing left to confirm).
- **Invoices list added** — wasn't in the old screen at all, but the plan's own verification item 3 required it to render, so it's new UI, not a wiring pass over something existing.
- **PDF download is real on web, honestly flagged as a gap on native.** `getInvoicePdf` fetches the raw PDF via `apiClient` directly (bypassing the `api` JSON-envelope wrapper — this response isn't an `ApiResponse`) with `responseType: 'arraybuffer'`. On web this drives a genuine browser download (`Blob` + object URL + a throwaway `<a download>`). On native there is nowhere to put the bytes — `expo-file-system` and `expo-sharing` aren't installed in this app (checked: neither appears anywhere in the codebase or `package.json`) — so tapping Download on native fetches the PDF for real and then tells the vendor plainly that saving it isn't wired yet, rather than silently failing or adding new native dependencies without being asked.
- **"Change payment method" is the plan's un-scoped third button** (plan explicitly says "two currently-broken buttons," meaning Upgrade + Cancel). Investigated anyway since it was sitting there dead: `PUT .../payment-method` only *records a display reference* (`brand`/`last4`/gateway `ref` token) for a card that must already exist at the payment provider — "the instrument itself lives at the gateway." There's no payment-provider SDK integrated in this app to actually collect a card and produce a real `ref`, so wiring the button would mean either faking a token (corrupts real billing display) or building a provider integration (a project on its own, not a Day 5 line item). `setPaymentMethod` is exposed and correct at the API/hooks layer; the button now shows a clear "not available yet" message instead of being silently inert.
- Amounts (`priceMinor`, invoice `amount`) converted minor-units-to-major at the `api.ts` boundary, same pattern as days 2/4.

## Verification actually performed

- `npx tsc --noEmit` — clean.
- `npx eslint Modules/subscription app/(app)/more/premium.tsx` — 0 errors.
- `git status --short` — diff scoped to new `Modules/subscription/*` and `app/(app)/more/premium.tsx`.
- **Not done**: no live device/simulator test, no real payment provider configured to actually exercise checkout end-to-end, no native file-save test (the gap above is by inspection of installed packages, not a runtime failure). Same no-running-session gap as days 1–4.
