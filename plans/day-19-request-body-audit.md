# Day 19 — Request Body Audit Against the Spec

> Status: implemented 2026-09-15

## Context

The 2026-09-15 dashboard audit found 16 admin actions sending bodies the API rejects (dashboard `plans/day-16-api-contract-fixes.md`), even though path coverage had been confirmed. The vendor app's earlier audits (days 9–18) checked **paths** only, never **bodies**.

This day runs the equivalent body check on the vendor app with a stronger tool. `scratchpad/vendor-body-audit.js` builds a TypeScript program from this repo's `tsconfig.json` and, for every `api.post/put/patch/delete` and `apiFormData.*` call, resolves the **type of the argument actually passed** with the type checker. It then compares that type with the spec's `requestBody`:
- route exists
- body sent / not allowed
- every `required` key present and non-optional
- no keys outside the spec
- primitive type match (integer/string/boolean/array)
- enum literals within the spec enum
- nested objects and array items, recursively

The checker was validated with an in-memory probe file of deliberately wrong calls (misspelled key, wrong type, wrong enum, missing body). Every one was flagged.

## Findings

**Static contract: clean.** 70 call sites. 0 unknown routes, 0 missing bodies, 0 missing / optional-but-required / extra keys, 0 type or enum mismatches. The `POST /conversations/{id}/messages` oneOf body was checked by hand; both variants match.

Things a static type check can't see were checked by reading the spec's formats and constraints and the screens that produce the values:

1. **Bug — finance report range is off by one day in Egypt.** `rangeToDates()` in `app/(app)/finance.tsx` builds `from` as local midnight, then takes `toISOString().slice(0, 10)`. That is the **UTC** date, which in UTC+2/+3 is the previous day. "This month" requests from the last day of the previous month, and quarter and YTD shift the same way. `to` is today's UTC date, which is yesterday between local midnight and 02:00–03:00. This affects both the report view and the PDF export (`format: date`).
2. **Bug — "record payment" stamps yesterday after midnight.** `AddPaymentSheet` sends `paidOn: new Date().toISOString().slice(0, 10)`, the UTC date. The edit sheet already uses the local `ymd()` helper correctly.
3. **Type looseness (no runtime bug):** calendar `TYPE_TO_KIND` is `Record<EventType, string>`, so the enum can't be checked. The values are correct today.
4. **Spec self-contradiction (no app change):** `POST /files` says `kind` accepts only `chat_attachment`. But `POST /vendor/profile/files` says to upload with `kind=vendor_portfolio` first. The app follows the latter (cover image, portfolio files, ad creatives). If the backend really enforces the first enum, those uploads 422. This needs a backend answer.
5. **Noted, not changed:** money is converted with `×100` everywhere (payments, quotes, packages, starting price). That's correct for EGP, the only currency the app labels; other currencies would need the market's `minorUnitDigits`.

Also verified correct: `date-time` fields (`startsAt`, `endsAt`, `startsOn`, `proposedAt`, `followUpAt`) all send `toISOString()`. `date` fields (`paidOn` on edit) use local `ymd`. Calendar notes and account phone blank values become `null` or are omitted (spec `minLength: 1`). Quote quantity is digits-only, so always an integer.

## Scope

1. `finance.tsx`: `rangeToDates` and `AddPaymentSheet.paidOn` use the local `ymd()` date.
2. `Modules/calendar/api.ts`: type `TYPE_TO_KIND` with the spec's kind union.
3. Record the spec conflict (4) and the currency assumption (5) in `PLAN.md` open items.

## Verification

Re-run `vendor-body-audit.js`, `npx tsc --noEmit`, `npx eslint` on changed files. No device run (no vendor account in this environment).

## What was actually built

- `app/(app)/finance.tsx`:
  - `rangeToDates()` builds `from` and `to` with the local `ymd()` helper instead of `toISOString().slice(0, 10)`. This fixes the report view and PDF export ranges, which were starting a day early in UTC+ timezones.
  - `AddPaymentSheet` stamps `paidOn` with `ymd(new Date())`; it recorded the previous day between local midnight and 02:00–03:00.
- `Modules/calendar/api.ts`: `TYPE_TO_KIND` is typed `Record<EventType, StoredEventKind>` (the spec's four storable kinds), so the enum is now statically checked. The audit's `LOOSE` row is gone.
- No request-body contract changes were needed: unlike the dashboard, every vendor call already matched the spec.
- Left as findings, not code: the `POST /files` `kind` enum contradicts `POST /vendor/profile/files` (needs a backend answer). Money `×100` assumes 2 minor digits (EGP only).

## Verification actually performed

- `node scratchpad/vendor-body-audit.js` (TS type-checker based):
  - Before fixes: 70 calls, 0 NO_ROUTE / NO_BODY / BODY_NOT_ALLOWED / MISSING / OPTIONAL / EXTRA / TYPE / ENUM, 1 LOOSE (calendar kind), 1 MULTIPART (files upload, checked by hand).
  - After fixes: 70 OK, 1 MULTIPART.
- Checker validated with an in-memory probe (never written to the repo). It flagged a missing required key, an extra key, a wrong primitive type and a missing body.
- `grep "toISOString().slice(0, 10)"` in `app/` and `Modules/` (non-mock): 0 left.
- `npx tsc --noEmit`: exit 0.
- `npx eslint "app/(app)/finance.tsx" Modules/calendar/api.ts`: exit 0. There is 1 warning, a pre-existing unused `eslint-disable` at `calendar/api.ts:1`, not from this change.
- **Not done:** no device or simulator run and no live API calls (no vendor account). Formats and constraints (`date` vs `date-time`, `minLength`, integer quantities) were checked by reading the screens, not by sending requests.
