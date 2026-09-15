# Day 27 — RTL Sweep

> Status: implemented 2026-09-15

## Context

After Day 26 every screen is translated, and on web the Arabic layout mirrors correctly through `dir="rtl"`. The Arabic screenshot passes (Days 22–26) found problems that translation alone doesn't fix:

1. **Direction icons don't flip.** 11 `chevron.left`/`chevron.right` uses: the row-disclosure chevrons, Calendar ‹ › month arrows, the `BackHeader` back chevron and the Home setup nudge. In Arabic they still point the LTR way. iOS uses SF Symbols (`Icon.ios.tsx`), which mirror directional symbols automatically in an RTL layout. Android and web use Material glyphs, which don't.
2. **Web switches in RTL.** The react-native-web `Switch` positions its thumb with physical offsets. In Arabic an "on" thumb sits outside the track and covers the neighbouring label (notification preferences). Switches are also created in 3 different places with 3 copies of the web thumb-colour workaround.
3. **Mixed-direction strings.** LTR values (sizes, money, dates, emails) interpolated into Arabic sentences get reordered by the bidi algorithm (`11.8 MB 100.0 MB من مستخدمة`).
4. **Physical text alignment.** `text-right` on number columns (finance report table, analytics source revenue, ads review rows) doesn't mirror on web. RN native swaps left and right in RTL by default; CSS doesn't.
5. **Crowded preference rows.** The notification-preference channel row is `justify-between` with 3 label+switch pairs; the Arabic "داخل التطبيق" is too long for it.

## Scope

1. `Icon` (web/Android): swap `chevron.left`↔`chevron.right` and `arrow.left`↔`arrow.right` while the UI is RTL. iOS is untouched (SF Symbols mirror themselves).
2. `Toggle`: the single switch component. Brand track colours, white thumb, the web thumb fix, and on web in RTL an LTR-rendered track mirrored with `scaleX(-1)`, so the thumb stays inside and "on" sits at the end (left) edge, like native RTL switches. Notification preferences, the calendar editor and signup booleans use it instead of raw `Switch`.
3. i18n interpolation: in Arabic, wrap every interpolated value in Unicode first-strong isolates (U+2068 … U+2069), so LTR values keep their internal order inside Arabic sentences.
4. `lib/rtl.ts` `textEnd()`: `text-left` on web in RTL, `text-right` otherwise. Used by the 5 number-column sites.
5. Notification-preference channel row: wrap the pairs, and use a shorter Arabic in-app label.

Out of scope, recorded only:
- Decorative absolutely-positioned glow circles and badge dots (`right-*`): harmless either side.
- Header-right buttons flush on web.
- Native RTL (the restart path, SF Symbol mirroring): no device.

## Verification

- `npx tsc --noEmit`, `i18n-parity.js`, eslint on changed files.
- Arabic screenshots: More (chevrons), Calendar (month arrows), Finance (back chevron, report sheet), notification preferences (switches), Profile → Files (storage line), plus English regression shots of the same.

## What was actually built

- **`lib/rtl.ts`** (new):
  - `useIsRTL()`: web follows the UI language, because `dir` flips immediately. Native follows `I18nManager.isRTL`, which only changes after the restart `forceRTL` needs.
  - `textEnd(isRTL)`: returns `text-left` on web in RTL, otherwise `text-right`. RN native already swaps these.
- **`components/nativewindui/Icon/Icon.tsx`** (web and Android): swaps `chevron.left`↔`chevron.right` and `arrow.left`↔`arrow.right` in RTL. This fixes all 11 call sites (row chevrons, Calendar month arrows, `BackHeader`, Home setup nudge) without touching them. `Icon.ios.tsx` is unchanged, since SF Symbols mirror directional glyphs themselves.
- **`components/nativewindui/Toggle.tsx`** is the only switch now:
  - Brand track colours, white thumb, the web `activeThumbColor` fix.
  - On web in RTL, the switch renders LTR inside a `scaleX(-1)` wrapper.
  - Notification preferences, the calendar event editor and signup's boolean fields use it. That removes 3 copies of the web thumb workaround and the now-unused `colors` in preferences.
- **Bidi isolation** (`lib/i18n.ts`): with `interpolation.alwaysFormat` plus `format`, every interpolated string or number in Arabic is wrapped in U+2068…U+2069. Plural selection is unaffected, because it happens before formatting.
- **End-aligned number columns**: finance report table (3 places), analytics source revenue, and the ads review rows use `textEnd(useIsRTL())`.
- **Notification-preference channel row** now wraps (`flex-wrap`, gaps). The Arabic in-app label is shortened to "التطبيق".

Found / changed from plan:
- **Plan wording corrected.** The plan said a mirrored "on" thumb sits at the start edge. The screenshots show the end (left) edge, which is also what native iOS does in RTL. The comment in code was corrected to match.
- **Type rule for the format callback.** i18next's `FormatFunction` must be typed to return `string`. The first `tsc` run failed on `unknown`.
- **Left unchanged, recorded**:
  - Decorative absolute glow circles and badge dots (`right-*`).
  - The `pl-3`/`pr-3` spacing in the automation question input and the signup boolean row. It's asymmetric by a few points only.
  - Header-right buttons flush on web.
  - Email and phone inputs follow RTL alignment (no LTR override).

## Verification actually performed

- `npx tsc --noEmit`: the first run had 1 error (format return type), fixed, then exit 0.
- `i18n-parity.js`: `PARITY OK` (753 `t()` calls).
- `npx eslint` on the 10 changed files: first run had 1 real warning (unused `colors`), fixed. The remaining 3 warnings are the pre-existing `no-named-as-default-member` / unused-disable pattern.
- Arabic screenshots via :8081:
  - **More:** chevrons point left at the row's left end.
  - **Calendar:** the right arrow (previous) points right, the left arrow (next) points left.
  - **Finance:** the back chevron sits at the right and points right.
  - **Notification preferences:** every thumb inside its track; no label overlap; the row fits.
  - **Profile → Files:** the storage line keeps "11.8 MB" and "100.0 MB" intact.
  - **Finance report sheet:** number column end-aligned (left).
- English screenshots: More, Calendar, Finance, Notification preferences unchanged.
- **Not done:** no native run. Android's Material-icon swap follows `I18nManager.isRTL` and was reasoned from code; iOS relies on SF Symbol auto-mirroring (not observed).
