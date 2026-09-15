/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Auth Feature - API Service
 */

import { api, tokenManager } from "@/lib/api-client";
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

// Every method is a real endpoint. There is no authenticated change-password
// route: changing a password while signed in goes through the same emailed
// code flow (forgot -> verify -> reset), which ends every session. Profile
// fields (name/phone/locale) live in Modules/account (PATCH /users/me).
const liveAuthApi = {
  // Always 204, whether or not the address has an account.
  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/auth/forgot-password", { email });
  },

  // Shares forgot-password's rate-limit budget; invalidates the previous code.
  resendResetCode: async (email: string): Promise<void> => {
    await api.post("/auth/resend-reset-code", { email });
  },

  // Spends the code. Five wrong codes destroy it; unknown/wrong/expired are one 401.
  verifyResetCode: async (
    email: string,
    code: string,
  ): Promise<{ resetToken: string; expiresAt: string }> => {
    const response = await api.post<unknown>("/auth/verify-reset-code", { email, code });
    return unwrapPayload<{ resetToken: string; expiresAt: string }>(response.data);
  },

  // `token` is verify-reset-code's resetToken, not the emailed code. Single-use;
  // bumps tokenVersion, so every open session ends.
  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post("/auth/reset-password", { token, password });
  },

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
