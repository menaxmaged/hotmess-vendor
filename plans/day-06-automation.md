# Day 6 — Automation (New Module)

## Context

`app/(app)/more/automation.tsx` exists but "Save automation" only fires an `Alert` — zero backend coverage before now. Confirmed live: `GET/POST/PATCH/DELETE /vendor/automation/auto-assign-rules`, `/vendor/automation/auto-assign-rules/{id}`, `GET/PUT /vendor/automation/welcome-flow`, `GET /vendor/automation/merge-fields`.

## Scope

1. New `Modules/automation/` (`api.ts`, `hooks.ts`, `types.ts`): auto-assign-rules CRUD, `getWelcomeFlow`/`setWelcomeFlow`, `getMergeFields`.
2. Wire into `automation.tsx`'s "Save automation" so it actually persists instead of firing an `Alert`.

## Verification

1. `npx tsc --noEmit` clean.
2. Automation screen: Save persists, survives a reload (re-fetch confirms it stuck) — no more bare `Alert`.
3. Auto-assign rule CRUD round-trips through the real API.
