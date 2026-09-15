# Day 16 — Password Reset, Account & Profile Basics

> Status: implemented 2026-09-15

## Context

2026-09-15 re-audit, after days 12–15. Remaining vendor-relevant spec ops with no caller:
- **Password reset** (tag Auth): `POST /v1/auth/forgot-password {email}` (always 204), `POST /v1/auth/resend-reset-code {email}`, `POST /v1/auth/verify-reset-code {email, code: 6 digits}` → `{resetToken, expiresAt}`, `POST /v1/auth/reset-password {token, password ≥8}` (bumps tokenVersion — every session ends). The login screen's "Forgot password?" is `onPress={() => {}}`; Settings → "Change password" is an "isn't wired up" alert. There is **no authenticated change-password route** — the reset flow is the only way.
- **Account** (tag Users): `GET /v1/users/me`, `PATCH /v1/users/me` (self-service `name`, `phone` nullable, `localePref en|ar`), `DELETE /v1/users/me` (30-day soft delete, returns `{deletedAt, purgeAt}`, all tokens dead). Settings' "Delete account" is an "isn't wired up" alert — an App Store requirement left fake. `partnerName`/`defaultMarketId` are bride fields; not exposed.
- **Profile basics**: `PATCH /v1/vendor/profile` (`tagline ≤200`, `bio ≤160`, `startingPriceAmount` minor, `coverImageKey`, `mainCategoryId`; omit = unchanged, null = clear). `Modules/profile` `updateCore`/`uploadCoverImage` are still mock-only (day 2 left them because the cover-upload source was unclear). The spec now documents `POST /files` + `kind=vendor_portfolio` for studio media, returning `storageKey`. `businessName` is not editable.
- **Files**: `GET /v1/files/usage {usedBytes, capBytes}` (render the ratio, never hardcode the cap), `DELETE /v1/files/{id}` (free an upload that was never sent).

Auth module also still carries mock-only `verifyOTP`, `resendOTP`, `resetPassword(current,new)`, `updateProfile` and unused `useLogin`/`useLogout`/`useChangePassword` hooks — none has an endpoint or a caller.

## Scope

1. `Modules/auth`: `forgotPassword`, `resendResetCode`, `verifyResetCode`, `resetPasswordWithToken`; remove the mock-only OTP/profile/change-password stubs and the dead hooks.
2. Shared `PasswordResetFlow` component (email → 6-digit code with resend → new password). Screens: `app/(auth)/forgot-password.tsx` (from login), `app/(app)/more/change-password.tsx` (from Settings, email prefilled, signs out on success since sessions end).
3. New `Modules/account` (`getMe`, `updateMe`, `deleteMe` + hooks). Settings: real email/phone from `GET /users/me`, edit name & phone, language preference, delete account (confirm → DELETE → show purge date → sign out).
4. `Modules/profile`: live `updateCore` → `PATCH /vendor/profile`; live `uploadCoverImage` → `POST /files (vendor_portfolio)` then `PATCH {coverImageKey: storageKey}`. Business name shown read-only.
5. Storage usage bar in the profile Files tab (`GET /files/usage`). Chat attachment send: if the message POST fails after the upload succeeded, `DELETE /files/{id}` to release the quota.

## Verification

- `npx tsc --noEmit`, eslint on changed paths.
- Cross-reference re-run: auth reset (4), users/me (3), vendor/profile PATCH, files usage/delete called.
- `git status --short`.
- No live run.

## What was actually built

