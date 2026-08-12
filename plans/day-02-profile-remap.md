# Day 2 — Profile: Remap to the Real Payload Shape

## Context

`Modules/profile` (`api.ts`, `hooks.ts`, `types.ts`, `mock.ts`, `components/`) is currently all-mock (zero backend coverage per `PLAN.md`). Confirmed live now: `GET /vendor/profile` (single combined payload, not separate overview/category-options calls), `PUT /vendor/profile/booking-rules`, `PUT /vendor/profile/categories`, `PUT /vendor/profile/coverage` (replace-semantics, not the old assumed `PATCH`), full `packages`/`files` CRUD (`/vendor/profile/packages`, `/vendor/profile/packages/{id}`, `/vendor/profile/files`, `/vendor/profile/files/{id}`), `GET /vendor/profile/preview`.

**`coverage` is a new concept** — cities/markets/occasion-types served — not currently modeled in `ProfileCategories` (`Modules/profile/types.ts`) at all. Extend the type rather than overload `categories`.

## Scope

1. Rewrite `getOverview`-equivalent around the single `GET /vendor/profile` payload.
2. `PUT booking-rules` / `PUT categories` / `PUT coverage` — replace-semantics (send the full field, not a partial patch).
3. Extend `ProfileCategories` (or add a sibling `ProfileCoverage` type) for the new coverage concept; wire it into whichever profile tab component under `Modules/profile/components/` currently handles categories, or leave unsurfaced if no obvious tab fits — flag if so, don't force a UI slot.
4. Package/file CRUD — near-direct remap onto the real endpoints.
5. Add `getPreview()` at the API layer (`GET /vendor/profile/preview`) — no UI change required this pass, exposed for a later screen.

## Verification

1. `npx tsc --noEmit` clean.
2. Profile screen still renders and each tab saves against the new payload shape (booking rules, categories, coverage separately).
3. Package/file add/edit/remove round-trip through the real API.
4. `getPreview()` is callable (manually invoke, confirm response shape) even with no UI consuming it yet.
