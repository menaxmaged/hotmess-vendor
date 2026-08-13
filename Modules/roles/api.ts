/**
 * Roles Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { mockRolesApi } from "./mock";
import type { CreateRoleInput, Role, UpdateRoleInput } from "./types";

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

interface RealRole {
  id: string;
  name: string;
  isBuiltIn: boolean;
  permissions?: Role["permissions"];
  _count?: { members: number };
}

const mapRole = (role: RealRole): Role => ({
  id: role.id,
  name: role.name,
  isBuiltIn: role.isBuiltIn,
  memberCount: role._count?.members ?? 0,
  permissions: role.permissions ?? {
    inbox: "none",
    calendar: "none",
    finance: "none",
    studio: [],
    growth: [],
    admin: false,
  },
});

const liveRolesApi = {
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get<unknown>("/vendor/roles");
    return unwrapPayload<RealRole[]>(response.data).map(mapRole);
  },

  createRole: async (input: CreateRoleInput): Promise<Role> => {
    const response = await api.post<unknown>("/vendor/roles", input);
    const created = unwrapPayload<Partial<RealRole>>(response.data);
    // Create only echoes { id, name, isBuiltIn } — permissions/memberCount aren't
    // in the response, so fill them in from what we sent / know must be true.
    return {
      id: created.id ?? "",
      name: created.name ?? input.name,
      isBuiltIn: false,
      memberCount: 0,
      permissions: input.permissions,
    };
  },

  updateRole: async (input: UpdateRoleInput): Promise<Role> => {
    await api.patch<unknown>(`/vendor/roles/${input.roleId}`, {
      name: input.name,
      permissions: input.permissions,
    });
    // Same partial-echo situation as create — the hook refetches the list on
    // success, so this optimistic shape only needs to be plausible, not exact.
    return {
      id: input.roleId,
      name: input.name ?? "",
      isBuiltIn: false,
      memberCount: 0,
      permissions: input.permissions ?? {
        inbox: "none",
        calendar: "none",
        finance: "none",
        studio: [],
        growth: [],
        admin: false,
      },
    };
  },

  deleteRole: async (roleId: string): Promise<void> => {
    await api.delete(`/vendor/roles/${roleId}`);
  },
};

export const rolesApi: typeof liveRolesApi = USE_MOCK_DATA ? mockRolesApi : liveRolesApi;
