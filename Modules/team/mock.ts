/**
 * Team & Roles Feature - Mock Data
 */

import { mockDelay, mockId } from "@/lib/mock-utils";
import { DEFAULT_PERMISSIONS } from "./types";
import type {
    CreateRoleInput,
    InviteMemberInput,
    Role,
    RolePermissions,
    TeamMember,
    TeamOverview,
    UpdateRoleInput,
} from "./types";

const FULL_ACCESS: RolePermissions = {
  inbox: "all_chats",
  calendar: "full_access",
  financeQuotesCreateEdit: true,
  financePaymentsView: true,
  financePaymentsEdit: true,
  financeFullAccess: true,
  studioProfileEdit: true,
  studioAutomationEdit: true,
  growthAdsAccess: true,
  growthAnalyticsAccess: true,
  adminTeamManagement: true,
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
      inbox: "all_chats",
      calendar: "full_access",
      financeQuotesCreateEdit: true,
      financePaymentsView: true,
    },
  },
  {
    id: "role-reception",
    name: "Receptionist",
    isBuiltIn: true,
    memberCount: 1,
    permissions: { ...DEFAULT_PERMISSIONS, inbox: "assigned_only", calendar: "view_only" },
  },
  {
    id: "role-finance",
    name: "Finance",
    isBuiltIn: true,
    memberCount: 0,
    permissions: {
      ...DEFAULT_PERMISSIONS,
      financeFullAccess: true,
      financePaymentsEdit: true,
      financePaymentsView: true,
    },
  },
];

const members: TeamMember[] = [
  {
    id: "mock-vendor-1",
    name: "Amira Studio",
    email: "vendor@hotmess.dev",
    roleId: "role-owner",
    roleName: "Owner",
    status: "active",
    online: true,
  },
  {
    id: "tm-1",
    name: "Mona Adel",
    email: "mona@atelieramira.com",
    roleId: "role-sales",
    roleName: "Sales",
    status: "active",
    online: true,
  },
  {
    id: "tm-2",
    name: "Youssef Nabil",
    email: "youssef@atelieramira.com",
    roleId: "role-reception",
    roleName: "Receptionist",
    status: "pending",
    online: false,
    invitedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const seatLimits = { plan: "premium" as const, total: 10, customRolesAllowed: true };

const findRole = (roleId: string): Role => {
  const role = roles.find((r) => r.id === roleId);
  if (!role) throw new Error(`Mock role not found: ${roleId}`);
  return role;
};

export const mockTeamApi = {
  getOverview: async (): Promise<TeamOverview> => {
    await mockDelay();
    return {
      members: [...members],
      roles: [...roles],
      seatLimits: { ...seatLimits, used: members.length },
    };
  },

  inviteMember: async (input: InviteMemberInput): Promise<TeamMember> => {
    await mockDelay(300);
    const role = findRole(input.roleId);
    const member: TeamMember = {
      id: mockId(),
      name: input.email.split("@")[0] ?? "New member",
      email: input.email,
      roleId: role.id,
      roleName: role.name,
      status: "pending",
      online: false,
      invitedAt: new Date().toISOString(),
    };
    members.push(member);
    role.memberCount += 1;
    return member;
  },

  removeMember: async (memberId: string): Promise<void> => {
    await mockDelay(200);
    const index = members.findIndex((m) => m.id === memberId);
    if (index === -1) return;
    const [removed] = members.splice(index, 1);
    const role = roles.find((r) => r.id === removed?.roleId);
    if (role) role.memberCount = Math.max(0, role.memberCount - 1);
  },

  updateMemberRole: async (memberId: string, roleId: string): Promise<TeamMember> => {
    await mockDelay(200);
    const member = members.find((m) => m.id === memberId);
    if (!member) throw new Error(`Mock member not found: ${memberId}`);
    const oldRole = roles.find((r) => r.id === member.roleId);
    if (oldRole) oldRole.memberCount = Math.max(0, oldRole.memberCount - 1);
    const newRole = findRole(roleId);
    newRole.memberCount += 1;
    member.roleId = newRole.id;
    member.roleName = newRole.name;
    return member;
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
    const role = findRole(input.roleId);
    if (input.name) role.name = input.name;
    if (input.permissions) role.permissions = input.permissions;
    for (const member of members) {
      if (member.roleId === role.id) member.roleName = role.name;
    }
    return role;
  },

  deleteRole: async (roleId: string): Promise<void> => {
    await mockDelay(200);
    const index = roles.findIndex((r) => r.id === roleId);
    if (index !== -1) roles.splice(index, 1);
  },
};
