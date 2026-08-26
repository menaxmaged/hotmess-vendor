/**
 * Instagram Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { instagramApi } from "./api";
import { startInstagramOAuth } from "./oauth";

export const instagramKeys = {
  all: ["instagram"] as const,
  connection: () => [...instagramKeys.all, "connection"] as const,
};

export const useInstagramConnection = () => {
  return useQuery({
    queryKey: instagramKeys.connection(),
    queryFn: instagramApi.getConnection,
  });
};

export const useInstagramPortfolio = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: [...instagramKeys.all, "portfolio", vendorId] as const,
    queryFn: () => instagramApi.getPortfolio(vendorId as string),
    enabled: !!vendorId,
  });
};

const useInvalidateInstagram = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: instagramKeys.all });
};

// Runs the full authorize-redirect → code-capture → exchange sequence.
// Resolves to `false` if the vendor cancelled the OAuth dialog, `true` on a
// completed exchange — never fabricates a connection from a toggle.
export const useConnectInstagram = () => {
  const invalidate = useInvalidateInstagram();
  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      const codeExchange = await startInstagramOAuth();
      if (!codeExchange) return false;
      await instagramApi.connect(codeExchange);
      return true;
    },
    onSuccess: (connected) => {
      if (connected) invalidate();
    },
    onError: (error) => console.error("Connect Instagram error:", getErrorMessage(error)),
  });
};

export const useDisconnectInstagram = () => {
  const invalidate = useInvalidateInstagram();
  return useMutation({
    mutationFn: () => instagramApi.disconnect(),
    onSuccess: invalidate,
    onError: (error) => console.error("Disconnect Instagram error:", getErrorMessage(error)),
  });
};
