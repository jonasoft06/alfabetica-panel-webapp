import type { IsoDate } from "./common";
import type { PermissionKey } from "./auth";

/**
 * Collaborators management — deferred in panel-api ("Gestión de usuarios").
 * Mirrors the existing Prisma models User / Role / Permission / UserPermission;
 * every endpoint is @api proposed.
 */

export type UserStatus = "INVITED" | "ACTIVE" | "INACTIVE";

/** @api proposed — item of GET /users */
export interface UserListItem {
  id: string;
  name: string | null;
  email: string;
  status: UserStatus;
  role: { id: string; name: string } | null;
  permissions: PermissionKey[];
  lastLogin: IsoDate | null;
  invitedAt: IsoDate | null;
  invitationExpiresAt: IsoDate | null;
}

/** @api proposed — GET /roles */
export interface Role {
  id: string;
  name: string;
  description: string | null;
}

/** @api proposed — GET /permissions (catalog is fixed, seeded). */
export interface Permission {
  id: string;
  key: PermissionKey;
  name: string;
  description: string | null;
}

/** @api proposed — POST /users/invitations */
export interface InviteUserRequest {
  email: string;
  name?: string;
  roleId?: string;
  permissions: PermissionKey[];
}

/** @api proposed — PUT /users/:id/permissions */
export interface UpdateUserPermissionsRequest {
  permissions: PermissionKey[];
}

/** @api proposed — PATCH /users/:id/status */
export interface UpdateUserStatusRequest {
  status: Exclude<UserStatus, "INVITED">;
}
