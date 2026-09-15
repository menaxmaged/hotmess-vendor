# Day 14 — Analytics & Home on Real Data

> Status: implemented 2026-09-15

## Context

2026-09-15 re-audit: two modules call routes that don't exist.
- `Modules/analytics` → `GET /vendor/analytics?range` (one "overview" blob with per-KPI `deltaPct`, finance and ads sub-objects).
- `Modules/home` → `GET /vendor/home/overview`, `/vendor/home/ads-summary`, `/vendor/home/subscription-summary` (revenue sparkline, 6-month bars, team-today online status, "smart insight").

Both only render because `USE_MOCK_DATA` swaps in mocks. With mocks off, the Home tab and Analytics tab both fail.

The real surface (tag "Vendor Analytics", reads `AnalyticsRollup` only), all `?range=7d|30d|90d|1y`:
- `GET /vendor/analytics/kpis` — `profileViews, saves, messagesReceived, meetingsScheduled, averageResponseMinutes (nullable), bookingsClosed`. Free and Premium.
- `GET /vendor/analytics/funnel` — `stages: {key: views|saves|messages|meetings|bookings, count}[]`.
- `GET /vendor/analytics/conversion` — Premium (`canSeeConversionRates`, else 403 paywall); `{available: false, reason: 'insufficient_data'}` under 10 views. `viewToSave, saveToMessage, messageToMeeting, meetingToBooking, overall` — type `number`, **unit not documented**.
- `GET /vendor/analytics/sources` — Premium. `adAttributedBookings`, `bySource: {source, conversations, bookings, revenueMinor}[]`.

Nothing in the spec provides: period-over-period deltas, a revenue time series, team online/activity, or a generated insight. Home's other data already has real modules: `Modules/finance` (`/vendor/finance/summary`), `Modules/ads` (day 13), `Modules/subscription`, `Modules/onboarding-checklist`.

## Scope

1. Rewrite `Modules/analytics` (types/api/hooks/mock) to the four real routes. 403 on conversion/sources maps to a `locked` state (never an error). Rates normalized to percent (fractions if every value ≤ 1).
2. `app/(app)/analytics.tsx` — KPI grid (no fake deltas), funnel, conversion (locked / insufficient data / rates), sources breakdown, finance hero from `useFinanceSummary`, ads hero from `useCampaigns`.
3. `app/(app)/index.tsx` (Home) — Overview from finance summary + 30d KPIs + 30d funnel + setup nudge; Ads tab from `useCampaigns`; Subscription tab from `useSubscription`. Remove the revenue sparkline/monthly bars, Team-today and Smart-insight cards (no data source exists). Hardcoded "Ads 1" badge becomes the awaiting-payment count.
4. Delete `Modules/home` (every route it calls is fictional and nothing else imports it).

## Verification

- `npx tsc --noEmit`, `npx eslint Modules/analytics "app/(app)/analytics.tsx" "app/(app)/index.tsx"`.
- Cross-reference re-run: no `/vendor/home/*` or `/vendor/analytics` calls left; 4 analytics ops called.
- `git status --short`.
- No live run.

## What was actually built

- **`Modules/analytics` rewritten** — `getKpis`, `getFunnel`, `getConversion`, `getSources` + one hook each. Conversion and sources return `Gated<T>`: a 403 becomes `{ locked: true }` (paywall, never an error or logout). `mapConversion` normalizes rates to percent. `revenueMinor` → major units. Mock rewritten to the same shape.
- **`Modules/analytics/components/FunnelBars.tsx`** — shared funnel bars (Home + Analytics).
- **`app/(app)/analytics.tsx`** — range switcher drives all four queries; KPI grid (views, saves, messages, meetings, avg response or "—", bookings); funnel; conversion card with three states (Premium upsell → `/more/premium`, "not enough data" under 10 views, rates + overall); "Where bookings come from" per source (chats, bookings, revenue) + ad-attributed bookings — hidden when locked; finance hero from the real `useFinanceSummary` (this month / outstanding / open quotes count); ads hero from real `useCampaigns`.
- **`app/(app)/index.tsx` (Home)** — Overview: finance hero (received this month, all-time, outstanding), 30-day KPI tiles, 30-day funnel, setup nudge. Ads tab: real campaigns (live count, views, clicks, top 5 with status). Subscription tab: real `useSubscription` (plan, seats used/max, suspended seats, status line for cancels/grace/trial/renews). Ads pill badge = number of campaigns awaiting payment (was hardcoded `1`).
- **Deleted `Modules/home`** (api/hooks/mock/types) — all three routes were fictional and Home was its only importer.

**Changed from plan / found:**
- **Removed, not faked:** per-KPI "↑ x% vs prev" deltas (no API provides a previous period), revenue sparkline + 7D/30D/YTD pills (the pills were never interactive), 6-month revenue bars, "Team today" online/open/replied card, "Smart insight" card. None has any backing data in the spec. If the product wants them back, they need backend endpoints.
- **Conversion-rate unit is undocumented** (`number`). Heuristic: if every present rate is ≤ 1 they are fractions (×100); otherwise already percent. Confirm against a live payload.
- The home bell still opens More; day 15 points it at notifications.
- Analytics module had the same unused `eslint-disable` header as ads — removed.

## Verification actually performed

- `npx tsc --noEmit` — exit 0 (also proves nothing still imports the deleted `Modules/home`).
- `npx eslint Modules/ads Modules/analytics "app/(app)/more/ads.tsx" "app/(app)/analytics.tsx" "app/(app)/index.tsx"` — 0 errors, 1 warning (unused directive in analytics api) → fixed → `npx eslint Modules/analytics` exit 0.
- Cross-reference re-run: **"calls NOT in spec" is now empty for the whole vendor app** (106 call sites).
- `git status --short` — analytics module 4 files modified + `components/` new; `Modules/home/*` 4 deleted; `app/(app)/analytics.tsx`, `app/(app)/index.tsx` modified.
- **Not done:** no live call, no device run.
