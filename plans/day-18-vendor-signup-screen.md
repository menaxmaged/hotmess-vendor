# Day 18 — Vendor Sign-Up Screen

> Status: implemented 2026-09-15

## Context

Day 8 wired `POST /v1/vendor/signup` and `GET /v1/vendor/signup-schema` at the API layer only ("No signup screen built"). The 2026-09-15 reachability audit confirms nothing reaches them: `authApi.getSignupSchema` has no caller and `useAuth().signUp` is unused. Welcome and login both send new vendors to `hotmessbride.com` instead. The dashboard already ships a Sign-Up Form CMS that publishes the schema, so the app is the missing half.

Spec facts:
- Step 1 is hardcoded, always present: `businessName` (2–120), `contactPersonName` (1–120), `email`, `whatsapp`, `password` (8–128). Schema steps start at step 2.
- Schema: `{version, publishedAt, steps[{key, titleEn, titleAr, fields[]}]}`. Field `type`: `text | textarea | email | phone | url | number | boolean | select | multiselect`; `labelEn/Ar`, `helpEn/Ar`, `required`, `min`/`max` ("characters, value or selections per type"), `options[{value, labelEn, labelAr}]` for select/multiselect, `visibleWhen` = one clause or an ANDed array, only referencing EARLIER fields (e.g. `{field: "category", equals: "venue"}`). A hidden field is never required.
- `answers` is keyed by field key; undeclared keys are dropped, not rejected.
- Response = login payload (`{user, token, subscription}`); the caller is signed in. `403 self_registration_disabled` when sign-up is closed; 409 on conflict; 422 field errors.
- Accounts go live on Free, or `pending` (invisible to brides) under `pre_approval`.

Also found: `useAuth().signIn`/`signUp` flip the provider's global `isLoading`, which makes `RootNavigator` render a spinner instead of the stack — the calling screen unmounts mid-request, so a failed sign-in never shows its error and clears the form. A multi-step sign-up would lose every answer.

## Scope

1. Types: full field model (types, options, help, `visibleWhen`).
2. `Modules/auth/signup-form.ts`: visibility (document order, hidden fields' answers don't count), per-type validation, answer cleaning (numbers as numbers, hidden/empty dropped).
3. Hooks: `useSignupSchema` (404 → no extra steps), `useVendorSignup`.
4. `app/(auth)/signup.tsx`: step 1 + one screen per schema step, progress, back/continue, per-field errors, submit → sign in. Friendly messages for 403/409.
5. Entry points: Welcome "Create your studio", login "Create your studio" link.
6. Stop `signIn`/`signUp` from toggling the global loading flag (screens already track their own submitting state).

## Verification

- `npx tsc --noEmit`, eslint on changed paths; reachability re-run (`getSignupSchema` reached).
- No live sign-up — it would create a real studio record.

## What was actually built

- **Types** (`Modules/auth/types.ts`) — `SignupFieldType` (the 9 spec types), `SignupFieldOption`, `SignupVisibleClause`, and `SignupSchemaField` extended with `helpEn/Ar`, `options`, `visibleWhen`.
- **`Modules/auth/signup-form.ts`** — `visibleFieldKeys` (one pass in document order; a clause sees an earlier field's answer only if that field is itself visible), `validateField` per type (email/url/phone formats, number min/max value, text min/max characters, multiselect min/max selections, select must match an option; hidden fields are never validated), `stepErrors`, `cleanAnswers` (visible + non-empty only, numbers as numbers, text trimmed, booleans always sent).
- **Hooks** — `useSignupSchema` (404 → `null`, sign-up is then step 1 only) and `useVendorSignup` (`authApi.register`).
- **`app/(auth)/signup.tsx`** — step 1 (business name, your name, email, WhatsApp, password + confirm, with the API's length rules) then one screen per published schema step: progress bar, "Step n of m", Back/Continue, errors shown after a Continue attempt, renderers for every field type (text inputs with the right keyboard, textarea, numeric, `Switch` for boolean, chips for select/multiselect), help text. Submit → `POST /vendor/signup` → `useAuth().login(result)` signs the owner straight in. 403 `self_registration_disabled` and 409 get plain-language messages; anything else shows the server's `message_en`.
- **Entry points** — Welcome's "Onboard on hotmessbride.com" link replaced by a "Create your studio" button; login's footer link now opens sign-up; `signup` registered in the auth stack.
- **Bug fixed:** `useAuth().signIn`/`signUp` no longer toggle the provider's `isLoading`. `RootNavigator` renders a spinner instead of the whole stack while that flag is true, so the login screen unmounted mid-request — a wrong password never showed its error and cleared the form. The login screen already tracks its own `isSubmitting`.

**Changed from plan / found:**
- The screen calls `authApi.register` through `useVendorSignup` + `login()` rather than `useAuth().signUp`, so the form state survives an error. `signUp` in the context is still unused (left in place; harmless).
- `visibleWhen` operators beyond `equals` aren't documented; `notEquals`/`in`/`notIn` are accepted defensively and an unrecognised operator keeps the field visible (never hide something the server might require).
- A required `boolean` is treated as always answered (defaults to off) — the spec doesn't say whether "required" means "must be on". Confirm with the backend if the CMS is used for consent-style checkboxes.
- English labels only (`labelEn`/`helpEn`), like the rest of the app.
- Under `vendor_approval_mode = pre_approval` the studio is created `pending`; the app signs the owner in either way, and nothing in the app yet explains "your studio is awaiting approval" (the profile preview's "Not visible to brides yet" badge is the only signal).

## Verification actually performed

- `npx tsc --noEmit` — exit 0.
- `npx eslint Modules/auth "app/(auth)"` — 0 errors; 2 pre-existing unused-directive warnings (`Modules/auth/api.ts:1`, `Modules/auth/context.tsx:149`).
- Reachability audit re-run — `getSignupSchema` now reached. Vendor app's only unused api/hooks: `inboxApi.markUnread` (no endpoint exists) and `useSetPaymentMethod` (needs a payment SDK token). Dashboard: none.
- **Not done:** no live sign-up (would create a real studio + owner account with no cleanup route), no device run.
