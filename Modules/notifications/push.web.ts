/**
 * Web build of `push.ts`. The backend accepts `platform: "web"`, but this app
 * doesn't do web push; keeping expo-notifications out of the web bundle also
 * stops its "push token listener isn't supported on web" warning on every load.
 */
export async function registerPushDevice(): Promise<void> {}

export async function revokePushDevice(): Promise<void> {}

export function deepLinkFromResponse(): string | null {
  return null;
}
