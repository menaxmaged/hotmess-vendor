/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Team & Roles Feature - API Service
 */

import { api } from "@/lib/api-client";
import type {
    CreateRoleInput,
    InviteMemberInput,
    Role,
    TeamMember,
    TeamOverview,
    UpdateRoleInput,
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

export const teamApi = {
  getOverview: async (): Promise<TeamOverview> => {
    const response = await api.get<unknown>("/vendor/team/overview");
    return unwrapPayload<TeamOverview>(response.data);
  },

  inviteMember: async (input: InviteMemberInput): Promise<TeamMember> => {
    const response = await api.post<unknown>("/vendor/team/invite", input);
    return unwrapPayload<TeamMember>(response.data);
  },

  removeMember: async (memberId: string): Promise<void> => {
    await api.delete(`/vendor/team/members/${memberId}`);
  },

  updateMemberRole: async (
    memberId: string,
    roleId: string,
  ): Promise<TeamMember> => {
    const response = await api.patch<unknown>(
      `/vendor/team/members/${memberId}/role`,
      { roleId },
    );
    return unwrapPayload<TeamMember>(response.data);
  },

  createRole: async (input: CreateRoleInput): Promise<Role> => {
    const response = await api.post<unknown>("/vendor/team/roles", input);
    return unwrapPayload<Role>(response.data);
  },

  updateRole: async (input: UpdateRoleInput): Promise<Role> => {
    const response = await api.patch<unknown>(
      `/vendor/team/roles/${input.roleId}`,
      { name: input.name, permissions: input.permissions },
    );
    return unwrapPayload<Role>(response.data);
  },

  deleteRole: async (roleId: string): Promise<void> => {
    await api.delete(`/vendor/team/roles/${roleId}`);
  },
};
