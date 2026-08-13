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
