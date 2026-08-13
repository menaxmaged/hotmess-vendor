/**
 * Team Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "./api";
import type { AcceptInviteInput, InviteMemberInput } from "./types";

export const teamKeys = {
  all: ["team"] as const,
  overview: () => [...teamKeys.all, "overview"] as const,
};

export const useTeamOverview = () => {
  return useQuery({
    queryKey: teamKeys.overview(),
    queryFn: teamApi.getOverview,
  });
};

const useInvalidateTeam = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: teamKeys.overview() });
};

export const useInviteMember = () => {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (input: InviteMemberInput) => teamApi.inviteMember(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Invite member error:", getErrorMessage(error)),
  });
};

// PUBLIC flow — the invitee has no account/session yet. See app/(auth)/accept-invite.tsx.
export const useAcceptInvite = () => {
  return useMutation({
    mutationFn: (input: AcceptInviteInput) => teamApi.acceptInvite(input),
    onError: (error) => console.error("Accept invite error:", getErrorMessage(error)),
  });
};

export const useRevokeInvite = () => {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (inviteId: string) => teamApi.revokeInvite(inviteId),
    onSuccess: invalidate,
    onError: (error) => console.error("Revoke invite error:", getErrorMessage(error)),
  });
};

export const useRemoveMember = () => {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (memberId: string) => teamApi.removeMember(memberId),
    onSuccess: invalidate,
    onError: (error) => console.error("Remove member error:", getErrorMessage(error)),
  });
};

export const useUpdateMemberRole = () => {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string | null }) =>
      teamApi.updateMemberRole(memberId, roleId),
    onSuccess: invalidate,
    onError: (error) => console.error("Update member role error:", getErrorMessage(error)),
  });
};
