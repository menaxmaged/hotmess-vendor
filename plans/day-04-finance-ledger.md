# Day 4 — Finance: Full Ledger

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
