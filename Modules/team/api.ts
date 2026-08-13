/**
 * Team Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import type { LoginResponse } from "@/Modules/auth/types";
import { mockTeamApi } from "./mock";
import type {
    AcceptInviteInput,
    InviteMemberInput,
    SeatLimits,
    TeamMember,
    TeamOverview,
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

interface RealMember {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  seatSuspendedAt: string | null;
  vendorRole: { id: string; name: string } | null;
}

interface RealInvite {
  id: string;
  email: string;
  roleId?: string | null;
  expiresAt: string;
  deliveryChannel: "email" | "whatsapp";
}

interface RealTeam {
  members: RealMember[];
  invites: RealInvite[];
  seats: { seated: number; liveInvites: number; max: number | null };
}

const mapMember = (m: RealMember): TeamMember => ({
  id: m.id,
  name: m.name,
  email: m.email,
  isOwner: m.isOwner,
  roleId: m.vendorRole?.id ?? null,
  roleName: m.vendorRole?.name ?? (m.isOwner ? "Owner" : null),
  status: "active",
});

const mapInvite = (invite: RealInvite): TeamMember => ({
  id: invite.id,
  name: invite.email.split("@")[0] ?? invite.email,
  email: invite.email,
  isOwner: false,
  roleId: invite.roleId ?? null,
  // The invite response never echoes a role name, only a roleId — resolving it
  // to a label needs a join against Modules/roles this module doesn't have.
  roleName: null,
  status: "pending",
  expiresAt: invite.expiresAt,
});

const liveTeamApi = {
  getOverview: async (): Promise<TeamOverview> => {
    const response = await api.get<unknown>("/vendor/team");
    const team = unwrapPayload<RealTeam>(response.data);
    return {
      members: [
        ...team.members.filter((m) => !m.seatSuspendedAt).map(mapMember),
        ...team.invites.map(mapInvite),
      ],
      seatLimits: team.seats,
    };
  },

  inviteMember: async (input: InviteMemberInput): Promise<TeamMember> => {
    const response = await api.post<unknown>("/vendor/team/invites", {
      email: input.email,
      roleId: input.roleId,
      deliveryChannel: input.delivery,
      phone: input.phone,
    });
    return mapInvite(unwrapPayload<RealInvite>(response.data));
  },

  // PUBLIC — see the note on AcceptInviteInput.
  acceptInvite: async (input: AcceptInviteInput): Promise<LoginResponse> => {
    const response = await api.post<unknown>("/vendor/team/invites/accept", input);
    return unwrapPayload<LoginResponse>(response.data);
  },

  revokeInvite: async (inviteId: string): Promise<void> => {
    await api.delete(`/vendor/team/invites/${inviteId}`);
  },

  removeMember: async (memberId: string): Promise<void> => {
    await api.delete(`/vendor/team/members/${memberId}`);
  },

  updateMemberRole: async (memberId: string, roleId: string | null): Promise<void> => {
    await api.patch<unknown>(`/vendor/team/members/${memberId}`, { roleId });
  },
};

export const teamApi: typeof liveTeamApi = USE_MOCK_DATA ? mockTeamApi : liveTeamApi;

export type { SeatLimits };
