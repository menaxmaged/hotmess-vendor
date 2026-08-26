# Day 11 — Quotes (New Module)

> Status: implemented 2026-08-13.

## Context

Third of three route groups found unwired by the vendor-wide route-coverage audit. `GET/POST /vendor/quotes` + `GET/PATCH /vendor/quotes/{id}` are their own top-level resource with a real line-items-and-computed-total model — richer than what already existed: `Modules/inbox`'s `GET .../{id}/bride` panel embeds a thin `quotes: {id, amount, sentAt, status}[]` read-only summary (built day-1), which has no write path and doesn't match this resource's real shape at all (no line items, no `totalAmount`, amount units never confirmed).

## Scope

1. New `Modules/quotes/` (`api.ts`, `hooks.ts`, `types.ts`, `mock.ts`): `getQuotes` (filterable by `conversationId`/`status`), `getQuote`, `createQuote`, `updateQuote`.
2. Quote-builder UI reachable from chat detail, since a quote is meaningless without the conversation it belongs to.

## What was actually built

- `Modules/quotes` built to the live spec exactly: `lineItems[]` (`description`/`quantity`/`unitAmount`), server-computed `totalAmount` (never sent, 422 if attempted), `status` (`open`/`accepted`/`expired`), `validUntil`. Amounts converted minor-to-major units at the `api.ts` boundary, same pattern as days 2/4/5.
- **Replaced, not supplemented, the old read-only bride-panel quotes display.** `app/(app)/inbox/[id].tsx`'s `BrideDetailPanel` had a `QUOTES` block rendering `bride.quotes` (the thin day-1 summary); swapped it for a new `QuotesSection` sourced from `useQuotes({conversationId})` — strictly more capable (real totals, create, status changes) and avoids showing two different-shaped "quotes" lists in the same panel. Left `Modules/inbox`'s `BrideDetail.quotes` field, `QuoteSummary` type, and the `fetchBridePanel` mapping that populates it completely untouched (deliberately — it's unrendered now, not deleted, since it's day-1's own verified code and removing it wasn't asked for).
- **New quote**: a bottom-sheet line-item builder (description/qty/unit-price rows, add/remove, running total) — `POST /vendor/quotes`.
- **Existing quotes**: tapping an `open` quote opens an action sheet to mark it `accepted` or `expired` (`PATCH /vendor/quotes/{id}`); already-`accepted`/`expired` quotes aren't tappable, since the spec doesn't document reopening one.
- No pagination UI — `getQuotes` supports `page`/`pageSize` but a single conversation realistically has few quotes; wired the query params through in the API layer for correctness, not exposed in this screen.

## Verification actually performed

- `npx tsc --noEmit` — clean.
- `npx eslint Modules/quotes app/(app)/inbox/[id].tsx` — 0 errors.
- `git status --short` — diff scoped to the new module and the chat detail screen.
- **Not done**: no live device/simulator test, no real conversation to create/accept a quote against. Same gap as every other day.
