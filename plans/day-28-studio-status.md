# Day 28 — Studio Status (Pending / Suspended / Delisted)

> Status: implemented 2026-09-15

## Context

The admin PRD's vendor-management section:
- "Removes vendor from all bride-facing surfaces immediately. Their profile is invisible. Bride chat threads go read-only. Vendor can still log in to see their data but cannot send messages."
- "vendors go live immediately on sign-up" versus the admin pre-approval toggle (an open decision; either way `pending` exists).

The live spec (1.0.0, 368 ops):
- `GET /v1/vendor/profile` → `data.status: "active" | "pending" | "suspended" | "delisted"`. The vendor-facing payload has no reason field.
- Admin suspend sets the studio's conversations `isReadOnly` in the same transaction. A send to a read-only thread is `409`, "This conversation is read-only".

What the app does today:
- **Read-only threads are already handled** (Day 12): the composer hides send and attach, and shows a read-only banner.
- **Studio `status` is dropped.** `Modules/profile/api.ts` `mapCore` never maps it, so a pending, suspended or delisted vendor sees a normal app, with no explanation of why brides aren't reaching them or why every thread refuses messages.

## Scope

1. `ProfileCore.status: StudioStatus` mapped from `GET /vendor/profile` (missing value → `active`); the mock gets `status: "active"`.
2. A lightweight `useStudioStatus()` hook reading the profile core.
3. `components/StudioStatusBanner.tsx`: renders nothing when active. Otherwise a tone-coded card with the status title, what it means for brides and chats, and what to do. Shown at the top of Home, the Inbox list and More.
4. `en` and `ar` copy under `studio:status.*`.

Not in scope:
- A suspension reason: not in the vendor payload.
- Blocking vendor actions client-side: the server enforces them, and the read-only composer already covers messaging.

## Verification

- `npx tsc --noEmit`, `i18n-parity.js`, eslint.
- Screenshots: the banner hidden for `active`. With the mock status temporarily switched in a scratch copy only (never committed), the `suspended` and `pending` banners in English and Arabic on Home, Inbox and More.
- No live suspended account (none in this environment).

## What was actually built

- **`Modules/profile/types.ts`**: `StudioStatus = "active" | "pending" | "suspended" | "delisted"`; `ProfileCore.status`.
- **`Modules/profile/api.ts`**:
  - `RealProfile.status` is mapped by `mapCore`. A missing value falls back to `active`, so an older payload doesn't warn every vendor.
  - `liveProfileApi.getCore` (= the existing `fetchCore`) is exposed.
  - The mock core has `status: "active"` and a matching `getCore`.
- **`Modules/profile/hooks.ts`**: `profileKeys.core` and `useStudioStatus()`. It makes one lightweight `GET /vendor/profile` (5-minute stale time) instead of pulling the 3-request profile overview onto Home.
- **`components/StudioStatusBanner.tsx`** (new): renders nothing when active. Otherwise a tone-coded card: amber for pending, red for suspended, neutral for delisted. Mounted under Home's header, at the top of the Inbox list header, and at the top of More.
- **Copy**: `studio:status.{pending,suspended,delisted}{Title,Body}` in English and Arabic. It says what brides see, what happens to chats, and what to do (contact HOTMESS support).

Found / changed from plan:
- **Read-only threads needed no work.** The chat composer already hides send and attach, and shows the read-only banner per conversation from `isReadOnly` (Day 12). Suspension sets that server-side in the same transaction.
- **No reason is shown.** The vendor payload has no suspension reason; `suspendedReason` exists only on admin schemas.
- **Remaining cosmetic bidi issue.** The Arabic Home revenue line ("{{total}} إجمالي المُحصّل · {{outstanding}} مستحق") still renders out of order on web even with isolated values. The paragraph starts with an isolate, so its base direction resolves oddly. Values are intact; word order around the "·" isn't ideal. Not changed.

## Verification actually performed

- `npx tsc --noEmit`: exit 0.
- `i18n-parity.js`: `PARITY OK`. The banner's template keys aren't counted by the script's literal scan; tsc checks them.
- `npx eslint` on the banner, `Modules/profile`, the 3 screens and `locales`: clean.
- Screenshots via :8081, with the mock core `status` switched `active` → `suspended` → `pending` → `active` by `sed` in one script, with an 8-second live-reload wait each time:
  - **Active:** Home has no banner (same as before).
  - **Suspended, English:** red banner on Home (below the pill tabs), Inbox (above search) and More (above the account card).
  - **Suspended, Arabic:** the same on Home and Inbox, mirrored, with Arabic copy.
  - **Pending, English:** amber "Your studio is under review" on Home.
- After the run, `git diff --stat -- Modules/profile/mock.ts` shows only the intended +6 lines: `status: "active"` and `getCore`. The temporary values were reverted.
- **Not done:** no live suspended, pending or delisted account; the delisted tone wasn't screenshotted; no native run.
