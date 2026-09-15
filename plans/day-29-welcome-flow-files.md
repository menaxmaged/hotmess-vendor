# Day 29 — Welcome Flow Files

> Status: implemented 2026-09-15

## Context

Automation offers 5 welcome modes. Two of them ("Welcome + files" and "Welcome + questions + files") send the bride files after the greeting. Day 6 wired the Save button to `PUT /vendor/automation/welcome-flow`, but the screen has never had a way to choose files: `automation.tsx` always sends `fileIds: []`. A vendor who picks a files mode saves a flow that sends no files, with no warning. That has been flagged as a gap since Day 6.

Spec (`PUT /v1/vendor/automation/welcome-flow`):
- `fileIds`: at most 5.
- Values are `VendorFile` ids from the studio's own portfolio (Profile → Files, `GET /vendor/profile/files`), not raw upload ids. Sending a file the studio doesn't own returns 404.
- `GET` returns `files[]` as `{ id, hasBlob }`. `hasBlob: false` marks a portfolio row whose bytes were never linked; the server skips it when the flow fires, "and this is how the vendor sees why".

## Scope

1. `automation.tsx`: when the mode includes files, show a "Files to send" section listing the studio's supplementary files (from the existing `useProfileOverview`) as selectable rows.
   - Max 5, with a count.
   - Pre-selected from the saved flow's `files`.
   - Files with `hasBlob: false` are flagged "won't be sent — re-upload it".
   - Empty state links to Profile → Files (`?tab=files`, Day 21).
2. Save sends the selected ids for files modes (`[]` otherwise). Saving a files mode with no files selected asks the vendor to confirm first.
3. `en`/`ar` copy in the `automation` namespace.

## Verification

- `npx tsc --noEmit`, `i18n-parity.js`, eslint.
- Mock flow screenshots:
  - Automation with "Welcome + files" selected, in English and Arabic.
  - Select a file, save, and confirm the mock receives `fileIds`.
- No live call (no vendor account).

## What was actually built

- **`app/(app)/more/automation.tsx`**:
  - New `WelcomeFilesPicker`, shown for "Welcome + files" and "Welcome + questions + files". It lists the studio's supplementary files from `useProfileOverview()`: checkbox rows, a max of 5 (a 6th tap explains the limit), and a count in the section title.
  - Selection starts from the saved flow's `files`. Files with `hasBlob: false` get a red "won't be sent — re-upload it" note.
  - Empty state, plus a link to Profile → Files (`?tab=files`).
  - Save sends the selected ids for files modes (`[]` otherwise). Saving a files mode with nothing selected now asks "No files selected… Save anyway?"; before, it silently saved a flow that sends nothing.
- **`Modules/automation/mock.ts`**: `setWelcomeFlow` echoes `fileIds` back as `files` (it used to drop them).
- **Copy**: `automation:files.*` in English and Arabic.

Found / changed from plan:
- **Arabic counter order.** "{{value}}/5" rendered as "5/0" in Arabic: the isolated number sat before a literal "/5" inside RTL text. Both Arabic counters (files and Day 25's intake questions "{{value}}/6") now read "{{value}} من N". A grep found no other slash counters in `locales/ar`.

## Verification actually performed

- `npx tsc --noEmit`: exit 0. `i18n-parity.js`: `PARITY OK` (765 `t()` calls). eslint on `automation.tsx`, `Modules/automation`, `locales`: clean.
- The mock welcome-flow `mode` was temporarily set to `welcome_files` and reverted afterwards; `git diff` shows only the intended `fileIds` echo line.
  - `files-pick-save` (tap "Lookbook_2026", then Save) records `alert: Saved`.
  - `files-none-save` (Save with nothing picked) records `confirm: No files selected…`.
  - Screenshots on a fresh :8089 server:
    - **English:** "FILES TO SEND · 1/5", the file row checked, the manage link.
    - **Arabic:** "الملفات المرسلة · 1 من 5", mirrored.
- **Not done:** no live `PUT` (no vendor account). The `hasBlob: false` note wasn't screenshotted (every mock file has its blob).
