# Day 23 — i18n: Inbox List and Chat Detail

> Status: implemented 2026-09-15

## Context

Day 22 added the i18n foundation: typed `t()` keys, an `ar` file typed against `en`, RTL on web plus the native restart path, `message_ar` errors, and a locale-aware `lib/format.ts`. It also translated auth, the tab bar, More and Settings.

The inbox is the app's busiest surface:
- `app/(app)/inbox/index.tsx`: filter chips, sort and status sheets, swipe actions, empty state.
- `app/(app)/inbox/[id].tsx` (~1000 lines): composer, attachments, bride panel, quotes (list, detail, builder), follow-up sheet, meeting proposals.
- `Modules/inbox/status.ts`: the 15 lead-status labels from PRD §13, shown as pills everywhere, in Home's pipeline and in sheets.

## Scope

1. `locales/{en,ar}/inbox.ts` (new `inbox` namespace).
2. Lead status labels → `inbox:status.<status>`. `StatusPill` translates; sheets use the same keys.
3. Inbox list: search placeholder, chips (All / Me / Unassigned), sort options, status filter, assign sheet, swipe actions, empty and error states, "Follow up …".
4. Chat detail:
   - Composer: note / message placeholders, saved-replies gate, attach sheet, send and upload errors, read-only banner.
   - Meeting cards and statuses, file attachments.
   - Bride panel field labels.
   - Quotes: section, detail sheet, builder.
   - Follow-up sheet, meeting proposals and propose sheet.
5. Inbox stack title.

Not in scope: raw backend enums still shown as-is in the bride panel (`payment.type`, `meeting.type`). These come from the finance and calendar vocabularies, translated on Day 24.

## Verification

- `npx tsc --noEmit` (typed keys), `scratchpad/i18n-parity.js`, eslint on changed files.
- Arabic and English screenshots: inbox list, chat detail with the bride panel open, attach sheet, sort sheet.
- No native run.

## What was actually built

- **`locales/{en,ar}/inbox.ts`**: 116 keys.
  - The 15 PRD lead statuses, the sort options, and the list, chat, bride-details, meeting, quote and follow-up strings.
  - Registered in `locales/index.ts`.
- **`Modules/inbox/components/StatusPill.tsx`**: the label comes from `t('status.<status>')`. `STATUS_META` keeps its `label` field as an English reference; nothing renders it now.
- **`app/(app)/inbox/index.tsx`**:
  - `SORT_LABELS` became the key list `SORT_OPTIONS`.
  - Assignee chips, the status, assign, sort and filter sheets, swipe actions, empty and error states, and "Follow up …" all go through `t()`.
- **`app/(app)/inbox/[id].tsx`**:
  - Every visible string in the thread screen and its 8 sub-components goes through `t()`: the composer, saved-reply gate, attach sheet, send and upload errors, read-only banner, meeting card, file attachment, bride panel, quotes list/detail/builder, follow-up sheet, and meeting proposals/propose sheet.
  - `MEETING_STATUS_META` and `QUOTE_STATUS_META` keep only their colour classes.
  - Each sub-component calls its own `useTranslation`, placed above any early return (hooks rule).
- **`app/(app)/inbox/_layout.tsx`**: stack title translated.

Found / changed from plan:
- The first script run rolled back cleanly. One indentation assumption was wrong (the meeting-proposal pill is nested 2 levels deeper than the quote pill). The script validates every replacement and restores all files on any mismatch, so nothing was left half-applied.
- The bride panel still shows raw backend enums for past payments (`p.type`) and meetings (`m.type`), as planned. The finance kind labels from Day 24 could cover payments later; the calendar types don't map 1:1 to meeting types.
- The Expo web server was killed by the OS for low memory right after this day's edits. Screenshots for this day were taken on Day 24 (see there).

## Verification actually performed

- `npx tsc --noEmit`: exit 0. Template keys like ``t(`status.${s}`)`` type-check against the union of real keys.
- `i18n-parity.js`: `PARITY OK`, inbox 116/116, 279 `t()` calls resolved.
- `npx eslint "app/(app)/inbox" Modules/inbox/components locales`: clean.
- Arabic web screenshots (taken during Day 24): the inbox list shows translated search, chips, sort button and empty state, mirrored. Chat detail shows the translated composer placeholder, the Arabic timestamp (`15 سبتمبر، 4:01 م`), and the bride bubble on the RTL start side.
- **Not done:** no native run. The quote builder, follow-up and propose-meeting sheets were not opened in Arabic (no quotes or meetings in the faked API).
