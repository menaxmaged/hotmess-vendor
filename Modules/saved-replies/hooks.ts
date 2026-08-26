/**
 * Saved Replies Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savedRepliesApi } from "./api";
import type { CreateSavedReplyInput } from "./types";

export const savedRepliesKeys = {
  all: ["saved-replies"] as const,
};

export const useSavedReplies = (enabled = true) => {
  return useQuery({
    queryKey: savedRepliesKeys.all,
    queryFn: savedRepliesApi.getSavedReplies,
    enabled,
  });
};

const useInvalidateSavedReplies = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: savedRepliesKeys.all });
};

export const useCreateSavedReply = () => {
  const invalidate = useInvalidateSavedReplies();
  return useMutation({
    mutationFn: (input: CreateSavedReplyInput) => savedRepliesApi.createSavedReply(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Create saved reply error:", getErrorMessage(error)),
  });
};

export const useDeleteSavedReply = () => {
  const invalidate = useInvalidateSavedReplies();
  return useMutation({
    mutationFn: (id: string) => savedRepliesApi.deleteSavedReply(id),
    onSuccess: invalidate,
    onError: (error) => console.error("Delete saved reply error:", getErrorMessage(error)),
  });
};
