/**
 * Team Feature - Mock Data
 */

import { tokenManager } from "@/lib/api-client";
import { mockDelay, mockId } from "@/lib/mock-utils";
import type { LoginResponse } from "@/Modules/auth/types";
import type { AcceptInviteInput, InviteMemberInput, TeamMember, TeamOverview } from "./types";

// Mirrors Modules/roles/mock.ts's built-in role ids/names, kept independent
// (each module owns its own mock store) rather than importing across modules.
const ROLE_NAMES: Record<string, string> = {
  "role-owner": "Owner",
  "role-sales": "Sales",
  "role-reception": "Receptionist",
  "role-finance": "Finance",
};

const members: TeamMember[] = [
  {
    id: "mock-vendor-1",
    name: "Amira Studio",
    email: "vendor@hotmess.dev",
    isOwner: true,
    roleId: "role-owner",
    roleName: "Owner",
    status: "active",
  },
  {
    id: "tm-1",
    name: "Mona Adel",
    email: "mona@atelieramira.com",
    isOwner: false,
    roleId: "role-sales",
    roleName: "Sales",
    status: "active",
  },
  {
    id: "tm-2",
    name: "Youssef Nabil",
    email: "youssef@atelieramira.com",
    isOwner: false,
    roleId: "role-reception",
    roleName: "Receptionist",
    status: "pending",
    invitedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(),
  },
];

export const mockTeamApi = {
  getOverview: async (): Promise<TeamOverview> => {
    await mockDelay();
    return {
      members: [...members],
      seatLimits: { seated: members.filter((m) => m.status === "active").length, liveInvites: members.filter((m) => m.status === "pending").length, max: 10 },
    };
  },

  inviteMember: async (input: InviteMemberInput): Promise<TeamMember> => {
    await mockDelay(300);
    const member: TeamMember = {
      id: mockId(),
      name: input.email.split("@")[0] ?? "New member",
      email: input.email,
      isOwner: false,
      roleId: input.roleId,
      roleName: input.roleId ? (ROLE_NAMES[input.roleId] ?? null) : null,
      status: "pending",
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    };
    members.push(member);
    return member;
  },

  acceptInvite: async (input: AcceptInviteInput): Promise<LoginResponse> => {
    await mockDelay(300);
    if (input.token !== "mock-invite-token") {
      throw new Error("That invite is no longer valid");
    }
    const member: TeamMember = {
      id: mockId(),
      name: input.name,
      email: "invitee@atelieramira.com",
      isOwner: false,
      roleId: "role-reception",
      roleName: "Receptionist",
      status: "active",
    };
    members.push(member);
    const token = "mock-token";
    await tokenManager.set(token);
    return {
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        accountType: "vendor",
        status: "active",
      },
      token,
      subscription: { plan: null, status: "trialing" },
    };
  },

  revokeInvite: async (inviteId: string): Promise<void> => {
    await mockDelay(200);
    const index = members.findIndex((m) => m.id === inviteId && m.status === "pending");
    if (index !== -1) members.splice(index, 1);
  },

  removeMember: async (memberId: string): Promise<void> => {
    await mockDelay(200);
    const index = members.findIndex((m) => m.id === memberId);
    if (index !== -1) members.splice(index, 1);
  },

  updateMemberRole: async (memberId: string, roleId: string | null): Promise<void> => {
    await mockDelay(200);
    const member = members.find((m) => m.id === memberId);
    if (!member) throw new Error(`Mock member not found: ${memberId}`);
    member.roleId = roleId;
    member.roleName = roleId ? (ROLE_NAMES[roleId] ?? null) : null;
  },
};
