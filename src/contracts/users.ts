import type { IsoDate } from "./common";
import type { PermissionKey } from "./auth";

/**
 * Collaborators management (panel-api `users` module, "minimal collaborator management").
 * Reads are open to any session; writes need the `users` permission.
 * Not in the API yet: PUT /users/:id/permissions and resending an invitation (the UI shows them as "Próximamente").
 */

export type UserStatus = "INVITED" | "ACTIVE" | "INACTIVE";

/** @api existing — UserListItemDto: GET /users, POST /users/invitations, PATCH /users/:id/status. */
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
  createdAt: IsoDate;
}

/** @api existing — GET /roles */
export interface Role {
  id: string;
  name: string;
  description: string | null;
}

/** @api existing — GET /permissions (catalog is fixed, seeded). */
export interface Permission {
  id: string;
  key: PermissionKey;
  name: string;
  description: string | null;
}

/**
 * @api existing — POST /users/invitations. 400 when the domain is not allowed, 409 when the email exists.
 * `roleId` (UUID from GET /roles) is optional in the API; the panel always sends one.
 */
export interface InviteUserRequest {
  email: string;
  name?: string;
  roleId: string;
  permissions: PermissionKey[];
}

/** @api proposed — PUT /users/:id/permissions */
export interface UpdateUserPermissionsRequest {
  permissions: PermissionKey[];
}

/** @api existing — PATCH /users/:id/status. INACTIVE on an INVITED user cancels the invitation. */
export interface UpdateUserStatusRequest {
  status: Exclude<UserStatus, "INVITED">;
}

/** @api existing — `reason` of 400/409 errors on the users endpoints (older style: `reason`, not `code`). */
export type UserErrorReason = "USER_NOT_LINKED" | "USER_SELF_DEACTIVATION" | "LAST_USERS_ADMIN" | "CONCURRENT_UPDATE" | "UNKNOWN_PERMISSIONS";
