/**
 * Auth Feature - Hooks
 *
 * Sign-in/sign-out go through `useAuth()` (./context). These cover the
 * emailed-code password reset, which is also the only way to change a
 * password while signed in.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { authApi } from "./api";
import type { LoginResponse, SignupSchema, VendorSignupRequest } from "./types";

export const useForgotPassword = () =>
  useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });

export const useResendResetCode = () =>
  useMutation({
    mutationFn: (email: string) => authApi.resendResetCode(email),
  });

export const useVerifyResetCode = () =>
  useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      authApi.verifyResetCode(email, code),
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
  });

/** The published form. `null` when nothing is published yet (404) — sign-up is then step 1 only. */
export const useSignupSchema = () =>
  useQuery({
    queryKey: ["auth", "signup-schema"],
    queryFn: async (): Promise<SignupSchema | null> => {
      try {
        return await authApi.getSignupSchema();
      } catch (error) {
        if ((error as { response?: { status?: number } }).response?.status === 404) return null;
        throw error;
      }
    },
  });

/**
 * POST /vendor/signup — creates the studio and returns the login payload.
 * Screens call this instead of `useAuth().signUp` so a failure doesn't
 * unmount the form (see context.tsx).
 */
export const useVendorSignup = () =>
  useMutation({
    mutationFn: (input: VendorSignupRequest): Promise<LoginResponse> => authApi.register(input),
  });
