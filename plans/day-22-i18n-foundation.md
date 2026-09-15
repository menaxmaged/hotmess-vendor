# Day 22 — i18n Foundation (Arabic / English, RTL)

> Status: implemented 2026-09-15

## Context

The admin PRD says the vendor app is bilingual: "vendor-facing field label (supports Arabic and English)", and CMS content is edited in both languages. Day 20 found the app has no i18n at all:
- `i18next` 23 and `react-i18next` 14 are installed, but nothing calls `useTranslation`.
- `expo-localization` is installed but unused.
- Settings → Language saves `localePref` (`en` | `ar`) through `PATCH /users/me`, but the UI stays English.

The backend is already bilingual:
- Every response carries `message_en` and `message_ar`.
- Onboarding checklist items have `labelAr` and `descriptionAr`.
- Ad placements, vendor categories, cities, occasion types and markets have `nameAr`.
- The spec has no `Accept-Language` header, so the client picks the field itself.

Around 680 UI strings sit in `.tsx` files and about 80 in module `.ts` files. That's too much for one day, so the work is split:

| Day | Scope |
|---|---|
| 22 | Foundation plus the app shell: i18n setup, language switching, RTL, localized API errors and content fields, date and number formatting. Strings for auth screens, tab bar, More, Settings, Change Password. |
| 23 | Inbox list plus chat detail (the largest file, ~1000 lines) and `Modules/inbox` status labels. |
| 24 | Home, Calendar, Analytics, Finance. |
| 25 | More sub-screens: Ads, Automation, Team and Roles, Profile tabs, Premium, Notifications and preferences, Saved Replies, Checklist, Invite. Then an Arabic RTL screenshot sweep of every route. |
| 26 | Suspended / pending / delisted studio state. |

## Scope (this day)

1. **`lib/i18n.ts`**:
   - Set up i18next with `en` and `ar` resources under `locales/{en,ar}/*.json`, one namespace per area.
   - Pick the starting language from, in order: stored choice, then device language (`expo-localization`), then `en`.
   - Missing keys fall back to English.
2. **Language switching** (`lib/i18n.ts` `setAppLanguage`):
   - Persist the choice locally (SecureStore, or localStorage on web).
   - Call `i18n.changeLanguage`.
   - Apply direction. Web: `document.documentElement.dir` and `lang`. Native: `I18nManager.allowRTL` and `forceRTL`, which need an app restart, so tell the user.
   - Settings → Language calls it after the server save succeeds.
   - After sign-in, align with the server's `localePref` when it is set.
3. **Localized content helpers** (`lib/localized.ts`):
   - `pickLocalized(obj, 'label')` returns `labelAr` when Arabic and non-empty, else `label`.
   - `getErrorMessage` prefers `message_ar` in Arabic.
4. **Formatting**: `lib/format.ts` and every hard-coded `toLocaleDateString('en-GB')` use the active locale (`ar-EG` / `en-GB`). Digits stay Latin (`-u-nu-latn`), matching EGP amounts and phone numbers.
5. **Strings**: auth (welcome, login, signup, forgot password and `PasswordResetFlow`, accept invite), the tab bar, More, Settings, Change Password.

## Verification

- `npx tsc --noEmit`; eslint on changed files.
- A JSON key-parity script: every `en` key has an `ar` key and the reverse; every `t('…')` key used in code exists in `en`.
- Web screenshots of the translated screens in both `en` and `ar`, checking RTL layout.
- No native run (RTL restart path untested on device).

## What was actually built

- **`lib/i18n.ts`** (new):
  - i18next with typed resources from `locales/`. Missing keys fall back to `en`.
  - The starting language comes from: stored choice (localStorage on web, SecureStore on native) → on native, `I18nManager.isRTL` (RN persists `forceRTL`, so a cold start after choosing Arabic is already RTL, with no flash of English) → device language via `expo-localization` → `en`.
  - `setAppLanguage()` saves the choice, changes the language, and sets `dir`/`lang` on `<html>` for web. On native it calls `allowRTL`/`forceRTL` and returns whether a restart is still needed.
  - Also exports `storedLanguage()`, `currentLanguage()`, and `localeTag()` (`ar-EG-u-nu-latn` / `en-GB`: Latin digits in both).
