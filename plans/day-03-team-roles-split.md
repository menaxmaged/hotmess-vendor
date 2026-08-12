# Day 3 — Team + Roles: Split into Two Modules

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
