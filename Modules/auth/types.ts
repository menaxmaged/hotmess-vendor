/**
 * Auth Feature Types
 */

// The real backend's `User` schema (GET /auth/me, login/register data.user):
// { id, email, name, accountType: bride|bridesmaid|vendor, status, createdAt }.
// `phone` is refreshed from GET /users/me after an edit in Settings
// (Modules/account); `timezone`/`avatar_url` aren't in the schema. Optional so
// real login/me responses type-check without them.
export interface User {
  id: number | string;
  name: string;
  accountType?: "bride" | "bridesmaid" | "vendor" | string;
  email: string;
  avatar_url?: string;
  avatarUrl?: string;
  phone?: string | null;
  timezone?: string;
  preferences?: any;
  status?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionBlock {
  plan: string | null;
  status: "trialing" | "active" | "grace" | "cancelled" | "expired";
  trialEndsAt?: string | null;
  graceEndsAt?: string | null;
}

// POST /vendor/signup — creates a studio + signs the caller in, single call.
// Returns the same {user, token, subscription} shape as login (see AuthResult
// in the OpenAPI spec), so `register` reuses LoginResponse below.
export interface VendorSignupRequest {
  businessName: string;
  contactPersonName: string;
  email: string;
  whatsapp: string;
  password: string;
  /** Answers to the published signup schema, keyed by field key. */
  answers?: Record<string, unknown>;
}

export type SignupFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "url"
  | "number"
  | "boolean"
  | "select"
  | "multiselect";

export interface SignupFieldOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

/**
 * Only `equals` appears in the spec's example; the others are accepted
 * defensively. Unknown operators leave the field visible (see signup-form.ts).
 */
export interface SignupVisibleClause {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: unknown[];
  notIn?: unknown[];
}

export interface SignupSchemaField {
  key: string;
  type: SignupFieldType;
  labelEn: string;
  labelAr: string;
  helpEn?: string;
  helpAr?: string;
  required?: boolean;
  /** Characters, value or selections, depending on `type`. */
  min?: number;
  max?: number;
  /** Required for select/multiselect, absent otherwise. */
  options?: SignupFieldOption[];
  /** One clause or an ANDed array; only references EARLIER fields. */
  visibleWhen?: SignupVisibleClause | SignupVisibleClause[];
}

export interface SignupSchemaStep {
  key: string;
  titleEn: string;
  titleAr: string;
  fields: SignupSchemaField[];
}

export interface SignupSchema {
  version: number;
  publishedAt: string | null;
  steps: SignupSchemaStep[];
}

// Login
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  message_en?: string;
  message_ar?: string;
  user: User;
  token: string;
  subscription?: SubscriptionBlock;
}

