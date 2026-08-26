# Day 10 — Saved Replies (New Module)

> Status: implemented 2026-08-13.

## Context

Second of three route groups found unwired by the vendor-wide route-coverage audit, flagged since day-1 as net-new. `GET/POST /vendor/saved-replies` + `DELETE /vendor/saved-replies/{id}` — Premium-gated on the READ too ("a lapsed studio keeps its saved replies... but does not go on using them"), no existing UI slot at all.

## Scope

1. New `Modules/saved-replies/` (`api.ts`, `hooks.ts`, `types.ts`, `mock.ts`): `getSavedReplies`, `createSavedReply`, `deleteSavedReply`.
2. Management screen to create/view/delete saved replies.
3. Quick-insert affordance in the inbox chat composer, since "saved replies" only matter if they're reachable while writing to a bride.

## What was actually built

- `Modules/saved-replies` built to the live spec's flat `{id, title, body}` shape.
- New screen `app/(app)/more/saved-replies.tsx`: Premium gate shown as a dedicated locked-state screen (not just a badge) since the endpoint itself 403s for non-Premium — list, inline add form, delete with confirm. Registered in `more/_layout.tsx` and added to the More menu's Studio section.
- Chat detail composer (`app/(app)/inbox/[id].tsx`): added a quote-bubble icon button next to the existing note-toggle button, opening an action sheet of saved-reply titles; picking one fills the message draft with the reply's body. Gated the same way — non-Premium taps get an upgrade alert instead of an empty/broken sheet.
- **Found and fixed while touching the More menu, not itself a route gap**: `app/(app)/more/index.tsx`'s Premium badges (on Team & Roles, and now Saved Replies) were reading `Modules/home`'s permanently-mock subscription flag — the exact same stale-mock-gate pattern days 5/6 already had to fix in `premium.tsx`/`automation.tsx`. Switched to the real `Modules/subscription`'s `useSubscription()` while already in this file.
- Note: quick-inserting a saved reply into the composer doesn't guarantee the message can be *sent* — `sendMessage` in `Modules/inbox` still has no backend endpoint at all (flagged since day-1) and throws `notAvailable`. Saved replies are still useful for the (working) internal-note path and as a drafting aid; not a regression this pass introduced.

## Verification actually performed

- `npx tsc --noEmit` — clean.
- `npx eslint Modules/saved-replies app/(app)/more/saved-replies.tsx app/(app)/more/index.tsx app/(app)/more/_layout.tsx app/(app)/inbox/[id].tsx` — 0 errors.
- `git status --short` — diff scoped to the new module, the new screen, and the two screens it's wired into.
- **Not done**: no live device/simulator test, no real Premium account to confirm the 403 gate's exact behavior. Same gap as every other day.
