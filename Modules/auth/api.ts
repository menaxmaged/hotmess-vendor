/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Auth Feature - API Service
 */

import { api, tokenManager } from "@/lib/api-client";
import { mockAuthApi } from "./mock";
import type { LoginCredentials, LoginResponse, SignupSchema, User, VendorSignupRequest } from "./types";

const unwrapPayload = <T>(payload: unknown, key?: string): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const container = payload as Record<string, unknown>;
    if (key && container[key] !== undefined) {
      return container[key] as T;
    }

    const nested = container.data ?? container.item ?? container.result;
    if (nested !== undefined) {
      return nested as T;
    }

    return container as T;
  }

  return payload as T;
};

// login/checkAuth/logout/register/getSignupSchema call the real backend
// unconditionally. Everything else below stays on mockAuthApi — the real
// backend still has no matching endpoint for a vendor account to use:
//   - There are no OTP verify/resend endpoints — only a 3-step forgot-password
//     flow (forgot-password -> verify-reset-code -> reset-password), which is
//     a different concept from this module's current resetPassword(currentPw,
//     newPw) and has no UI screen calling it anyway.
//   - There is no authenticated change-password endpoint.
//   - There is no vendor profile-update endpoint; PATCH /v1/users/me is
//     bride-shaped (name/partnerName/phone/localePref/defaultMarketId) and
//     has no avatar/dateOfBirth/gender fields this module sends.
const liveAuthApi = {
  verifyOTP: mockAuthApi.verifyOTP,
  resendOTP: mockAuthApi.resendOTP,
  resetPassword: mockAuthApi.resetPassword,
  updateProfile: mockAuthApi.updateProfile,

  // POST /vendor/signup creates the studio and signs the caller in, single
  // call — no separate login round-trip needed afterward.
  register: async (data: VendorSignupRequest): Promise<LoginResponse> => {
    const response = await api.post<unknown>("/vendor/signup", data);
    const result = unwrapPayload<LoginResponse>(response.data);
    if (result?.token) tokenManager.set(result.token);
    return result;
  },

  getSignupSchema: async (): Promise<SignupSchema> => {
    const response = await api.get<unknown>("/vendor/signup-schema");
    return unwrapPayload<SignupSchema>(response.data);
  },

  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<unknown>("/auth/login", credentials);
    const loginData = unwrapPayload<LoginResponse>(response.data);
    const token = loginData?.token;

    if (token) {
      tokenManager.set(token);
    }

    return loginData;
  },

  // Real backend has no /auth/check + {authorized,user} shape — GET /auth/me
  // returns { user, subscription } directly and 401s when the token is bad,
  // which api-client's response interceptor already turns into a rejected
  // promise (and clears the token / redirects to login). We just need to
  // turn "rejected" into "null" here so callers keep their existing contract.
  checkAuth: async (): Promise<User | null> => {
    try {
      const response = await api.get<unknown>("/auth/me");
      const result = unwrapPayload<{ user: User }>(response.data);
      return result?.user ?? null;
    } catch {
      return null;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenManager.remove();
    }
  },
};

export const authApi = liveAuthApi;
