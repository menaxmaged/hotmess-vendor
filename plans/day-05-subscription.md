# Day 5 — Subscription (New Module)

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
