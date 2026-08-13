# Day 4 — Finance: Full Ledger

> Status: implemented 2026-08-13.

## Context

`Modules/finance` currently has a single mock `getOverview(range)` (zero backend coverage per `PLAN.md`). Confirmed live now: `GET /vendor/finance/summary`, full payments CRUD (`GET/POST/PATCH/DELETE /vendor/finance/payments`, `/vendor/finance/payments/{id}`), report generation (`GET /vendor/finance/reports/{type}`, `POST /vendor/finance/reports/{type}/export`, poll via `GET /vendor/finance/reports/exports/{id}`).

This is the biggest type-shape change of the whole vendor pass — `getOverview(range)` doesn't map cleanly onto `summary`, expect to mostly rewrite `Modules/finance/types.ts`.

## Scope

1. Replace `getOverview(range)` with `getSummary()`, wired into the existing `finance.tsx` screen (overview + add-payment) — confirm it still renders off the new shape.
2. Full payments CRUD exposed at the API layer.
3. Report generation/export/poll (`getReport(type)`, `exportReport(type)`, `getExportStatus(id)`) exposed at the API layer — **no UI this pass**, `finance.tsx` doesn't have a reports affordance yet.

## Verification

1. `npx tsc --noEmit` clean.
2. `finance.tsx` renders off `getSummary()`, add-payment still works.
3. Manually invoke ledger CRUD and report generation/export/poll methods to confirm they're callable even with no UI yet (same pattern as calendar CRUD in the prior pass — see `PLAN.md` step 4).

## What was actually built

Pulled exact request/response schemas from the live spec (`/vendor/finance/summary`, `/vendor/finance/payments*`, `/vendor/finance/reports/*`).

- **This really was the biggest shape change, as warned.** The old mock invented a per-bride running-total ledger — `BridePayment { total, received, status, dueDate }` — to fake an "N of M paid, progress bar" view. The real API has no such concept anywhere: `GET /vendor/finance/payments` is a flat, paginated list of individual payment *transactions* (a bride can have several rows — deposit, instalment, final — with no "total owed" field anywhere in finance's API; that would come from a package price or a quote, a different module entirely). `types.ts` rewritten around `LedgerPayment` (one transaction) instead of `BridePayment` (one bride's running balance). `finance.tsx`'s payment rows lost the progress bar and status pill (no data for either) and gained a kind badge (deposit/instalment/final) instead.
- **`getSummary()` replaces `getOverview(range)`, and the range concept doesn't survive intact.** The real summary is a fixed headline snapshot (`totalReceived`, `receivedThisMonth`, `outstanding`, `openQuotes`, `paymentsCount`) with no range parameter at all — there's no way to ask the server for "this quarter's summary." Kept the range selector, but repointed it at the one thing that *does* take a date window: `GET .../payments?from=&to=`, which now filters the transaction list, not the summary tiles (those always show the same fixed numbers). Added a kind filter chip row (all/deposit/instalment/final) since that maps directly to the real `?kind=` query param and is a more honest interaction than the old tap-a-tile-to-filter, which no longer has anywhere to point.
- **`addPayment` now takes a `conversationId`, not a `brideId`** — "the bride is derived from it, the request cannot name a bride directly" per the live spec. The old bride-picker in Add Payment sourced its list from existing payment rows (`data.payments`), which breaks once payments are per-transaction (a bride's first-ever payment has no prior row to derive from). Repointed the picker at `Modules/inbox`'s existing `useChats()` (already real since day-1) — conversations are the actual source of a bride + `conversationId` pairing. This is the one place this pass reached into another module's hooks rather than staying self-contained; it's the correct source, not a workaround.
- **Amounts are minor units server-side** (EGP × 100) — converted at the `api.ts` boundary in both directions, same pattern as days 2/3. `paidOn` is a required date-only field; Add Payment sends today's date since there's no date picker in the UI (none existed before either).
- **Full payments CRUD exposed at the API/hooks layer** (`getPayments`/`addPayment`/`updatePayment`/`deletePayment`) but, per the plan's own explicit calendar-CRUD analogy in its verification section, only GET+POST are wired into the screen — no edit/delete affordance added to payment rows this pass.
- **Report generation/export/poll** (`getReport`, `exportReport`, `getExportStatus`, plus `getRecentExports` since it was a one-line addition alongside poll) exposed at the API and hooks layer exactly as scoped — no UI, `finance.tsx`'s Reports section still shows static rows with no working Export action.

## Verification actually performed

- `npx tsc --noEmit` — clean.
- `npx eslint Modules/finance app/(app)/finance.tsx` — 0 errors.
- `git status --short` — diff scoped to `Modules/finance/*` and `app/(app)/finance.tsx`.
- **Not done**: no live device/simulator test, no real vendor account with actual conversations/payments exercised — same gap as days 1–3. Report/export/poll functions type-check and are callable but were not invoked against the live backend this pass (would need a running session to watch a real queue→done transition).
