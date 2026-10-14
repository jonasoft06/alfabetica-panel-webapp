import type { InviteUserRequest, Permission, Role, UpdateUserPermissionsRequest, UpdateUserStatusRequest, UserListItem } from "@/contracts/users";
import { endpoints } from "@/core/http/endpoints";
import { http } from "@/core/http/http-client";

/** TODO(api): proposed route, kept local until it is added to core/http/endpoints.ts. */
const resendInvitationPath = (id: string) => `/users/${encodeURIComponent(id)}/invitation/resend`;

/** Collaborators management — every route is TODO(api) (deferred "Gestión de usuarios"). */
export const collaboratorsApi = {
  list: () => http.get<UserListItem[]>(endpoints.users.list()),
  roles: () => http.get<Role[]>(endpoints.users.roles()),
  permissionCatalog: () => http.get<Permission[]>(endpoints.users.permissionCatalog()),
  invite: (body: InviteUserRequest) => http.post<UserListItem>(endpoints.users.invite(), body),
  updatePermissions: (id: string, body: UpdateUserPermissionsRequest) => http.put<UserListItem>(endpoints.users.permissions(id), body),
  updateStatus: (id: string, body: UpdateUserStatusRequest) => http.patch<UserListItem>(endpoints.users.status(id), body),
  resendInvitation: (id: string) => http.post<UserListItem>(resendInvitationPath(id)),
};

export const collaboratorKeys = {
  all: ["collaborators"] as const,
  list: () => [...collaboratorKeys.all, "list"] as const,
  roles: () => [...collaboratorKeys.all, "roles"] as const,
  permissions: () => [...collaboratorKeys.all, "permissions"] as const,
};
