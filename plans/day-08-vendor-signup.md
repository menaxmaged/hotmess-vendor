# Day 8 — Vendor Signup

> Status: implemented 2026-08-13.

## Context

`Modules/auth#register` has been stuck on mock since the prior pass — `PLAN.md` flagged that the backend's `/v1/auth/register` only creates **bride** accounts, no vendor self-serve signup existed at all. That's changed: confirmed live now, `POST /vendor/signup` (creates a studio + signs in, single call) and `GET /vendor/signup-schema` (form-field schema for the signup screen — wasn't in the original plan, worth using instead of hand-guessing the form shape).

## Scope

1. Wire `Modules/auth#register` to `POST /vendor/signup` for real.
2. Fetch `GET /vendor/signup-schema` to drive the signup form's fields — check it against whatever form fields the app currently assumes, adjust rather than hand-roll if they diverge.
3. **No UI screen calls `register` today** — building the actual signup screen is a separate decision. Wire the API layer only, flag the missing screen, don't build it this pass unless asked.

## Verification

1. `npx tsc --noEmit` clean.
2. Manually invoke `register()`/the new signup API method to confirm `POST /vendor/signup` round-trips and creates a real vendor studio + session (test account, not production data).
3. `GET /vendor/signup-schema` response inspected and compared against the assumed form shape — note any mismatch for whoever builds the screen.

## What was actually built

Schemas pulled directly from the live spec, not guessed:

- `Modules/auth/types.ts` — added `VendorSignupRequest` (`businessName, contactPersonName, email, whatsapp, password, answers?`) and `SignupSchema`/`SignupSchemaStep`/`SignupSchemaField` for the new `GET /vendor/signup-schema` endpoint.
- `Modules/auth/api.ts` — `register()` now calls `POST /vendor/signup` for real and returns `LoginResponse` (the real response is `{user, token, subscription}` — identical shape to login's `AuthResult`, so no new response type was needed). Sets the token immediately, same as login. Added `getSignupSchema()`.
- **Found while wiring, changed beyond the plan's literal scope**: `Modules/auth/context.tsx`'s `signUp` was previously a stub — its old signature `signUp(name, email, password)` built a hard-coded, nonsense **bride**-shaped payload (`countryCode: "US"`, `dateOfBirth: "1990-01-01"`, `gender: "male"`) to call the old fictional register, then made a *second* network round-trip to `signIn`. Since no screen calls `signUp` today (confirmed by grep — only `context.tsx` itself referenced it), its signature was changed to `signUp(input: VendorSignupRequest)` matching the real form fields, and the redundant second `signIn` call was dropped — the real signup endpoint already returns a full session in one call.
- `Modules/auth/mock.ts` / `types.ts` — removed the now-fully-dead `mockAuthApi.register` and the old bride-shaped `RegisterRequest`/`RegisterResponse` types (confirmed unused elsewhere via grep).
- **No signup screen built** — per the plan's explicit scope, API layer only. Whoever builds the screen should drive its fields off `getSignupSchema()`'s `steps[].fields[]` rather than hand-rolling the form.

## Verification actually performed

- `npx tsc --noEmit` — clean.
- `npx eslint Modules/auth` — 0 errors (2 pre-existing-pattern warnings, not new).
- `git status --short` — diff scoped to the intended files.
- **Not done**: `register()`/`getSignupSchema()` not actually invoked against the live backend (no test run — would create a real studio record with no obvious way to clean it up afterward, and this pass has no throwaway/sandbox account policy confirmed). Type-correctness against the live spec's exact schema is the verification basis here, not a live call. Flag if you want an actual live signup executed — creating real backend records needs a decision first, not something to do silently.
