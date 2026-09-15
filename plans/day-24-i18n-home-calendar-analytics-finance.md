# Day 24 — i18n: Home, Calendar, Analytics, Finance

> Status: implemented 2026-09-15

## Context

After Days 22–23, auth, the shell, More, Settings and the inbox are translated. The four data screens are still English:
- **Home:** `app/(app)/index.tsx`.
- **Calendar:** `calendar.tsx`, including the event editor and availability line.
- **Analytics:** `analytics.tsx` plus `Modules/analytics/components/FunnelBars.tsx`.
- **Finance:** `finance.tsx`, with reports, export, and the payment sheets.

They also hard-code `'en-US'`/`'en-GB'` date formatting, single-letter `S M T W T F S` weekday headers, and `toLocaleString()` with no locale.

## Scope

1. New namespaces `insights` (Home, Analytics, funnel, KPIs, conversion, sources), `calendar` and `finance`, each in `en` and `ar`.
2. Label lookup tables (`TYPE_LABEL`, `REASON_LABEL`, `SOURCE_LABELS`, funnel `LABELS`, `SUMMARY_META`, `KIND_META`, `REPORTS`, `EXPORT_STATUS_LABEL`, `PAYMENT_TYPES`, range and view chips) become key lists. Labels are resolved with `t()` at render, and colour tables keep only colours.
3. Dates and numbers use `localeTag()`. Weekday initials are generated with `Intl` (`weekday: 'narrow'`), so Arabic gets ح ن ث ر خ ج س.
4. Plurals where a count is shown: "N payments recorded", "N bookings came from an ad" (Arabic has 6 forms).
5. Brand display headings made of nested accent spans ("your **studio**.", "you're on **free**.") are split into before/accent/after keys, so Arabic word order can differ.
6. While in these files: the calendar event editor and signup boolean `Switch` had the same teal web thumb as Day 20's notification preferences. Same fix.

Out of scope: ad-campaign status pills on Home (the ads status vocabulary is Day 25), and server-provided report titles, subtitles and column labels (they come from the API as-is).

## Verification

- `npx tsc --noEmit`, `i18n-parity.js`, eslint on changed files.
- Arabic and English web screenshots of Home, Calendar, Analytics and Finance, if memory allows a Metro instance (Day 23's server was killed by the OS for low memory).
- No native run.

## What was actually built

- **New namespaces**: `insights` (87 English keys), `calendar` (37), `finance` (59), plus `common:actions.loading`.
- **`Modules/analytics/components/FunnelBars.tsx`**: stage labels and empty state translated; counts use the locale.
- **`app/(app)/analytics.tsx`**:
  - Range chips, KPIs (average response uses the shared short-minutes key), funnel and conversion labels.
  - The locked, not-enough-data and sources cards; source counts, with plurals for "N bookings came from an ad".
  - The finance and ads hero cards.
- **`app/(app)/index.tsx`** (Home):
  - Greeting date via `localeTag()`.
  - "your **studio**." and "you're on **free**." split into before/accent/after keys.
  - Pill tabs, revenue hero, KPI grid, setup nudge, ads tab, subscription tab.
  - `subscriptionStatusLine` uses `i18n.t`.
- **`app/(app)/calendar.tsx`**:
  - View chips, legend, event types, availability reasons (with an `isReason` guard and a localized list separator), counts, empty states, and derived-event and delete alerts.
  - The whole event editor.
  - `'en-US'` dates became `localeTag()` (4 places). Weekday headers come from `Intl` with `weekday: 'narrow'`.
- **`app/(app)/finance.tsx`**:
  - Ranges; the "payments recorded" plural; summary tiles; reports list; kind filters and pills; the add and edit payment sheets; delete confirm.
  - The report sheet: export button, inline export status, recent exports, "Nothing in this window", and the totals label.
  - Six label tables became key lists or colour-only maps.
- **Web `Switch` teal thumb** fixed in the calendar editor and in signup's boolean fields, the same fix as Day 20.

Found / changed from plan:
- **A typing rule for namespaced keys.** A `common:`-prefixed key only type-checks when `common` is in that component's `useTranslation([...])` list. `tsc` caught 2 such places on Home (`ErrorState`, `SubscriptionTab`); fixed.
- **English date format changed.** The English Calendar day header now reads `Tuesday 15 Sept` (en-GB) instead of `Tuesday, Sep 15` (en-US). The app's other dates already used en-GB, so this makes them consistent.
- **Money stays compact.** `EGP 88k` in both languages; the currency code and "k" aren't localized.
- **Low memory.** Instead of starting a second Metro, the screenshots used the Expo dev server that was already running on :8081 (not started by this session). It picks up edits live. `shots.js` and `flows.js` gained a `SHOT_BASE` env override.

## Verification actually performed

- `npx tsc --noEmit`: first run 2 errors (the namespace typing above), then exit 0.
- `i18n-parity.js`: `PARITY OK`. 7 namespaces, 427 `t()` calls. Arabic extras are plural forms only.
- `npx eslint` on the 5 screens, `Modules/analytics/components` and `locales`: clean.
- Web screenshots via `SHOT_BASE=http://localhost:8081`:
  - **Arabic** (Home, Inbox, chat detail, Calendar, Analytics, Finance, welcome): all translated and mirrored. Calendar shows Arabic weekday initials, a mirrored grid, and an Arabic month name; Finance shows the plural "5 دفعات مسجلة إجمالاً" and Arabic kind pills; the welcome tagline letter-spacing fix is confirmed.
  - **English** (Home, Calendar, Finance, chat detail): unchanged except the Calendar date format above.
- **Found for Day 26 (RTL):** direction-bearing icons don't flip. The Calendar ‹ › month arrows and the Finance back chevron point the LTR way in Arabic.
- **Not done:** no native run. Sheets and dialogs weren't opened in Arabic.
