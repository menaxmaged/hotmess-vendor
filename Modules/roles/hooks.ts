/**
 * Roles Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "./api";
import type { CreateRoleInput, UpdateRoleInput } from "./types";

export const rolesKeys = {
  all: ["roles"] as const,
  list: () => [...rolesKeys.all, "list"] as const,
};

export const useRoles = () => {
  return useQuery({
    queryKey: rolesKeys.list(),
    queryFn: rolesApi.getRoles,
  });
};

const useInvalidateRoles = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: rolesKeys.list() });
};

export const useCreateRole = () => {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (input: CreateRoleInput) => rolesApi.createRole(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Create role error:", getErrorMessage(error)),
  });
};

export const useUpdateRole = () => {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (input: UpdateRoleInput) => rolesApi.updateRole(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Update role error:", getErrorMessage(error)),
  });
};

export const useDeleteRole = () => {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (roleId: string) => rolesApi.deleteRole(roleId),
    onSuccess: invalidate,
    onError: (error) => console.error("Delete role error:", getErrorMessage(error)),
  });
};
