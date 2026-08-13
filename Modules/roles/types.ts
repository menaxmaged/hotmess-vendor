/**
 * Roles Feature Types
 *
 * Split out of Modules/team on 2026-08-13 — roles are a top-level resource
 * (`/vendor/roles`) on the real backend, not nested under team.
 */

export type InboxAccess = "none" | "assigned" | "all";
export type CalendarAccess = "none" | "view" | "full";
export type FinanceAccess = "none" | "quotes" | "payments_view" | "payments_edit" | "full";
export type StudioPermission = "profile_edit" | "automation_edit";
export type GrowthPermission = "ads" | "analytics";

export interface RolePermissions {
  inbox: InboxAccess;
  calendar: CalendarAccess;
  finance: FinanceAccess;
  studio: StudioPermission[];
  growth: GrowthPermission[];
  admin: boolean;
}

export interface Role {
  id: string;
  name: string;
  isBuiltIn: boolean;
  memberCount: number;
  permissions: RolePermissions;
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
  inbox: "none",
  calendar: "none",
  finance: "none",
  studio: [],
  growth: [],
  admin: false,
};
