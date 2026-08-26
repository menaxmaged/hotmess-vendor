/**
 * Saved Replies Feature Types
 *
 * Premium — the READ is gated too, not just create: a lapsed studio keeps
 * its saved replies (cancellation is non-destructive) but can't go on using
 * them, so `GET /vendor/saved-replies` itself answers 403 `upgrade_required`
 * on Free/lapsed rather than an empty list.
 */

export interface SavedReply {
  id: string;
  title: string;
  body: string;
}

export interface CreateSavedReplyInput {
  title: string;
  body: string;
}
