/**
 * Instagram OAuth - authorize-redirect + code capture
 *
 * BLOCKED on external configuration this pass: a real Meta/Instagram App ID
 * has to be registered with Meta and set as `EXPO_PUBLIC_INSTAGRAM_CLIENT_ID`
 * before this can complete an actual handshake — there is no such app
 * registered anywhere in this codebase or its env, and the live backend's own
 * `GET /vendor/instagram` currently reports `configured: false`, meaning even
 * a perfect client-side flow 503s today. This is the same shape of gap as day
 * 5's missing payment-provider SDK: the plumbing is real and correct, the
 * external credential is not ours to invent. See day-07-instagram.md.
 */

import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { ConnectInstagramInput } from "./types";

const CLIENT_ID = process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_ID ?? "";

// Instagram Login's own product scope — unconfirmed against whatever product
// (Instagram Login vs. legacy Basic Display) the backend's Meta app actually
// registers under. Whoever sets up the Meta app needs to confirm/adjust this.
const SCOPE = "instagram_business_basic";

export const isInstagramOAuthConfigured = (): boolean => CLIENT_ID.length > 0;

/**
 * Opens the Instagram authorize dialog and waits for the redirect back into
 * this app. Returns the {code, redirectUri} pair `connect()` needs, or `null`
 * if the vendor cancelled/dismissed the dialog.
 */
export const startInstagramOAuth = async (): Promise<ConnectInstagramInput | null> => {
  if (!CLIENT_ID) {
    throw new Error(
      "Instagram isn't configured yet — no EXPO_PUBLIC_INSTAGRAM_CLIENT_ID is set.",
    );
  }

  const redirectUri = Linking.createURL("instagram-callback");
  const authorizeUrl =
    "https://api.instagram.com/oauth/authorize" +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(SCOPE)}` +
    "&response_type=code";

  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri);
  if (result.type !== "success" || !result.url) return null;

  const code = Linking.parse(result.url).queryParams?.code;
  if (!code || typeof code !== "string") return null;

  return { code, redirectUri };
};
