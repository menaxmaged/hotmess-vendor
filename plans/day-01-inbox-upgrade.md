# Day 1 — Inbox: Wire the Remaining Real Endpoints

> Status: implemented 2026-08-13.

## Context

`PLAN.md` already wired `getChats`/`updateStatus` for real; everything else in `Modules/inbox/api.ts` throws via a shared `notAvailable(feature)` helper (lines ~99, ~162-180) because those endpoints didn't exist at the time. Confirmed live now (fetched `/docs/swagger-ui-init.js` 2026-08-13):
`GET /vendor/conversations/{id}/bride`, `GET/POST /vendor/conversations/{id}/notes`, `POST/DELETE /vendor/conversations/{id}/pin`, `POST /vendor/conversations/{id}/archive`, `PATCH /vendor/conversations/{id}/assignee`, `PATCH /vendor/conversations/{id}/follow-up`.

## Scope

1. `getChat` — merge the real `bride` sub-resource into the detail response. Still no message-thread endpoint (nothing changed there) — keep the existing mock-then-thin-real-detail fallback for messages specifically, don't touch it.
2. Replace `notAvailable(...)` with real calls for: `addNote`, `togglePin`, `toggleArchive`, `assignChat`, `setFollowUp`. `sendMessage`/`markUnread` stay on `notAvailable` — still no backend for those.
3. Drop the id-mismatch fallback logic in the mock store that only existed to paper over these six being unimplemented — no longer needed once real ids flow through consistently.

## Verification

1. `npx tsc --noEmit` clean.
2. Open a real conversation: bride detail renders, add a note, pin/archive it, change assignee, set a follow-up date — all round-trip through the real API, no `notAvailable` errors for these six.
3. `sendMessage`/`markUnread` still cleanly throw "not available" (caught by react-query `onError`, no crash) — unchanged behavior confirmed, not a regression.

## What was actually built

Pulled exact request/response schemas straight from the live spec (`GET /docs/swagger-ui-init.js`) rather than guessing shapes — see `bride`/`notes`/`pin`/`archive`/`assignee`/`follow-up` handlers in `Modules/inbox/api.ts`.

- `getChat`'s real-detail fallback now also fetches `GET .../{id}/bride` and merges it into a full `BrideDetail` (occasions, meetings, finance.quotes/payments) — previously that branch synthesized an almost-empty bride object.
- `addNote`, `assignChat`, `setFollowUp` — wired to the real `POST notes` / `PATCH assignee` / `PATCH follow-up` endpoints.
- `togglePin` — wired both directions (`POST`/`DELETE .../pin` both exist). **Caveat found while wiring, not in the original plan**: neither the list nor detail endpoint ever echoes back `isPinned` — there's no way to read current pin state from this API at all, only mutate it. The toggle persists server-side but the UI's pinned badge can't reflect real state until the backend adds that field somewhere readable. Flagged in code (`Modules/inbox/api.ts`), not fixable client-side.
- `toggleArchive` — only the `archived: true` direction is wired (`POST .../archive`). There is no unarchive endpoint at all (unlike pin, which has both directions) — `toggleArchive(id, false)` still throws `notAvailable`, this is a real backend gap, not an oversight.
- Added a `fetchSummary(chatId)` helper: since the mutation endpoints' responses only echo back the one field they changed (e.g. pin returns `{id, isPinned}`, not a full conversation), mutations re-fetch `GET .../{id}` afterward and re-map it, rather than returning a partially-fake `ChatSummary`. Functionally fine either way since every hook in `hooks.ts` invalidates + refetches on success regardless of the mutation's return value.
- **Cleanup beyond the letter of step 3**: removed all of `mockInboxApi`'s now-fully-dead methods (`getChats`, `sendMessage`, `updateStatus`, `assignChat`, `togglePin`, `toggleArchive`, `setFollowUp`, `addNote`, `markUnread`) and their private helpers (`buildBuckets`, `matchesAssignee`, `sortChats`) — confirmed via grep that `api.ts` only ever calls `mockInboxApi.getChat`, so all of those were unused, not just the ones this pass directly replaced.

## Verification actually performed

- `npx tsc --noEmit` — clean.
- `npx eslint Modules/inbox` — 0 errors (1 pre-existing-pattern warning, not new).
- `git status --short` — diff scoped to the intended files.
- **Not done**: no live device/simulator test (no running Expo session, no real vendor session available this pass — same credential gap as the dashboard's admin-auth pass). Correctness here rests on `tsc` + matching the live OpenAPI schemas exactly, not an end-to-end run.

## Update 2026-08-13 (later, from a vendor-wide route-coverage audit): counts + notes wired

A full audit of every `/v1/vendor/*` route against every module's call sites found two real endpoints this module never called:

- **`GET /vendor/conversations/counts`** — the inbox header's per-status/per-assignee chip counts were computed client-side from the (possibly filtered) fetched chat list, not from this dedicated server-computed endpoint. Added `getCounts()` + `useConversationCounts()`; the inbox screen's filter chips now show real counts.
- **`GET /vendor/conversations/{id}/notes`** — `addNote` (POST) was wired, but the matching GET was never called, so `getChat`'s real-detail branch always returned `messages: []` — an added note had nowhere to render on refetch. Added `fetchNotes()`, merged into `getChat`'s messages array.
- **Found and fixed while wiring counts, not itself a route gap**: the assignee filter chips' labels were always "Team member" (a placeholder — the list/detail conversation payloads only ever carry `assignedMemberId`, no name) and, worse, the sheet for *assigning* a chat only ever offered members who already had at least one assigned lead — a team member with zero current assignments could never be picked as a first assignee. Both come from the same root cause: the old bucket-builder derived its member list from the fetched chat list instead of the real team roster. Fixed by joining `Modules/team`'s real `useTeamOverview()` into the inbox screen for both the chip labels and (separately, using the *full* active roster, not the buckets) the assign-target picker.
- `ChatListResponse.assigneeBuckets` removed from the type (dead once buckets moved to the screen); `AssigneeBucket` stays, now built at the screen level.
- Both `useUpdateChatStatus` and `useAssignChat` now also invalidate the counts query key, or the chip counts would silently go stale after any status change or reassignment.

### Verification
- `npx tsc --noEmit` — clean. `npx eslint Modules/inbox app/(app)/inbox` — 0 errors.
- Not live-tested — same gap as the rest of this pass.
