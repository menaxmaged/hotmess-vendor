# Day 25 — i18n: Ads, Premium, Automation

> Status: implemented 2026-09-15

## Context

After Day 24, the remaining English UI is about 306 strings in the More sub-screens. The three largest screens take this day:
- `app/(app)/more/ads.tsx` (~54): campaigns, placements, and the 4-step builder.
- `premium.tsx` (~43): plan card, comparison table, invoices.
- `automation.tsx` (~43): welcome modes, intake questions, auto-assign rules.

`Modules/ads/status.ts` feeds campaign pills on both Ads and Home. The rest (team and roles, profile tabs, notifications and preferences, saved replies, checklist, invite) is Day 26, together with the RTL sweep.

Two problems in this area aren't translation:
- **Backend-bilingual names show English only.** Placements, cities, vendor categories and occasion types all have `nameAr` in the spec; the screens always render `nameEn`.
- **Some vendor-facing copy is developer jargon.** Invoice download on native says "needs expo-file-system + expo-sharing, not installed". The finance PDF export says "the API has no file download route". Payment method says "a payment-provider checkout flow that isn't wired into the app".

## Scope

1. `locales/{en,ar}/growth.ts` (ads, campaign status, premium) and `automation.ts`.
2. `lib/localized.ts` → add `pickBilingual(row, 'name')` for `nameEn`/`nameAr` rows. Use it for placements, cities, categories, occasions and the plan name (Premium and Home). Signup's local `schemaText` becomes the same helper.
3. `Modules/ads/status.ts`: labels from `growth:campaignStatus.*`.
4. Ads, Premium and Automation screens: every visible string. The default CTA ("Book now") is taken from the UI language, since brides see it.
5. Rewrite the three jargon messages in plain vendor language (both languages).

## Verification

- `npx tsc --noEmit`, `i18n-parity.js`, eslint on changed files.
- Arabic and English screenshots of Ads, Premium and Automation via the :8081 dev server.
- No native run.

## What was actually built

- **New namespaces**:
  - `growth` (128 keys): campaign status, ads, premium, including the 8-row comparison table.
  - `automation` (49 keys).
- **`lib/localized.ts`**: added `pickBilingual(row, base)` for `nameEn`/`nameAr`-style rows.
  - Used for ad placements (cards, builder step 1, review), cities and categories (builder chips and review), auto-assign criteria and form chips (cities, occasions), and the plan name (Premium and Home's Subscription tab).
  - Signup's local `schemaText` is now `pickBilingual`.
- **`Modules/ads/status.ts`**: rewritten around a known-status guard. Labels come from `growth:campaignStatus.*`, so Home's Ads-tab pills are translated too; unknown statuses still fall back to the raw value.
- **`app/(app)/more/ads.tsx`**:
  - All visible strings: hero, placements, campaign rows and stats, the action sheet and confirms, the pay-flow alerts, the 4-step builder (titles, fields, duration chips, slots line, review, footer), and the edit-creative sheet.
  - Numbers use `localeTag()`.
  - The default CTA text is taken from the UI language at builder mount, since brides see it.
- **`app/(app)/more/premium.tsx`**: plan card, cancel/renew line, comparison table (now a key list), buttons, invoices header, and all alerts.
- **`app/(app)/more/automation.tsx`**: mode cards, welcome message, intake questions, save alerts, lead-source chips, rule criteria description (module-level via `i18n.t`), and the rule list and new-rule form.
- **Jargon rewritten (both languages)**:
  - Invoice save on native was "needs expo-file-system + expo-sharing, not installed". Now: "Saving invoices on this device isn't supported yet. Open Hot Mess on the web to download it."
  - Payment method was "…payment-provider checkout flow that isn't wired into the app yet". Now: "Changing your saved card isn't available in the app yet."
  - Finance export was "…(the API has no file download route)". Now: "Downloading it in the app isn't available yet."

Found / changed from plan:
- **Server-side English still shows in Arabic**: placement `demandLabel` ("High demand"), campaign `placementName`/`cityName` on campaign rows, and mock cities/categories without `nameAr`. None has an Arabic twin in the payload the app receives, so this needs the backend.
- **Parity script false positive.** The script guessed one namespace per file, but Home's `ErrorState` uses the default `common` namespace. The script now also tries `common` for bare keys; tsc already validates these precisely.

## Verification actually performed

- `npx tsc --noEmit`: exit 0, first run.
- `i18n-parity.js`: 9 namespaces, 567 `t()` calls. First run reported 1 false positive (above), fixed, then `PARITY OK`.
- `npx eslint` on the 3 screens, Home, signup, `Modules/ads/status.ts`, `lib/localized.ts`, `locales`: clean.
- Screenshots via :8081:
  - **Arabic:** Ads (hero, Arabic placement names from `nameAr`, Arabic status pills), Premium (plan name, comparison table), Automation (mode cards, Premium badges), and the builder at step 2 (Arabic duration chips, slots line, step title).
  - **English:** Ads and Premium unchanged.
- **Not done:** no native run. The review step, edit-creative sheet and auto-assign form weren't opened in Arabic. The Arabic Home Ads-tab flow didn't run because its selector clicks the English "Ads" label.
