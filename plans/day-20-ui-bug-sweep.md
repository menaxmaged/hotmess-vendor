# Day 20 — UI Bug Sweep

> Status: implemented 2026-09-15

## Context

Days 1–19 checked the API contract and made sure every hook can be reached from a screen, but nobody looked at the screens themselves. No list of UI bugs existed, so this day builds one. It runs the app on web (`expo start --web`, mock data), fakes `/auth/me` and the live inbox and calendar routes with Playwright, and takes screenshots of every route at 390×844, including auth screens and chat detail. It also records console errors and page errors.

## Scope

Fix every bug the screenshots show that is not caused by mock data:

1. Welcome: the "Vendor Studio" caption overlaps the 88px "hm!" mark, because the mark has no `lineHeight`.
2. Inbox list crashes ("Cannot read properties of undefined (reading '1')") when `/vendor/conversations/counts` comes back without `byAssignee`.
3. Change Password and Invite Member have no padding. `contentContainerClassName` does nothing on `KeyboardAwareScrollView` because NativeWind has no interop for it. Auth screens' `flex-grow` is lost the same way.
4. Change Password shows its intro sentence twice (the screen's copy plus `PasswordResetFlow`'s default copy).
5. Calendar and Analytics show their title twice: the tab navigator header plus the in-screen `ScreenTitle`.
6. Home hides its header but has no safe-area top inset, so on a notched phone its content sits under the status bar.
7. The Team seats bar never draws its fill (`ProgressIndicator`'s reanimated `%` width).
8. Notification preference switches show a teal thumb when on (react-native-web's default `activeThumbColor`), and the off track is invisible.

Out of scope, flagged only: i18n/Arabic/RTL (the app has no i18n usage at all), a suspended-vendor state, and web-only header edge padding.

## Verification

Run `npx tsc --noEmit` and eslint on the changed files, restart Expo, and re-run the screenshot pass. Compare before and after, and check the console error log.

## What was actually built

- `app/(auth)/welcome.tsx`: gave the "hm!" mark `lineHeight: 104`, so the caption no longer overlaps it.
- `Modules/inbox/api.ts`: `getCounts` fills in defaults for `total`, `byStatus` and `byAssignee`. The inbox list no longer crashes when the payload is missing a map.
- `app/(app)/more/change-password.tsx` and `app/(app)/more/team/invite.tsx`: replaced `contentContainerClassName` with `contentContainerStyle`. The auth screens (`login`, `signup`, `forgot-password`, `accept-invite`) had the same problem with `flex-grow`, fixed the same way.
- `Modules/auth/components/PasswordResetFlow.tsx`: new optional `intro` prop. Change Password passes its own text, so the sentence shows only once.
- `components/brand.tsx`: new `SafeTop` spacer (height = `insets.top`). Home, Calendar and Analytics render it. `app/(app)/_layout.tsx` hides the tab header on Calendar and Analytics, which removes the duplicate title.
- `app/(app)/more/team/index.tsx`: the seats bar is now a plain `View` with a `%` width, replacing `ProgressIndicator`. It was the only place that used `ProgressIndicator`; the component file itself is unchanged.
- `app/(app)/more/notification-preferences.tsx`: switches now have a white thumb (`thumbColor`, plus `activeThumbColor` for web) and use `grey4` for the off track.

**Found, not fixed (needs a decision):**
- **No i18n anywhere.** `i18next` and `react-i18next` are installed, but nothing calls `useTranslation`. The Settings → Language row saves `localePref` to the server, but the UI stays English. The admin PRD says labels support Arabic and English. Adding it means extracting every string and handling RTL, which is several days of work.
- **No suspended-vendor state.** The PRD says a suspended vendor can still log in but can't send messages. The app has no handling for this, and it's unconfirmed which field on `/auth/me` or `/vendor/profile` would carry the status.
- Web-only leftovers: header-right buttons ("Mark all read") sit flush against the right edge, and a library emits a `transform-origin` DOM warning on Profile. Native headers add their own margin, so neither was changed.
- The screenshot pass only covered the first render of each route. Sheets, action sheets, date pickers and multi-step flows were not exercised. DatePicker doesn't render on web anyway.

## Verification actually performed

- The screenshot pass (`scratchpad/shots.js`, Playwright with system Chrome, 390×844, API faked, 25 routes) ran before and after the fixes.
  - Before: Inbox showed "Something went wrong". Every other item in Scope was visible.
  - After: the only console error on any route is the library `transform-origin` warning on Profile. All 8 fixes were checked by eye in the new screenshots.
- `npx tsc --noEmit`: exit 0.
- `npx eslint` on the 16 changed files: no output (0 errors, 0 warnings).
- **Not done:** no iOS or Android run, so the safe-area fix was reasoned from code, not seen on a notched device. No live API. Screens showed mock data, so screens backed by mock data can't reveal bugs that only appear with real payloads.
