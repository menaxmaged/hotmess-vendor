# Day 3 — Team + Roles: Split into Two Modules

> Status: implemented 2026-08-13.

## Context

`Modules/team` is currently all-mock. Confirmed live now: `GET /vendor/team` (members + invites + seats in one combined payload), invites as their own resource (`POST /vendor/team/invites`, `POST /vendor/team/invites/accept`, `DELETE /vendor/team/invites/{id}`), member role change via `PATCH /vendor/team/members/{id}` (not a separate `/role` sub-route). **Roles is now a top-level resource**, not nested under team: `GET/POST/PATCH/DELETE /vendor/roles`, `/vendor/roles/{id}`.

The role-edit screen (`app/(app)/more/team/role/[id].tsx`) already assumes a standalone roles resource shape — this split isn't a UI change, just wiring what the screen already expects.

## Scope

1. **Team** — remap `Modules/team/api.ts` around `GET /vendor/team`'s combined payload. `inviteMember` → `POST /vendor/team/invites`; add `acceptInvite` → `POST /vendor/team/invites/accept`; `revokeInvite` → `DELETE /vendor/team/invites/{id}`. Member role change moves to `PATCH /vendor/team/members/{id}`.
2. **Roles (new module)** — create `Modules/roles/` (`api.ts`, `hooks.ts`, `types.ts` — mirror the existing module pattern) pointed at `/vendor/roles`. Move `createRole`/`updateRole`/`deleteRole` out of `Modules/team` into here.
3. Wire `Modules/roles` into `app/(app)/more/team/role/[id].tsx`.

## Verification

1. `npx tsc --noEmit` clean.
2. Team screen: invite a member, accept an invite, revoke a pending invite, change a member's role — all round-trip through the real API.
3. `team/role/[id].tsx` creates/edits/deletes a custom role for real, backed by `Modules/roles`.

## What was actually built

Pulled exact request/response schemas from the live spec (same `spec.json` snapshot as day-02, re-verified against `/vendor/team`, `/vendor/team/invites*`, `/vendor/team/members/{id}`, `/vendor/roles*`).

- **`Modules/roles/`** created (`api.ts`/`hooks.ts`/`mock.ts`/`types.ts`), mirroring the module pattern. `getRoles`/`createRole`/`updateRole`/`deleteRole` moved out of team, pointed at `/vendor/roles`.
- **The permissions document is a different shape than the old mock invented**, not just a different route. Real: `inbox: 'none'|'assigned'|'all'`, `calendar: 'none'|'view'|'full'`, a single `finance: 'none'|'quotes'|'payments_view'|'payments_edit'|'full'` (one graded level, not four independent booleans), `studio`/`growth` as arrays of flags, `admin: boolean`. Old mock had two-option inbox/calendar and four separate finance booleans that could be inconsistently combined (e.g. `financePaymentsEdit: true` with `financeFullAccess: false` — not a real state). `RolePermissions` rewritten to match; `role/[id].tsx`'s editor rebuilt around it (3-way segmented choice for inbox/calendar, 5-way for finance, toggles that read/write array membership for studio/growth).
- **Built-in roles are now correctly locked in the editor.** The live spec states plainly that built-ins can't be renamed or have permissions edited (`PATCH /vendor/roles/{id}` docs) — the old mock UI let you "edit" them anyway (the mock store just silently allowed it). Editor now disables the form and hides Save/Delete for `isBuiltIn` roles.
- **Team**: `getOverview` now reads `GET /vendor/team`'s `{ members, invites, seats }` and merges `members` (status `active`) + `invites` (status `pending`) into one list, matching the existing screen's single-list-with-a-Pending-badge UI — no restructuring needed there. `inviteMember` → `POST /vendor/team/invites`, `revokeInvite` (new) → `DELETE .../invites/{id}`, member role change → `PATCH /vendor/team/members/{id}` (was a nonexistent `/role` sub-route). `acceptInvite` added and callable, exactly per plan item 1, but at the time **not wired to any screen** — it's a `security: []` public endpoint the not-yet-a-user invitee calls from an email link, not something a logged-in vendor ever does; no accept-invite screen existed in this codebase at all. Flagged rather than building a screen that wasn't asked for at the time.

**Update 2026-08-13 (later same day):** the flagged screen was requested and built — `app/(auth)/accept-invite.tsx`, registered in `(auth)/_layout.tsx` (lives in the unauthenticated stack, guarded by `RootNavigator`'s `!isAuthenticated` check, since the invitee has no session yet). Reads `token` from the route params (deep link, `hotmess-vendor://accept-invite?token=...`), collects name + password (with a client-side confirm-password check the API doesn't require but a signup form should have), calls `useAcceptInvite()`, then feeds the returned `LoginResponse` straight into `useAuth().login()` — the exact same sign-in path `signIn`/`signUp` use, so token storage, user caching, and the redirect to `(app)` all come for free rather than being reimplemented. `mockTeamApi.acceptInvite` was upgraded from "throws, unimplemented" to a working mock (accepts a hardcoded `mock-invite-token`) so the screen is exercisable under `USE_MOCK_DATA=true` too.
- **Real member/seat shape lost fields the old UI relied on, with no replacement**: no per-member `online`/presence data at all (dropped the green/gray dot from the members list — nothing to source it from), and no `plan`/`customRolesAllowed` on `seats` (dropped the "Upgrade to Premium" free-plan banner; kept a seats-full banner driven off `seated + liveInvites >= max` instead, and stopped client-side-gating "New role" on plan — the server already 403s `upgrade_required` on Free, surfaced through the existing form's error state, so gating twice wasn't necessary). `seatLimits.used/total` → `seated/liveInvites/max` (`max: null` = unlimited, handled).
- **Invite role assignment relaxed to match the real API**: `roleId` is nullable server-side ("omitted or null creates a seat holding no capabilities at all"), so `invite.tsx` no longer force-requires picking a role before sending.
- **Delivery channel**: dropped the old mock-only `'both'` option (real API takes exactly one channel) and added the `phone` field the spec requires when `deliveryChannel: whatsapp` is chosen, with an inline note that WhatsApp delivery isn't actually wired server-side yet (spec: "validated and stored but NOT delivered ... the skip is logged") — the invite still gets created either way.
- Member list no longer lets you act on the owner row (real API refuses both role-change and removal on the owner; UI now no-ops there instead of sending a request that will 403/409).

## Verification actually performed

- `npx tsc --noEmit` — clean.
- `npx eslint Modules/team Modules/roles app/(app)/more/team` — 0 errors after fixing two `react/no-unescaped-entities` (apostrophes in copy).
- `git status --short` — diff scoped to `Modules/team/*`, new `Modules/roles/*`, `app/(app)/more/team/*`.
- **Not done**: no live device/simulator test, no real vendor/team account exercised — same gap as days 1–2. Correctness rests on `tsc` + matching the live OpenAPI schemas/examples.
