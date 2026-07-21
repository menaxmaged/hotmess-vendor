/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Auth Feature - API Service
 */

import { api, apiFormData, tokenManager, USE_MOCK_DATA } from "@/lib/api-client";
import { mockAuthApi } from "./mock";
import type {
    CheckAuthResponse,
    LoginCredentials,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ResendOTPRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    User,
    VerifyOTPRequest,
} from "./types";

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

const liveAuthApi = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<any>("/auth/register", data);
    return response.data;
  },

  verifyOTP: async (data: VerifyOTPRequest): Promise<any> => {
    const response = await api.post("/auth/verify-otp", data);
    return response.data;
  },

  resendOTP: async (data: ResendOTPRequest): Promise<any> => {
    const response = await api.post("/auth/resend-otp", data);
    return response.data;
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

  checkAuth: async (): Promise<User | null> => {
    const response = await api.get<unknown>("/auth/check");
    const result = unwrapPayload<CheckAuthResponse>(response.data);
    return result?.authorized ? (result.user ?? null) : null;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<any> => {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const formData = new FormData();

    if (data.firstName) formData.append("firstName", data.firstName);
    if (data.lastName) formData.append("lastName", data.lastName);
    if (data.phone) formData.append("phone", data.phone);
    if (data.dateOfBirth) formData.append("dateOfBirth", data.dateOfBirth);
    if (data.gender) formData.append("gender", data.gender);
    if (data.timezone) formData.append("timezone", data.timezone);
    if (data.avatar) {
      formData.append("avatar", data.avatar as any);
    }

    const response = await apiFormData.put<unknown>("/auth/profile", formData);
    return unwrapPayload<User>(response.data);
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenManager.remove();
    }
  },
};

export const authApi: typeof liveAuthApi = USE_MOCK_DATA ? mockAuthApi : liveAuthApi;