- **Password reset** — `Modules/auth/api.ts`: `forgotPassword`, `resendResetCode`, `verifyResetCode` (→ `{resetToken, expiresAt}`), `resetPassword(token, password)`. `Modules/auth/hooks.ts` rewritten to those four mutations. Shared `Modules/auth/components/PasswordResetFlow.tsx` (email → 6-digit code with resend and "use a different email" → new password + confirm, ≥8 chars). Screens: `app/(auth)/forgot-password.tsx` (login's "Forgot password?" now opens it with the typed email prefilled) and `app/(app)/more/change-password.tsx` (email locked to the account, signs out after success because reset ends every session).
- **Removed dead auth code** — `Modules/auth/mock.ts` deleted; mock-only `verifyOTP`/`resendOTP`/`resetPassword(current,new)`/`updateProfile` stubs removed from `liveAuthApi`; unused `useLogin`/`useLogout`/`useChangePassword` hooks removed; the six types only the mock used (`VerifyOTPRequest`, `ResendOTPRequest`, `ResetPasswordRequest`, `UpdateProfileRequest`, `CheckAuthResponse`, `AuthState`) removed.
- **`Modules/account`** (new) — `getMe`/`updateMe`/`deleteMe` + `useMe`/`useUpdateMe`/`useDeleteAccount`, with mock. **Settings rewritten:** name/email/phone from `GET /users/me`; "Edit name & phone" sheet (only changed keys sent, empty phone sends `null` to clear it, updates the auth context user); Language → `localePref` (stored preference only — the app's own UI language isn't switched); Change password → new screen; Delete account → confirm → `DELETE /users/me` → shows the purge date → signs out.
- **`Modules/files`** (new) — `filesApi.upload(file, kind)`, `remove(id)`, `getUsage()`, `resolveFileUrl`, `storageKeyUrl`, `useStorageUsage`. Adopted by inbox (chat attachments), ads (creatives) and profile (supplementary files, cover) — replaces three copies of the FormData/url code.
- **Profile** — `updateCore` → real `PATCH /vendor/profile` (tagline/bio/startingPriceAmount; empty strings clear to `null`); `uploadCoverImage` → `POST /files (vendor_portfolio)` then `PATCH {coverImageKey: storageKey}`. Both re-read the profile. `ProfileTab`: business name read-only with an explanation, tagline/bio `maxLength` 200/160 (column limits), success/error alerts.
- **Files tab** — storage usage bar from `GET /files/usage` (refetched after upload/delete), picker limited to the five MIME types the server accepts (was `image/*`, which lets HEIC through to a 415), upload error alert.
- **Chat attachments** — if the message POST fails after the upload succeeded, `DELETE /files/{id}` releases the quota.

**Changed from plan / found:**
- **Bug fixed (would have hit day 16's own flow):** `lib/api-client.ts`'s response interceptor removed the token and redirected to login on *every* 401. `verify-reset-code` answers a wrong code with 401, so a signed-in user mistyping a code in Change password would have been logged out, and a signed-out user would have been bounced off the forgot-password screen. The interceptor now skips `/auth/login`, `/auth/verify-reset-code` and `/auth/reset-password`.
- **Bug fixed:** profile `coverImageUrl` was set to the raw `coverImageKey` (a storage key, not a URL), so a real cover could never render. Now `storageKeyUrl()` → `<origin>/uploads/<key>`, per the files route docs.
- Typed routes reject object-form `router.push({pathname,...})` for a route that isn't in the generated route types yet; used a string href with a query instead.
- `localePref` is persisted server-side but the app has no runtime language switch wired to it — out of scope.

**Left as-is (pre-existing, not in touched lines):** eslint warnings for unused `eslint-disable` directives in `Modules/auth/api.ts:1`, `Modules/auth/context.tsx:147`, `lib/api-client.ts:6`, and `import/no-named-as-default-member` on `axios.create` in `lib/api-client.ts`.

## Verification actually performed

- `npx tsc --noEmit` — first run: 1 error (TS2352, object-form `router.push` cast in `login.tsx`); fixed; second run exit 0.
- `npx eslint lib Modules/{auth,account,files,notifications,profile,inbox,ads} "app/(auth)" "app/(app)/more" "app/(app)/index.tsx"` — 0 errors, 4 pre-existing warnings (listed above). `npx eslint "app/(auth)"` after the fix — exit 0.
- Cross-reference script extended to also parse `apiFormData.*` / `apiClient.*` calls, re-run: vendor-relevant uncalled ops are now **only** `POST /notifications/device-tokens` and `DELETE /notifications/device-tokens/{id}`.
- `git status --short` — new: `Modules/{account,files}/`, `Modules/auth/components/`, `app/(auth)/forgot-password.tsx`, `app/(app)/more/change-password.tsx`; modified: auth api/hooks/types, profile api/ProfileTab/FilesTab, inbox api, ads api, settings, login, both layouts, `lib/api-client.ts`; deleted: `Modules/auth/mock.ts`.
- **Not done:** no device run, no real email/code round-trip, no real account deletion (irreversible against a real account — would need a throwaway vendor account).
