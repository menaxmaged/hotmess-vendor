/**
 * Account Feature Types — /v1/users/me.
 */

export type LocalePref = "en" | "ar";

export interface Me {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  accountType: string;
  status: string;
  localePref: LocalePref | null;
  createdAt: string;
}

/**
 * Self-service fields a vendor account can change. Omitting a key leaves it
 * alone; `null` clears it (the only way to remove a phone number).
 * `partnerName` / `defaultMarketId` are bride fields and not exposed here.
 */
export interface UpdateMeInput {
  name?: string;
  phone?: string | null;
  localePref?: LocalePref | null;
}

/** DELETE /users/me — a 30-day soft delete, not an immediate one. */
export interface AccountDeletion {
  deletedAt: string;
  purgeAt: string;
}
