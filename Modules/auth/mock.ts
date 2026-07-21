/**
 * Auth Feature - Mock Data
 */

import { tokenManager } from "@/lib/api-client";
import { mockDelay } from "@/lib/mock-utils";
import type {
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

const MOCK_USER: User = {
  id: "mock-vendor-1",
  name: "Amira Studio",
  role: "ADMIN",
  email: "vendor@hotmess.dev",
  phone: "+20 100 000 0000",
  timezone: "Africa/Cairo",
};

export const mockAuthApi = {
  register: async (_data: RegisterRequest): Promise<RegisterResponse> => {
    await mockDelay();
    return { message_en: "Account created" };
  },

  verifyOTP: async (_data: VerifyOTPRequest) => {
    await mockDelay();
    return { success: true };
  },

  resendOTP: async (_data: ResendOTPRequest) => {
    await mockDelay();
    return { success: true };
  },

  login: async (_credentials: LoginCredentials): Promise<LoginResponse> => {
    await mockDelay();
    const token = "mock-token";
    await tokenManager.set(token);
    return { user: MOCK_USER, token, message: "Logged in" };
  },

  checkAuth: async (): Promise<User | null> => {
    await mockDelay(150);
    const token = await tokenManager.get();
    return token ? MOCK_USER : null;
  },

  resetPassword: async (_data: ResetPasswordRequest) => {
    await mockDelay();
    return { success: true };
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    await mockDelay();
    return {
      ...MOCK_USER,
      phone: data.phone ?? MOCK_USER.phone,
      timezone: data.timezone ?? MOCK_USER.timezone,
    };
  },

  logout: async (): Promise<void> => {
    await mockDelay(100);
    await tokenManager.remove();
  },
};
