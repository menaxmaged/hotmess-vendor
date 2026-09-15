/**
 * Account Feature - Hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountApi } from "./api";
import type { UpdateMeInput } from "./types";

export const accountKeys = {
  all: ["account"] as const,
  me: () => [...accountKeys.all, "me"] as const,
};

export const useMe = () => {
  return useQuery({
    queryKey: accountKeys.me(),
    queryFn: accountApi.getMe,
  });
};

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeInput) => accountApi.updateMe(input),
    onSuccess: (me) => {
      queryClient.setQueryData(accountKeys.me(), me);
    },
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: accountApi.deleteMe,
  });
};
