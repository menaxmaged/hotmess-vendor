# Day 17 — Screens for Built-but-Unreachable Endpoints

> Status: implemented 2026-09-15

## Context

2026-09-15 reachability audit (every exported api method / hook vs. every screen): after days 12–16 every vendor-relevant spec op has a caller, but several were only reachable from a hook that **no screen uses**:

- **Calendar** — `createEvent`, `updateEvent`, `deleteEvent`, `getAvailability` (`POST/PATCH/DELETE /vendor/calendar/events`, `GET /vendor/calendar/availability`). `calendar.tsx` is read-only and hardwired to the current month.
- **Finance** — `useUpdatePayment`, `useDeletePayment` (`PATCH/DELETE /vendor/finance/payments/{id}`), `useReport`, `useExportReport`, `useExportStatus`, `useRecentExports` (`GET /vendor/finance/reports/{type}`, `POST .../export` → 202, poll `GET .../exports/{id}`, `GET .../exports`). The Reports card rows say "Export →" but do nothing.
- **Inbox** — `useSetFollowUp` (`PATCH /vendor/conversations/{id}/follow-up`): follow-up dates show but can't be set.
- **Quotes** — `useQuote` (`GET /vendor/quotes/{id}`): no quote detail, line items never visible after sending.
- **Profile** — `useProfilePreview` (`GET /vendor/profile/preview`, "exactly what brides see", incl. `isVisibleToBrides`) — `enabled: false`, no screen.
- **Subscription** — `useSetPaymentMethod` (`PUT /vendor/subscription/payment-method`) needs the gateway's token for a saved card; there is no payment SDK in the app. **Stays blocked.**

## Scope

1. Calendar: month navigation (fetch range follows the visible grid), add event (type, title, start, optional end, notes), tap own event → Edit/Delete, tap derived event (owned by a conversation) → open that chat, selected-day availability line.
2. Finance: tap payment → Edit (amount, type, paid-on date) / Delete; Reports rows open a report viewer (columns/rows/totals per the report's own column formats, money in minor units) with "Export PDF" that polls until `done`/`failed`, plus recent exports.
3. Chat detail: follow-up control in the bride panel (set / change / clear).
4. Quotes: tap a quote → detail sheet with line items and accept/expire actions (replaces the bare action sheet).
5. Profile: "Preview as brides see it" sheet.

## Verification

- `npx tsc --noEmit`, eslint on changed paths.
- Reachability audit re-run: only `useSetPaymentMethod` left unused.
- `git status --short`. No live run.

## What was actually built

- **Calendar** (`Modules/calendar` + `app/(app)/calendar.tsx`) — `CalendarEvent` now carries `startsAt`, `endsAt`, `notes`, `isDerived`, `conversationId`. Hooks: `useCalendarEvents(range)` (range in the key), `useDayAvailability(yyyy-mm-dd)`, `useCreateEvent`, `useUpdateEvent`, `useDeleteEvent`. Screen: ‹ month › navigation (fetch range = the whole visible grid incl. leading/trailing days), "＋ Add" → event editor (type chips, title ≤200, start datetime, optional end with end>start check, notes ≤2000); tapping a studio event → Edit / Delete (confirm); tapping a derived event → opens its conversation; selected day shows availability ("Open for bookings" or "Unavailable — reasons" + booked/on-hold counts). Week view follows the selected day instead of always today.
- **Finance** (`app/(app)/finance.tsx`, `Modules/finance/hooks.ts`) — tap a payment → Edit (amount, type, paid-on date; only changed fields sent) / Delete (confirm). Report rows open a report sheet: title, subtitle, meta lines, a column-weighted table rendered per each column's `format` (money = minor units ÷100 in the report's `currencyCode`, integer, date, text), totals row. "Export PDF" → `POST .../export` then `useExportStatus` polls every 2s until `done`/`failed` (poll interval added to the hook); recent exports listed. Export errors (e.g. 409 `export_queue_full`) alert.
- **Chat detail** — bride panel "Follow up: date / + Follow-up" → date sheet with Save and Clear (`PATCH .../follow-up`, `null` clears). Quotes: tapping any quote opens a detail sheet via `useQuote` (line items, qty × unit, total, sent/valid-until, Mark accepted / Mark expired while open) — replaces the bare action sheet.
- **Profile** — `useProfilePreview(enabled = true)`; ProfileTab "Preview as brides see it" sheet (visible-to-brides badge, name, tagline, completeness, Instagram state).

**Changed from plan / found:**
- `Modules/calendar/mock.ts` isn't imported anywhere (dead since day 0), but it's type-checked — patched to the new shape rather than deleted.
- **Exported PDFs can't be downloaded in-app:** a finished export only gives `storedFileId`, and the spec has no `GET /files/{id}` (or any id → bytes route). The sheet says so. Needs a backend route.
- The report sheet uses the finance screen's current range (All time → no dates → server default of last 12 months).
- `useSetPaymentMethod` stays unwired: `PUT /vendor/subscription/payment-method` takes the gateway's saved-card token, which only a payment SDK can produce.

**Reachability audit after this day:** vendor — `useSetPaymentMethod` (blocked), `inboxApi.markUnread` (no endpoint; stub), `authApi.getSignupSchema` (no signup screen — see day 18).

## Verification actually performed

- `npx tsc --noEmit` — first run: 8 errors, all in the unused `Modules/calendar/mock.ts` (old event shape) → patched → exit 0.
- `npx eslint Modules/calendar Modules/finance Modules/profile "app/(app)/calendar.tsx" "app/(app)/finance.tsx" "app/(app)/inbox/[id].tsx"` — first run: 0 errors, 2 warnings (unused `Quote` type import I left in the chat screen → removed; pre-existing unused directive at `Modules/calendar/api.ts:1` → left). Second run: only the pre-existing warning.
- Reachability script re-run — results above.
- **Not done:** no device run. DatePicker-based sheets (calendar, follow-up, payment date) don't render on web.
