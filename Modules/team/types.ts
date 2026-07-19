/**
 * Team & Roles Feature Types
 */

export type InboxAccess = "all_chats" | "assigned_only";
export type CalendarAccess = "full_access" | "view_only";

export interface RolePermissions {
  inbox: InboxAccess;
  calendar: CalendarAccess;
  financeQuotesCreateEdit: boolean;
  financePaymentsView: boolean;
  financePaymentsEdit: boolean;
  financeFullAccess: boolean;
  studioProfileEdit: boolean;
  studioAutomationEdit: boolean;
  growthAdsAccess: boolean;
  growthAnalyticsAccess: boolean;
  adminTeamManagement: boolean;
}

export interface Role {
  id: string;
  name: string;
  isBuiltIn: boolean;
  memberCount: number;
  permissions: RolePermissions;
}

export type TeamMemberStatus = "active" | "pending";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  roleId: string;
  roleName: string;
  status: TeamMemberStatus;
  online: boolean;
  invitedAt?: string | null;
}

export interface SeatLimits {
  used: number;
  total: number;
  plan: "free" | "premium";
  customRolesAllowed: boolean;
}

export interface TeamOverview {
  members: TeamMember[];
  roles: Role[];
  seatLimits: SeatLimits;
}

export type InviteDelivery = "whatsapp" | "email" | "both";

export interface InviteMemberInput {
  email: string;
  roleId: string;
  delivery: InviteDelivery;
}

export interface CreateRoleInput {
  name: string;
  permissions: RolePermissions;
}

export interface UpdateRoleInput {
  roleId: string;
  name?: string;
  permissions?: RolePermissions;
}

export const DEFAULT_PERMISSIONS: RolePermissions = {
  inbox: "assigned_only",
  calendar: "view_only",
  financeQuotesCreateEdit: false,
  financePaymentsView: false,
  financePaymentsEdit: false,
  financeFullAccess: false,
  studioProfileEdit: false,
  studioAutomationEdit: false,
  growthAdsAccess: false,
  growthAnalyticsAccess: false,
  adminTeamManagement: false,
};
