/**
 * Roles Feature - Mock Data
 */

import { mockDelay, mockId } from "@/lib/mock-utils";
import { DEFAULT_PERMISSIONS } from "./types";
import type { CreateRoleInput, Role, RolePermissions, UpdateRoleInput } from "./types";

const FULL_ACCESS: RolePermissions = {
  inbox: "all",
  calendar: "full",
  finance: "full",
  studio: ["profile_edit", "automation_edit"],
  growth: ["ads", "analytics"],
  admin: true,
};

const roles: Role[] = [
  { id: "role-owner", name: "Owner", isBuiltIn: true, memberCount: 1, permissions: FULL_ACCESS },
  {
    id: "role-sales",
    name: "Sales",
    isBuiltIn: true,
    memberCount: 1,
    permissions: {
      ...DEFAULT_PERMISSIONS,
      inbox: "all",
      calendar: "full",
      finance: "quotes",
    },
  },
  {
    id: "role-reception",
    name: "Receptionist",
    isBuiltIn: true,
    memberCount: 1,
    permissions: { ...DEFAULT_PERMISSIONS, inbox: "assigned", calendar: "view" },
  },
  {
    id: "role-finance",
    name: "Finance",
    isBuiltIn: true,
    memberCount: 0,
    permissions: { ...DEFAULT_PERMISSIONS, finance: "full" },
  },
];

export const mockRolesApi = {
  getRoles: async (): Promise<Role[]> => {
    await mockDelay();
    return [...roles];
  },

  createRole: async (input: CreateRoleInput): Promise<Role> => {
    await mockDelay(250);
    const role: Role = {
      id: mockId(),
      name: input.name,
      isBuiltIn: false,
      memberCount: 0,
      permissions: input.permissions,
    };
    roles.push(role);
    return role;
  },

  updateRole: async (input: UpdateRoleInput): Promise<Role> => {
    await mockDelay(250);
    const role = roles.find((r) => r.id === input.roleId);
    if (!role) throw new Error(`Mock role not found: ${input.roleId}`);
    if (input.name) role.name = input.name;
    if (input.permissions) role.permissions = input.permissions;
    return role;
  },

  deleteRole: async (roleId: string): Promise<void> => {
    await mockDelay(200);
    const index = roles.findIndex((r) => r.id === roleId);
    if (index !== -1) roles.splice(index, 1);
  },
};
