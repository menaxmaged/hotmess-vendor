/**
 * Push notifications: permission, this device's platform token, and the
 * register/revoke calls. The backend stores raw FCM/APNs tokens (not Expo push
 * tokens), so this uses getDevicePushTokenAsync.
 *
 * Needs, outside this code: `google-services.json` + `android.googleServicesFile`
 * for an Android token, and the Push Notifications capability (APNs) for iOS.
 * Without them registration fails and is skipped — the in-app list still works.
 */
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { notificationsApi } from "./api";

const REGISTERED_TOKEN_KEY = "hotmess_push_token";

if (Platform.OS !== "web") {
  // Show pushes that arrive while the app is open instead of dropping them.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for permission if needed, then registers this device. Resolves quietly when push isn't possible. */
export async function registerPushDevice(): Promise<void> {
  if (Platform.OS === "web" || !Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted && current.canAskAgain) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return;

  const { data: token } = await Notifications.getDevicePushTokenAsync();
  if (typeof token !== "string" || !token) return;

  await notificationsApi.registerDeviceToken(token, Platform.OS === "ios" ? "ios" : "android");
  await SecureStore.setItemAsync(REGISTERED_TOKEN_KEY, token);
}

/** Revokes the token this device registered, so a signed-out phone stops getting the studio's pushes. */
export async function revokePushDevice(): Promise<void> {
  if (Platform.OS === "web") return;
  const token = await SecureStore.getItemAsync(REGISTERED_TOKEN_KEY);
  if (!token) return;
  await SecureStore.deleteItemAsync(REGISTERED_TOKEN_KEY);
  await notificationsApi.revokeDeviceToken(token);
}

/** The backend `deepLink` carried in a push's data payload, if any. */
export function deepLinkFromResponse(response: Notifications.NotificationResponse): string | null {
  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  return typeof data?.deepLink === "string" ? data.deepLink : null;
}