- **`locales/`** (new): `en` and `ar` for `common`, `auth` and `more`.
  - `ar` files are typed `Translation<typeof en>`, so a key missing in Arabic fails `tsc`.
  - `i18next.d.ts` types `t('ns:key')` against the English files, so an unknown key fails `tsc` too.
  - Arabic has the extra plural forms.
- **`lib/localized.ts`** (new): `pickLocalized(row, field)` returns `<field>Ar` in Arabic when it's non-empty. Not yet used by a screen; Days 24–25 use it for checklist, placement and category names.
- **`lib/api-client.ts`**: `getErrorMessage` prefers `message_ar` in Arabic, and the HTTP-status fallbacks now use `common:errors.*`.
- **`lib/format.ts`**: dates use `localeTag()`, and the short relative times ("5m", "2h") are translated.
- **Strings moved to `t()`**:
  - welcome, login, forgot password, `PasswordResetFlow` (now takes an optional `intro`), accept invite
  - signup, including validation messages in `signup-form.ts`; schema text now uses `labelAr`/`titleAr`/`helpAr` in Arabic
  - tab bar, More, Settings, Change Password, and the More, Team and tab stack titles
  - auth context errors
- **Settings → Language** now switches the app language right away, so it works offline, then saves `localePref`. On native it alerts that a restart is needed to flip direction.
- **`app/(app)/_layout.tsx`**: when the account's `localePref` differs from the current language, it applies it, but only if this device has no saved choice. A first version applied the server value every time, which would have undone a local switch before the save landed and forced English in mock mode.
- **More menu**: the amber badge style came from comparing `badge === 'Premium'`, which breaks once the label is translated. It now uses a `highlight` flag.
- **`components/nativewindui/Text.tsx`**: `letterSpacing: 0` while in Arabic. Found in the Arabic screenshots: `tracking-*` eyebrow labels pulled the joined letters apart (the welcome tagline).

Not done / flags:
- **Arabic copy is my translation.** It needs a review by a native speaker, especially brand-voice lines (the lowercase display headings) and the status vocabulary.
- **The Fraunces display font has no Arabic glyphs.** Arabic headings fall back to the system font. That is fine but off-brand; an Arabic display face is a design decision.
- Physical-direction classes (`ml-`/`mr-`/`left-`/`right-`/`text-left`, 22 uses) and `chevron.right` icons (11) are not flipped yet. RN native swaps left and right in RTL by default; web doesn't. This is part of Day 25's RTL sweep.
- The native RTL restart path is untested on a device.
- Phone number inputs follow RTL alignment in Arabic. They should probably stay LTR (Day 25).

## Verification actually performed

- `npx tsc --noEmit`: exit 0. The first run failed on a duplicate `useTranslation` import left by a partially applied script (it aborted on a `’` escape mismatch). Fixed, then clean.
- `node scratchpad/i18n-parity.js` (reads the TS locale files, compares keys and `{{vars}}` between `en` and `ar`, and checks every `t('…')` key in code exists): `PARITY OK`. 174 English keys, 175 `t()` calls. Arabic's 12 extra keys are all plural forms.
- `npx eslint` on all changed files: 0 errors. Warnings are pre-existing unused disables plus `import/no-named-as-default-member` on `i18n.use`/`changeLanguage`, the same pattern as the existing axios warning.
- Web screenshots (`SHOT_LANG=ar` / `en`, 10 routes each):
  - **Arabic:** mirrored layout, reversed tab bar, right-aligned headers, translated auth/More/Settings/Change Password, funnel bars filling from the right. The tagline letter-spacing bug was found here.
  - **English:** identical to before (login, More, Settings checked).
- **Letter-spacing fix verified later** (Day 24 screenshot pass, taken on the already-running Expo server on :8081): the Arabic welcome tagline now renders as joined text.
- **Not done:** no native run.
