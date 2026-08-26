# Day 6 — Automation (New Module)

> Status: implemented 2026-08-13.

## Context

`app/(app)/more/automation.tsx` exists but "Save automation" only fires an `Alert` — zero backend coverage before now. Confirmed live: `GET/POST/PATCH/DELETE /vendor/automation/auto-assign-rules`, `/vendor/automation/auto-assign-rules/{id}`, `GET/PUT /vendor/automation/welcome-flow`, `GET /vendor/automation/merge-fields`.

## Scope

1. New `Modules/automation/` (`api.ts`, `hooks.ts`, `types.ts`): auto-assign-rules CRUD, `getWelcomeFlow`/`setWelcomeFlow`, `getMergeFields`.
2. Wire into `automation.tsx`'s "Save automation" so it actually persists instead of firing an `Alert`.

## Verification

1. `npx tsc --noEmit` clean.
2. Automation screen: Save persists, survives a reload (re-fetch confirms it stuck) — no more bare `Alert`.
3. Auto-assign rule CRUD round-trips through the real API.

## What was actually built

Pulled exact request/response schemas from the live spec (`/vendor/automation/*`).

- **`Modules/automation/`** created with full auto-assign-rules CRUD, `getWelcomeFlow`/`setWelcomeFlow`, `getMergeFields` — matches item 1. Rules CRUD is exposed at API/hooks layer only; `automation.tsx` never had a rules UI and the plan didn't ask for one, so none was added (same "API-only, no UI" pattern as day-4's report export and day-5's `setPaymentMethod`).
- **`automation.tsx`'s local `Mode` type doesn't match the backend's `WelcomeFlowMode` enum values** (`welcome_q`→`welcome_questions`, `full`→`welcome_questions_files`, others identical) — kept the screen's existing local vocabulary as-is (it's already wired to premium-gating copy and UI labels) and added a small two-way lookup table (`MODE_TO_REAL`/`REAL_TO_MODE`) at the boundary rather than renaming the UI's concepts to match the wire format.
- **The screen now actually loads the saved flow first** — previously `mode`/`message`/`questions` were hardcoded `useState` initial values with no fetch at all (there was nothing to load from; it was pure client state before this pass). Restructured into a data-loading `AutomationScreen` + a `AutomationForm` child seeded from `useWelcomeFlow()`'s result once, mirroring the `initial`-prop pattern used in `Modules/profile`'s tabs.
- **Merge fields are now the real list** (`GET .../merge-fields`) instead of a hardcoded five-token array — near-direct swap, same insert-into-message interaction.
- **`isPremium` gating switched from `Modules/home`'s mock to the real `Modules/subscription`'s `useSubscription()`** (built day-5) — found the same "screen reads a permanently-mock plan flag" issue day-5 had to fix in `premium.tsx`; fixed it here too rather than leaving a second inconsistent gate now that a real source exists.
- **Pre-existing gap, not introduced or fixed here**: the mode picker lets a vendor select "Welcome + files" / "Welcome + questions + files" with no file-attachment UI anywhere in this screen, so those modes always save with `fileIds: []`. This was true before this pass too (the modes were always selectable with nothing to back the "files" part) — flagging it now because wiring the save for real makes the gap concrete instead of moot.
- **Question objects simplified at the boundary**: the real API stores `{id, prompt, isRequired}` and is a full-replace PUT (ids aren't sent back, server reassigns), but the UI only ever collected plain prompt strings with no per-question required toggle — kept that; `isRequired: false` is sent for all of them rather than adding a toggle the plan didn't ask for.

**Update 2026-08-13 (later same day): auto-assign-rules UI added**, closing the "API-only" gap noted above — a new `AutoAssignRulesSection` at the bottom of `automation.tsx`, below the Save button (deliberately separate: rule changes save immediately per-action, not bundled into "Save automation"). Lists existing rules (criteria summary, assignee, fired-this-month count, active/paused toggle, up/down reorder via swapping `displayOrder`, delete), and an inline add-rule form (name, lead-source chips, city/occasion chips sourced from `Modules/profile`'s real `useCategoryOptions()`, assignee picker sourced from `Modules/team`'s real `useTeamOverview()`, filtered to active members). "New rule" is gated behind `isPremium` client-side (matches the real endpoint's own `403 upgrade_required` on Free) with the same alert pattern the welcome-mode picker already used. No new module code needed — this only consumes hooks `Modules/automation`, `Modules/profile`, and `Modules/team` already exposed.

## Verification actually performed

- `npx tsc --noEmit` — clean.
- `npx eslint Modules/automation app/(app)/more/automation.tsx` — 0 errors.
- `git status --short` — diff scoped to new `Modules/automation/*` and `app/(app)/more/automation.tsx`.
- **Not done**: no live device/simulator test, no real vendor account — same gap as days 1–5.

## Update 2026-08-13 (later, while building the auto-assign-rules UI addendum above): found and removed a duplicate screen

While adding the auto-assign-rules UI, discovered `app/(app)/more/auto-assign.tsx` — a separate, pre-existing, fully-mock screen (local `useState` seeded from a hardcoded array, "New rule" just fired an `Alert`) reachable from its own "Auto-Assign Rules" entry in the More menu, modeling rules by a completely different, wrong criteria shape (single `LeadStatus` trigger) than the real API (`leadSource`/`cityIds`/`occasionTypeIds`, ANDed/ORed). Two auto-assign UIs would have shipped side by side. Deleted the dead screen, removed its route from `more/_layout.tsx`'s `Stack.Screen` list and its separate More-menu entry, and folded its description into the "Automation" menu entry instead.
