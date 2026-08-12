/**
 * Auth Feature Types
 */

// The real backend's `User` schema (GET /auth/me, login/register data.user):
// { id, email, name, accountType: bride|bridesmaid|vendor, status, createdAt }.
// `phone`/`timezone`/`avatar_url` below are NOT part of that schema — they're
// only ever populated by mockAuthApi (see ./mock.ts), since updateProfile has
// no real backend endpoint yet (see ./api.ts). Kept optional so real login/me
// responses type-check without them.
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

export interface SignupSchemaField {
  key: string;
  type: string;
  labelEn: string;
  labelAr: string;
  required?: boolean;
  min?: number;
  max?: number;
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

// OTP
export interface VerifyOTPRequest {
  email: string;
  otp: string;
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

// Only used by mockAuthApi.checkAuth — the real client calls GET /auth/me
// directly (see liveAuthApi.checkAuth in ./api.ts) and has no `authorized`
// flag; a 401 there is the "not authorized" signal instead.
export interface CheckAuthResponse {
  authorized: boolean;
  user?: User;
  message?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface ResendOTPRequest {
  email: string;
}

export interface ResetPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  timezone?: string;
  avatar?: {
    uri: string;
    name: string;
    type: string;
  };
}
