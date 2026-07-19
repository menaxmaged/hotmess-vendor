/**
 * Auth Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "./api";
import type { LoginCredentials } from "./types";

export const useLogin = () => {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onError: (error) => {
      console.log("Login error encountered:", error);
      console.error("Login error:", getErrorMessage(error));
    },
  });
};

export const useLogout = () => {
  return () => {
    authApi.logout();
  };
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.resetPassword(data),
    onError: (error) => {
      console.error("Change password error:", getErrorMessage(error));
    },
  });
