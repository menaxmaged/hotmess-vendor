/**
 * Instagram Feature Types
 *
 * Split out of Modules/profile on 2026-08-13 — Instagram is a top-level
 * backend resource (`/vendor/instagram`) with a real OAuth-code-exchange
 * connect flow, not the toggle the old profile-embedded mock modeled.
 */

export interface InstagramConnection {
  connected: boolean;
  igUserId: string | null;
  lastSyncAt: string | null;
  disconnectedAt: string | null;
  /** Whether the platform holds Meta credentials at all — `false` means `connect` will 503 regardless of what the vendor does. */
  configured: boolean;
}

export interface ConnectInstagramInput {
  code: string;
  redirectUri: string;
}

export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export interface InstagramPost {
  id: string;
  mediaType: InstagramMediaType;
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string;
  caption: string | null;
  timestamp: string;
}

// GET /vendors/{id}/instagram-posts — a different resource than
// /vendor/instagram (bride-facing "Vendors" tag, shared with the bride app's
// directory view; the vendor just happens to be allowed to call it for their
// own id too). "Every ordinary absence is a 200 with connected:false" per
// the live spec, so this never throws for "not connected" — only for actual
// errors (auth, network, or the 403 upgrade_required this route can answer).
export interface InstagramGrid {
  connected: boolean;
  posts: InstagramPost[];
  cached: boolean;
}
