/**
 * Team Feature Types
 *
 * Role/permission types moved to Modules/roles on 2026-08-13 — roles are a
 * top-level backend resource now, not nested under team.
 */

export type TeamMemberStatus = "active" | "pending";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  roleId: string | null;
  roleName: string | null;
  status: TeamMemberStatus;
  /** Only set for pending members (sourced from the invite, not the seat). */
  invitedAt?: string | null;
  expiresAt?: string | null;
}

export interface SeatLimits {
  seated: number;
  liveInvites: number;
  /** `null` means unlimited. */
  max: number | null;
}

export interface TeamOverview {
  members: TeamMember[];
  seatLimits: SeatLimits;
}

export type InviteDelivery = "email" | "whatsapp";

export interface InviteMemberInput {
  email: string;
  roleId: string | null;
  delivery: InviteDelivery;
  /** Required when delivery is "whatsapp". */
  phone?: string;
}

// PUBLIC endpoint (no bearer token, invitee has no account yet) — called from
// app/(auth)/accept-invite.tsx, not from anywhere inside the authenticated app.
export interface AcceptInviteInput {
  token: string;
  name: string;
  password: string;
}
