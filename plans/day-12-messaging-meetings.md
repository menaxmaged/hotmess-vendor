# Day 12 — Real Messaging, Attachments & Meetings

> Status: implemented 2026-09-15

## Context

Re-audit 2026-09-15 against the live spec (368 ops). Every `api.*` call in the vendor app was cross-referenced by method + path. The inbox has been live for list/status/assignee/pin/archive/follow-up/notes since day 1, but the **actual conversation thread is still fake**: `sendMessage` rejects with "no backend endpoint", and the thread only shows internal notes (live ids) or hardcoded mock messages (mock ids).

The spec now has shared, side-projected conversation routes that a vendor seat can call:
- `GET /v1/conversations/{id}/messages` — keyset paged (`cursor`, `limit` ≤ 50, `meta.nextCursor`/`hasMore`), newest first. Items: `senderSide` (`bride|vendor|system`), `kind` (`text|file|meeting_card|system`), `body`, `file{id,originalName,mimeType,byteSize,url}`, `fileExpired`, `meetingProposalId`, `readAt`.
- `POST /v1/conversations/{id}/messages` — `{ body }` or `{ kind: 'file', fileId, body? }`. "Same route for both sides; the service resolves who is sending." Trial caps don't apply to vendor seats.
- `POST /v1/conversations/{id}/read` — `{ messageId }`, marks everything from the other side up to it.
- `GET /v1/conversations/unread-count` — `{ conversations, messages }` for a badge.
- `POST /v1/files` — multipart `file` + `kind: chat_attachment`; jpeg/png/webp/gif/pdf only.
- `GET|POST /v1/conversations/{id}/meetings`, `POST /v1/meetings/{id}/confirm`, `POST /v1/meetings/{id}/cancel` — either party; confirm writes a calendar event; a `meeting_card` message is written into the thread on propose.

Bride-only in the same tag (vendor seat gets 404, so **not** wired): `PATCH .../status` (bride's six-value column), `POST|DELETE .../pin`, `DELETE /conversations/{id}`, `.../unarchive`, `PUT .../occasions`, `PUT .../tasks`, `POST /conversations`.

## Scope

1. `Modules/inbox` api/types/hooks:
   - `getMessages(chatId, cursor)` + `useMessages` (infinite query).
   - `sendMessage` goes live: text → `POST messages`; attachment → `POST /files` then `POST messages {kind:'file', fileId}`.
   - `markRead`, `getUnreadCount` + `useUnreadCount`.
   - `getMeetings`, `proposeMeeting`, `confirmMeeting`, `cancelMeeting` + hooks.
   - `isReadOnly` mapped onto `ChatSummary` (suspended studio / closed thread).
2. Chat screen `app/(app)/inbox/[id].tsx`:
   - Thread = live messages merged with internal notes, newest first, load older on scroll.
   - Bubbles per kind: text, file (image preview or file row, opens URL; "expired" state), meeting card (date/status + Confirm/Cancel when pending), system notice.
   - Mark read when the newest bride message changes.
   - Attach button (photo / PDF) in composer; disabled in note mode.
   - Meeting proposals section in the bride panel with "Propose meeting" (date+time, optional note).
   - Composer disabled when the thread is read-only.
3. Inbox tab badge from `unread-count`.

Out of scope: `markUnread` (still no endpoint), vendor-side unarchive (the only unarchive route is bride-side), push/realtime (no websocket in spec — rely on refetch-on-focus / pull).

## Verification

- `npx tsc --noEmit`, `npx eslint Modules/inbox "app/(app)/inbox" "app/(app)/_layout.tsx"`.
- Re-run the cross-reference script — the 7 conversation/meeting/file ops above should show as called.
- `git status --short`.
- No device/simulator run and no vendor test account → no live verification; say so.

## What was actually built

- **`Modules/inbox/api.ts`** — new `getMessages` (keyset paged, `limit: 30`, reads `meta.nextCursor`/`hasMore` off the envelope), live `sendMessage` (text, or `POST /files` with `kind: chat_attachment` then `{kind:'file', fileId, body?}`), `markRead`, `getUnreadCount`, `getMeetings`, `proposeMeeting`, `confirmMeeting`, `cancelMeeting`. `mapMessage` normalizes `senderSide`/`kind`/`file`; `resolveFileUrl` prefixes the API origin when a file url comes back host-relative (spec doesn't say which it is). `mapConversation` now carries `isReadOnly` as `readOnly`.
- **`Modules/inbox/hooks.ts`** — `useMessages` (react-query v5 infinite query), `useUnreadCount` (polls every 60s — the spec has no realtime channel), `useMarkRead`, `useMeetings`, `useProposeMeeting`, `useConfirmMeeting`, `useCancelMeeting` (meeting mutations also invalidate `["calendar"]`, since confirm/cancel write or remove a calendar event). `useSendMessage` now also invalidates the thread.
- **`app/(app)/inbox/[id].tsx`** — thread is the live paged messages merged with internal notes (deduped by id, newest first, older pages on scroll). Bubble per kind: text, file (inline image or doc row that opens the URL, "no longer available" when `fileExpired`), meeting card (datetime, status, Confirm/Cancel), system notice. Marks read up to the newest bride message. Attach button (photo / PDF — the only MIME types `POST /files` accepts), hidden in note mode. Read-only threads show a banner and only allow notes. Bride panel gets a "Meeting proposals" section with "+ Propose meeting" (nativewindui `DatePicker`, `mode="datetime"`, optional 500-char note).
- **`app/(app)/_layout.tsx`** — Inbox tab badge = `unread-count.conversations`.

**Changed from plan / found:**
- Sender names aren't in the message payload at all, and `senderSide` is thread-relative — every vendor-side message (any team member's, or a welcome-flow auto-reply with `senderUserId: null`) renders as "vendor". No per-member attribution possible without another endpoint.
- "Confirm" is hidden on proposals the current user made (the API allows either party to confirm, but confirming your own proposal isn't a real flow). Uses `useAuth().user.id` compared as a string; `User.id` is typed `number | string` in this app.
- Lint caught `Date.now()` during render in the propose modal (react-hooks purity rule) — replaced with a mount-time timestamp for the UI hint plus a real-clock check in the submit handler.
- `mockInboxApi.getChat` still serves mock threads for the 6 hardcoded ids; the live messages query simply returns nothing extra for them. Left as-is.
- Cancel sends no `reason` (optional in spec) — RN has no cross-platform text prompt and a whole modal for an optional field wasn't worth it.

**Caveats / follow-ups:**
- `@react-native-community/datetimepicker` renders nothing on web, so proposing a meeting only works on iOS/Android builds.
- RN-style `FormData.append('file', {uri,name,type})` is the same pattern `Modules/profile` already uses; it does not work in a web build.
- Still no endpoint for mark-unread or vendor-side unarchive.

## Verification actually performed

- `npx tsc --noEmit` — exit 0.
- `npx eslint Modules/inbox "app/(app)/inbox" "app/(app)/_layout.tsx"` — first run: 1 error (`react-hooks/purity`, `Date.now` in render); fixed; second run exit 0, no output.
- Cross-reference script re-run — `GET/POST /conversations/{id}/messages`, `POST .../read`, `GET /conversations/unread-count`, `GET/POST .../meetings`, `POST /meetings/{id}/confirm|cancel` no longer listed as uncalled. (`POST /files` still shows because the script doesn't parse `apiFormData.*`; confirmed by grep that both profile and inbox call it.)
- **Not done:** no Expo/device run, no vendor test account, no real conversation — nothing here has been exercised against the live API.
