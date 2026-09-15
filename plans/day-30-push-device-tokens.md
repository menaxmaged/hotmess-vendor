# Day 30 — Push Notifications (Device Tokens)

> Status: implemented 2026-09-15 (code only — real push blocked on Firebase/APNs credentials)

## Context

Day 15 built in-app notifications (list, badge, read state, per-channel preferences). It left push unwired, because the app had no `expo-notifications` dependency. The preferences screen already lets a vendor toggle "Push" per type, but no device ever registers, so those toggles do nothing.

Spec:
- `POST /v1/notifications/device-tokens` with `{ token, platform: ios|android|web }` → 201. Called on launch. It upserts on the token, so a device that switches accounts moves to the new account; a revoked token comes back live.
- `DELETE /v1/notifications/device-tokens/{id}`: `{id}` is **the token itself**. Revokes on logout; an unknown or already-revoked token returns 404.
- The example token is a raw platform token (FCM/APNs), not an Expo push token, so the app sends `getDevicePushTokenAsync()`.
- Notifications carry `deepLink` (Day 15/21 `openDeepLink` already maps backend paths to app routes).

Environment facts:
- `expo-notifications` ~57.0.19 was installed with `npx expo install`.
- There's no `google-services.json` (Android FCM) and no `eas.json`/project id.
- `ios/` and `android/` are generated and gitignored, so native config goes through the `app.json` plugin and a rebuild.

## Scope

1. `app.json`: add the `expo-notifications` plugin.
2. `Modules/notifications`:
   - `registerDeviceToken(token, platform)` and `revokeDeviceToken(token)` (live + mock).
   - `push.ts`: permission request, native device token, Android default channel. Skip on web and simulators (`expo-device`); fail silently.
3. `app/(app)/_layout.tsx`: register once per signed-in session. Remember the registered token locally, so logout can revoke it.
4. `Modules/auth/context.tsx` `logout`: revoke the remembered token, best-effort and before the auth token is cleared, alongside the existing server logout.
5. Tapping a push (foreground or cold start) follows its `deepLink` via `openDeepLink`. It also invalidates the notification list and unread count.
6. Foreground handler shows the banner, so a push that arrives while the app is open isn't swallowed.

Out of scope, recorded as blockers:
- **Android.** Needs `google-services.json` from the Firebase project, plus `android.googleServicesFile` in `app.json`. Without it, `getDevicePushTokenAsync` throws on Android, and registration is skipped.
- **iOS.** Needs the Push Notifications capability/APNs key in the Apple developer account, and a dev-client rebuild (`npx expo prebuild` / EAS).
- Server-side sending (backend).

## Verification

- `npx tsc --noEmit`, eslint, `i18n-parity.js` (no new copy expected).
- Web: the app loads with no push errors (push is skipped on web).
- Mock mode: register and revoke calls are logged through the mock.
- **Not possible here:** a real token or a received push. That needs a device build and the Firebase/APNs credentials.

## What was actually built

- **`package.json`**: `expo-notifications ~57.0.19` (via `npx expo install`). **`app.json`**: the `expo-notifications` plugin.
- **`Modules/notifications/api.ts`** (+ mock): `registerDeviceToken(token, platform)` → `POST /notifications/device-tokens`; `revokeDeviceToken(token)` → `DELETE /notifications/device-tokens/{token}` (the path id is the token, URL-encoded).
- **`Modules/notifications/push.ts`**:
  - A foreground handler (banner and list, no sound or badge).
  - `registerPushDevice()`: skips web and simulators; creates the Android `default` channel; asks for permission only if it's allowed to ask again; takes `getDevicePushTokenAsync()` (the raw FCM/APNs token the backend expects); registers it; stores it in SecureStore.
  - `revokePushDevice()`: revokes and forgets the stored token.
  - `deepLinkFromResponse()`.
- **`Modules/notifications/components/PushBridge.tsx`**: mounted by the signed-in tab layout on native. Registers once per session. Follows a tapped push's `deepLink` through `openDeepLink`, including a cold start, via `useLastNotificationResponse` (deduplicated by notification id). Refreshes the notification list and badge when a push arrives or is tapped.
- **Web stubs**: `push.web.ts` and `PushBridge.web.tsx` keep `expo-notifications` out of the web bundle.
- **`Modules/auth/context.tsx` `logout`**:
  - Revokes the push token, then calls server logout, then clears the local auth token and user cache (in that order, in the background). Local sign-out still happens immediately.
  - **Bug fixed along the way:** the old code removed the auth token in the same tick as `authApi.logout()`, so the logout request could go out unauthenticated.

Found / changed from plan:
- **Web warning.** Importing `expo-notifications` on web logs "Listening to push token changes is not yet fully supported on web" on every page load, because `context.tsx` imports `push.ts`. Added the `.web` stubs. The Expo dev server on :8081 (not started by this session) kept serving the pre-stub modules, which the bundle inspection confirmed. A fresh `--clear` server on :8089 served the stubs, and the warning was gone.
- **Credentials (still required, not code):**
  - **Android:** `google-services.json` from the Firebase project, plus `"android": { "googleServicesFile": "./google-services.json" }` in `app.json`. Without it `getDevicePushTokenAsync` throws on Android, and registration is skipped silently.
  - **iOS:** the Push Notifications capability / APNs key on the Apple developer account, then a dev-client rebuild (`npx expo prebuild` or EAS). `ios/` and `android/` are generated and gitignored.
  - **Backend:** sending pushes with its FCM/APNs credentials.

## Verification actually performed

- `npx tsc --noEmit`: exit 0, before and after the web stubs.
- `npx eslint Modules/notifications "app/(app)/_layout.tsx" Modules/auth/context.tsx`: 0 errors; 1 warning, the pre-existing unused `eslint-disable` in `context.tsx`.
- Web smoke test (fresh :8089, `--clear`): `/`, `/welcome`, `/more/notifications` all load with no console errors or warnings.
- **Not done / not possible here:** no device build, so there's no real token, permission prompt, received push, tap deep link, or logout revoke on a device. The mock register/revoke paths are type-checked but weren't exercised (they only run on a physical device).
