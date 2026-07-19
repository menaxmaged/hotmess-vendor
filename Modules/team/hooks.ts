/**
 * Team & Roles Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "./api";
import type { CreateRoleInput, InviteMemberInput, UpdateRoleInput } from "./types";

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

export const useInviteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteMemberInput) => teamApi.inviteMember(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.overview() });
    },
    onError: (error) => {
      console.error("Invite member error:", getErrorMessage(error));
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => teamApi.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.overview() });
    },
    onError: (error) => {
      console.error("Remove member error:", getErrorMessage(error));
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      teamApi.updateMemberRole(memberId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.overview() });
    },
    onError: (error) => {
      console.error("Update member role error:", getErrorMessage(error));
    },
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) => teamApi.createRole(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.overview() });
    },
    onError: (error) => {
      console.error("Create role error:", getErrorMessage(error));
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRoleInput) => teamApi.updateRole(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.overview() });
    },
    onError: (error) => {
      console.error("Update role error:", getErrorMessage(error));
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => teamApi.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.overview() });
    },
    onError: (error) => {
      console.error("Delete role error:", getErrorMessage(error));
    },
  });
};
