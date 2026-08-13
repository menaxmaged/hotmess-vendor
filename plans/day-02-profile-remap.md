# Day 2 — Profile: Remap to the Real Payload Shape

> Status: implemented 2026-08-13.

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

## What was actually built

Pulled exact request/response schemas from the live spec (`GET /docs/swagger-ui-init.js`, refetched 2026-08-13 — 147 endpoints now).

- **`getOverview`** now composes three real calls (`GET /vendor/profile`, `GET .../packages`, `GET .../files`) into one `ProfileOverview`, mirroring day-01's "merge real sub-resources client-side" pattern. Money fields converted minor-units-to-EGP at the API boundary; component-facing types stay in EGP.
- **`booking-rules`/`categories`/`coverage`** — wired as full-replace `PUT`s exactly as scoped. Their responses only echo back partial slices (confirmed from the live examples), so — same as day-1's mutation pattern — the client doesn't trust the response body; hooks invalidate and refetch the real overview afterward for canonical state.
- **Coverage got its own type and its own tab section** (`ProfileCoverage`, wired into `CategoriesTab`, item 3) rather than overloading categories, per the plan. `marketIds` (required by the endpoint) has no UI slot of its own — derived automatically from each selected city's `marketId`, sourced from `GET /cms/cities`. Category/city/occasion option lists moved from the old (nonexistent) `/vendor/profile/category-options` endpoint to the real `/cms/vendor-categories` (hierarchical — main + `children` for sub), `/cms/cities`, `/cms/occasion-types`. `paymentMethods` is *not* one of these CMS lists — it's a fixed 5-value backend enum, so it moved to a static const in `BookingTab`, same treatment as `availabilityBehaviour` already got.
- **Packages/files CRUD** — near-direct remap as scoped. File upload is genuinely two-step per the live spec's own description text: `POST /files` (multipart, gets a `fileId`) then `POST /vendor/profile/files` (labels/attaches it). **Caveat found while wiring, not in the original plan**: that description text says to upload with `kind=vendor_portfolio`, but the `/files` endpoint's own schema still lists only `chat_attachment` in its `kind` enum — a live-spec inconsistency. Went with the flow description over the (apparently stale) enum, since it's the more specific and more recently-written source. Flagged in code (`Modules/profile/api.ts`).
- **`getPreview()`** added and callable, plus a disabled-by-default `useProfilePreview` query hook — no screen consumes it yet, as scoped.
- **Type shapes changed to match the real API, not the old mock's invented ones**: `ProfileBooking` dropped `startingPrice` (that field doesn't exist on `booking-rules` — it's core-profile-only) and renamed `depositPct`→`depositPercent`; `AvailabilityBehaviour` and payment-method values now use the real backend vocab, not the old placeholder strings; `SupplementaryFile` dropped `url`/`uploadedAt` (neither exists in the real response — replaced with `label`/`kind`/`mimeType`/`byteSize`) — `FilesTab` updated accordingly.

**Left on mock, out of this pass's scope (not in the item list above) — flagged, not silently patched:**
- `updateCore` / `uploadCoverImage` (`ProfileTab`'s save button). The real `PATCH /vendor/profile` *does* cover tagline/bio/startingPrice/mainCategoryId, but not `businessName` (immutable post-signup — no endpoint changes it at all), and there is no cover-image upload endpoint in the live spec, only a `coverImageKey` *string field* of unconfirmed provenance. Since `getOverview` is now real, this is a live desync: `ProfileTab` will read real data but its "Save" quietly writes to the mock store only, so edits appear to succeed then revert on next load/refetch. Not fixed here — guessing the missing pieces (what sets `coverImageKey`, whether to drop `businessName` from the form) felt like exactly the kind of shape-guessing the plan says to avoid. Worth its own day.
- `connectInstagram` / `disconnectInstagram`. Real endpoints exist (`GET/DELETE /vendor/instagram`, `POST /vendor/instagram/connect`) but at different paths than this module ever called, with a different response shape (no `username`, no `portfolioImages`) — that's day-07's job, not day-02's.

## Verification actually performed

- `npx tsc --noEmit` — clean.
- `npx eslint Modules/profile app/(app)/more/profile.tsx` — 0 errors, 0 warnings.
- `git status --short` — diff scoped to `Modules/profile/*` + `app/(app)/more/profile.tsx`.
- **Not done**: no live device/simulator test, no live-spec response actually exercised against a real vendor account (no running Expo session or test/session account this pass — same gap noted in day-01). Correctness rests on `tsc` + matching the live OpenAPI schemas/examples exactly.
