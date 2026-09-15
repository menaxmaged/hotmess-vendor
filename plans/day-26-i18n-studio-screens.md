# Day 26 — i18n: Studio Screens (Profile, Team, Notifications, Saved Replies, Checklist)

> Status: implemented 2026-09-15

## Context

The last English UI after Day 25 is in the "studio" screens:
- **Profile:** `app/(app)/more/profile.tsx` and its 6 tabs (`Modules/profile/components/*`).
- **Team:** `team/index.tsx`, `team/role/[id].tsx`, `team/invite.tsx`.
- **Notifications:** `notifications.tsx`, `notification-preferences.tsx`.
- **Other:** `saved-replies.tsx`, `onboarding-checklist.tsx`.

Reading them for extraction turned up real UI bugs, not just strings:

1. **Silent saves.** Booking rules, categories and coverage call `mutate()` without `onSuccess`/`onError`. The button flips back from "Saving…" with no confirmation, and a failed save shows nothing.
2. **Unconfirmed destructive action.** Supplementary files delete on a single tap of the trash icon. Packages already confirm first.
3. **Developer jargon shown to vendors**:
   - Instagram: "isn't fully set up on this build yet — missing the app client ID / the backend's Meta app registration. The button below will show a clear error rather than pretend to connect."
   - Invite: "WhatsApp delivery isn't live yet on the backend".
   - The connected Instagram card title is `IG user 17841400000000000` (a raw Graph id).
4. **Web teal switch thumb** in the shared `components/nativewindui/Toggle.tsx`, used by the role editor. This is the same bug as Days 20 and 24.
5. **Checklist ignores Arabic text**: it renders `labelEn`/`descriptionEn` even though the API sends `labelAr`/`descriptionAr`.

## Scope

1. `locales/{en,ar}/studio.ts` (new namespace) for all 13 files.
2. Fix bugs 1–5: success and error alerts on the 3 saves, a confirm before file delete, plain-language copy, `activeThumbColor` in `Toggle`, `pickBilingual` for the checklist and for profile category/city/occasion chips.
3. Built-in role names, `completenessMissing` hints, notification titles and bodies, and file `kind` values come from the server as-is (not translated here).

## Verification

- `npx tsc --noEmit`, `i18n-parity.js`, eslint on changed files.
- Arabic and English screenshots: Profile (all tabs), Team, role editor, invite, notifications, preferences, checklist.
- Grep for leftover hard-coded English JSX text across `app/` and `Modules/**/components`.
- No native run.

## What was actually built

- **`locales/{en,ar}/studio.ts`**: 201 English keys.
  - Profile tabs, profile, categories, booking, instagram, files, account, team, role, invite, notifications, preferences (all 13 types), saved replies, checklist.
  - Arabic adds the member-count plural forms.
- **13 files moved to `t()`**:
  - `more/profile.tsx`: `TABS` became a key list.
  - The 6 profile tabs.
  - `team/index.tsx`, `team/role/[id].tsx` (groups, access levels, permission toggles), `team/invite.tsx`.
  - `notifications.tsx`, `notification-preferences.tsx` (`LABELS` became a key list plus type guard).
  - `saved-replies.tsx`, `onboarding-checklist.tsx`.
- **`components/brand.tsx` `ErrorState`**: "Try again" translated. The leftover-English scan found it; it's the retry on Calendar, Analytics, Finance, Ads and Notifications.
- **Bugs fixed**:
  1. **Silent saves.** Booking rules, categories and coverage now alert "Saved" / "Save failed" with the server message.
  2. **Unconfirmed destructive action.** Supplementary files ask before deleting, like packages already did.
  3. **Jargon removed.**
     - The Instagram build-config note (client ID / Meta app registration) is now "Connecting Instagram isn't available yet…".
     - The raw `IG user <graph id>` title is now "Instagram account connected".
     - The WhatsApp invite "isn't live yet on the backend" note is now "coming soon… will reach them by email".
  4. **Web teal switch thumb** fixed in the shared `Toggle`.
  5. **Checklist, category/subcategory, city and occasion chips** use `labelAr`/`descriptionAr`/`nameAr` via `pickBilingual`. The first mock checklist item shows its Arabic label.

Found / changed from plan:
- **Leftover-English scan.** It covered `app/`, `Modules/**/components` and `components/`, with JSX text, string props, `Alert.alert` literals, and `label/title/text:` object literals. 5 hits: `ErrorState` "Try again" (fixed), and 4 intentional ones: the `teammate@studio.com` placeholder, the native-script "English" language label, and 2 comments in `+html.tsx`. A first, looser version matched code lines and was discarded.
- **New RTL problems, carried into Day 27**:
  - On web, notification-preference switches in Arabic push their thumb outside the track and cover the channel labels.
  - "In-app" in Arabic is long enough to crowd the row.
  - Mixed LTR numbers and units inside Arabic sentences render out of order (`11.8 MB 100.0 MB من مستخدمة`).
- **Still English because the server sends it**: built-in role names (Owner, Sales…), profile-completeness hints, notification titles and bodies, file `kind` values, and mock checklist items without `labelAr`.

## Verification actually performed

- `npx tsc --noEmit`: exit 0 (Day 26 script and the `ErrorState` follow-up).
- `i18n-parity.js`: 10 namespaces, 753 `t()` calls, `PARITY OK`.
- `npx eslint "app/(app)/more" Modules/profile/components components/nativewindui/Toggle.tsx components/brand.tsx locales`: clean.
- `flows.js` (English):
  - `booking-save` now records `alert: Saved — Your booking rules have been saved.`
  - `categories-save` records `alert: Saved — Your categories have been saved.`
  - Before this day, neither save produced any feedback.
- Arabic screenshots via :8081: Profile, Team, Invite, Notifications, Notification preferences, Checklist, Saved replies (locked); the Categories/Booking/Instagram profile tabs (Instagram shows the new "حساب إنستجرام متصل" title); the new-role editor.
- English screenshots (Profile, Team) unchanged.
- **Not done:** no native run. The file-delete confirm wasn't clicked through; its code path mirrors the package confirm.
