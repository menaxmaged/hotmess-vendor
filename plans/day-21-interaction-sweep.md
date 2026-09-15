# Day 21 — Interaction Sweep (Sheets, Dialogs, Multi-step Flows)

> Status: implemented 2026-09-15

## Context

Day 20 took screenshots of each route's first render only. This day opens every sheet, action sheet, tab and multi-step flow that can be reached without real data. It uses `scratchpad/flows.js` (Playwright, 390×844, API faked, 38 flows). Each state gets a screenshot, and console errors and browser dialogs are recorded.

Flows covered:
- **Calendar:** add sheet, Week and Agenda views.
- **Finance:** add payment, payment actions, report sheet.
- **Chat detail:** info panel, note toggle, saved replies, attach sheet.
- **Inbox:** sort sheet.
- **Ads:** campaign builder, campaign actions.
- **Profile:** all 6 tabs and the preview.
- **Settings:** edit sheet, language sheet, delete account.
- **Team:** new role, member actions.
- **Other screens:** premium upgrade, locked automation mode, notifications filter, checklist deep link, Home Ads and Subscription tabs, WhatsApp invite.
- **Auth:** forgot password through all 3 steps, login error.

## Scope

1. **`Alert.alert` does nothing on web.** react-native-web ships it as a no-op, so all 52 calls in 14 files did nothing: delete account, cancel campaign, delete event, premium gates, error alerts. Add a web shim onto `window.alert`, `confirm` and `prompt`, installed once in the root layout.
2. **Checklist and notification deep links always land on the Profile tab.** The spec's `deepLink` examples include `/vendor/profile/packages`, but packages live on the Files tab. The profile screen should take a `?tab=` param, and `resolveDeepLink` should map profile sub-paths to tabs.
3. **Finance "add payment" shows an empty BRIDE section** when there are no conversations, with no explanation. Add a hint.

Checked and not changed:
- DatePicker is missing on web (calendar start, ad start date). This was already known, and native works.
- The report title shows a raw key (`monthly_revenue`) and the Instagram name shows "IG user <id>". Both come from mock data.
- Ads builder "Cancel" is inside the sheet padding.
- Tapping "Sales" opened the member sheet, but that was the script matching Mona's role label.

## Verification

Run `npx tsc --noEmit` and eslint on changed files. Restart Expo, then re-run the flows that depend on `Alert` (settings-delete, premium-upgrade, automation-questions, chat-template, calendar event delete) and check that a browser dialog is recorded.

## What was actually built

- **`lib/web-alert.ts`** (new): `installWebAlert()` replaces `Alert.alert` on web only. It maps buttons to the browser's dialogs:
  - one button → `window.alert`
  - cancel plus one action → `window.confirm`
  - more than that → a numbered `window.prompt`

  `onPress` of the chosen or cancel button runs as it would on native. It is called once at module load in `app/_layout.tsx`. Native is untouched.
- **`app/(app)/more/profile.tsx`**: reads `?tab=`, which opens that tab. A new param while mounted switches tabs too, using the "adjust state during render" pattern (a first `useEffect` version failed the `react-hooks/set-state-in-effect` lint rule).
- **`lib/deep-link.ts`**: `/vendor/profile/<x>` maps to a tab:
  - `packages`, `files`, `portfolio` → `files`
  - `categories`, `coverage` → `categories`
  - `booking`, `booking-rules` → `booking`
  - `instagram` → `instagram`

  `/vendor/profile` alone still opens the Profile tab.
- **`app/(app)/finance.tsx`**: the add-payment sheet explains an empty bride list.

Found, not changed:
- Premium upgrade calls `WebBrowser.openBrowserAsync`. That is a new tab on web, which headless Chrome blocks, so nothing appeared in the screenshot. Not a bug.
- The mock checklist items use `/more/profile` deep links. Only live `/vendor/profile/packages` values reach the new tab mapping. The sub-path names besides `packages` are guesses: the spec only documents `packages` as an example.

## Verification actually performed

- `node scratchpad/flows.js`: 38 flows.
  - First run: 5 step failures, all from script selectors (chat header and composer icons have no text or label) or one network blip. They were fixed with coordinate clicks and rerun, and all rendered.
- After restarting Expo:
  - `settings-delete` records `confirm: Delete account…`.
  - `automation-questions` and `chat-template` record `alert: Premium feature…`.
  - Before the shim, all three recorded no dialog.
  - The `finance-add` screenshot shows the new hint.
- `npx tsc --noEmit`: exit 0.
- `npx eslint lib/web-alert.ts lib/deep-link.ts app/_layout.tsx "app/(app)/more/profile.tsx" "app/(app)/finance.tsx"`: first run 1 error (set-state-in-effect), fixed, then clean.
- **Not done:**
  - No native run.
  - The `?tab=` deep link was not clicked through with a live `deepLink` value, since the mock only has `/more/profile`.
  - Calendar event edit/delete and quote/meeting sheets need real events and quotes, which the faked API doesn't return.
