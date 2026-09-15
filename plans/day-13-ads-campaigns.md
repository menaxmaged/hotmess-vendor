# Day 13 — Sponsored Ads on the Real API

> Status: implemented 2026-09-15

## Context

2026-09-15 re-audit: `Modules/ads` calls two paths that **do not exist** — `GET /vendor/ads` and `POST /vendor/ads/campaigns`. It only works because `USE_MOCK_DATA` swaps in mock data; with mocks off the whole Ads screen 404s. `app/(app)/more/ads.tsx` also shows invented numbers (ROI, spent, quoted, "4 slots/month", `priceFrom`) and a builder that fakes pricing with a hardcoded duration multiplier.

Real routes (tag "Ads"): availability is only enforced at payment settlement; "payment grants nothing on its own — only a verified webhook moves the campaign live".
- `GET /v1/ads/placements` — `{id, key, nameEn, nameAr, demandLabel, previewImageKey}[]`.
- `GET /v1/ads/placements/{id}` — "tiered pricing for the caller's market" (schema unpublished; admin side is live-verified as `prices: {marketId, durationTier, amount}[]` + `inventory[]`).
- `GET /v1/ads/placements/{id}/availability?cityId&vendorCategoryId&month` — `{month, slotsPerMonth, booked, remaining}`.
- `POST /v1/vendor/ad-campaigns` — `{placementId, name, durationTier: one_week|two_weeks|one_month, startsOn, cityId?, vendorCategoryId?, headline?, ctaText?, creativeFileId?}` → created `pending_payment`.
- `GET /v1/vendor/ad-campaigns` ("with impressions, clicks, CTR and ROI"), `GET /{id}` — item schema unpublished.
- `PATCH /{id}` (creative only, live campaigns only), `DELETE /{id}` (cancel; refund per platform policy, default none), `POST /{id}/pay` (checkout `{transactionId, redirectUrl}`; **503 `payment_provider_unavailable` in the shipped state**), `POST /{id}/pause`, `POST /{id}/resume`.

## Scope

1. Rewrite `Modules/ads` (api/types/hooks/mock) to the real routes. Defensive mappers for the unpublished campaign/placement-detail shapes; amounts minor→major at the boundary like days 2/4/5/11.
2. Rewrite `app/(app)/more/ads.tsx`:
   - Hero from real campaign aggregates (impressions, clicks, live count) — no invented ROI/spend unless the payload carries them.
   - Placement cards from the catalogue (`demandLabel`, real price from detail when available).
   - Campaign rows with real status and actions: Pay (pending payment), Pause / Resume, Edit creative (live), Cancel.
   - Builder: placement → details (name, city, category, duration, start date) with real availability + tier price → creative (headline, CTA, optional image upload via `POST /files`) → review → create draft, then pay. A 503 from pay is shown as "payments aren't switched on yet — your campaign is saved as a draft".
3. Home screen's Ads tab keeps working (moved to this module in day 14).

## Verification

- `npx tsc --noEmit`, `npx eslint Modules/ads "app/(app)/more/ads.tsx"`.
- Cross-reference re-run: no `/vendor/ads*` calls left; all 11 Ads ops called.
- `git status --short`.
- No live verification possible (no vendor account; payments provider not configured server-side).

## What was actually built

- **`Modules/ads` rewritten** — `getPlacements`, `getPlacement`, `getAvailability`, `getCampaigns`, `getCampaign`, `createCampaign`, `updateCreative`, `payCampaign`, `pauseCampaign`, `resumeCampaign`, `cancelCampaign`, all on the real routes; `isPaymentProviderUnavailable(err)` detects the documented 503. Mock rewritten to the same method set (its `payCampaign` rejects with the same 503 shape, so mock mode exercises the "payments not switched on" path). New hooks for each; `useCampaign` feeds the edit-creative modal.
- **`Modules/ads/status.ts`** — shared status labels/`isLive`, used by the Ads screen, Home and Analytics.
- **`app/(app)/more/ads.tsx` rewritten** — hero from real campaign totals (live count, views, clicks, CTR computed from clicks/views when the server doesn't send `ctr`); placement cards from the catalogue (`demandLabel`); campaign rows with status, targeting, dates, views/clicks/CTR/ROI/price when present; tap opens status-appropriate actions (Pay now / Edit creative / Pause / Resume / Cancel with confirm). Builder: placement → name, city chips, category chips (from `/cms/cities` + `/cms/vendor-categories` via `useCategoryOptions`), duration tier with real tier price from the placement detail, start date, live availability ("N of M slots left" or sold-out warning) → creative (optional square image, headline ≤60, CTA) → review → create draft then immediately pay.

**Changed from plan / found:**
- The spec publishes **no item schema** for campaigns or placement detail (`{type: object}`). `mapCampaign`/`mapPlacementDetail` accept several plausible field names (nested `placement`/`city` objects or flat names; `prices`/`pricing`/`tiers`). The first live payload should be checked against these mappers.
- **Creative uploads use `kind: vendor_portfolio`, not `chat_attachment`.** The files route says `chat_attachment` "is the only kind a sweep ever reclaims", and a creative isn't attached to a message, so it would likely be swept. `vendor_portfolio` is documented (profile files flow) and not swept. No creative-specific kind exists — flagged for the backend team.
- Removed the invented numbers entirely (ROI×, "EGP spent", "quoted from ads", slot counts, `priceFrom`, the hardcoded 1/1.8/3.2 duration multiplier). ROI/price are shown per campaign only when the payload has them.
- Builder is mounted only while open (fresh state per open) instead of the old reset-on-visible-change pattern.
- Linting flagged an unused `eslint-disable` header in `api.ts` (this project's config doesn't enable `no-explicit-any`) — removed.

**Caveats:** payment is a 503 in the shipped backend, so no campaign can actually go live yet; `DatePicker` renders nothing on web; `amount` fields assume 2-digit minor units (EGP), same assumption as days 2/4/5/11.

## Verification actually performed

- `npx tsc --noEmit` — `TypeScript: No errors found`, exit 0.
- `npx eslint Modules/ads "app/(app)/more/ads.tsx"` — 0 errors, 1 warning (unused directive) → fixed → clean.
- Cross-reference re-run: `GET /vendor/ads` and `POST /vendor/ads/campaigns` gone from "calls NOT in spec"; all 11 Ads ops called.
- `git status --short` — `Modules/ads/{api,hooks,mock,types}.ts` modified, `Modules/ads/status.ts` new, `app/(app)/more/ads.tsx` modified.
- **Not done:** no live call, no device run.
