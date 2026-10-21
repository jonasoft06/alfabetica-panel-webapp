import "server-only";
import { PERMISSION_KEYS, type PermissionKey } from "@/contracts/auth";
import type { InviteUserRequest, Permission, UserListItem, UserStatus } from "@/contracts/users";
import { db, type UserRecord } from "../db";
import { requirePermission, requireUser } from "../guards";
import { badRequest, conflict, json, notFound, reasonError, type MockRequest } from "../http";
import type { MockRouter } from "../router";

/* Mirrors users.controller.ts. TODO(api): PUT /users/:id/permissions and the invitation resend are still proposed. */

const CORPORATE_DOMAIN = "alfabetica.com.mx";
const INVITATION_VALID_MS = 7 * 24 * 3600 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CATALOG: Omit<Permission, "id">[] = [
  { key: "users", name: "Users", description: "Invite and manage panel users" },
  { key: "projects", name: "Projects", description: "Manage projects and their relations" },
  { key: "portfolio", name: "Portfolio", description: "Manage the web portfolio" },
  { key: "production", name: "Production", description: "Production tracking and ClickUp sync" },
  { key: "publication", name: "Publication", description: "Store publications, links and DOI chapters" },
  { key: "settings", name: "Settings", description: "General site settings" },
  { key: "inventory", name: "Inventory", description: "Stock control (phase 2)" },
];

const toItem = (u: UserRecord): UserListItem => {
  const role = db().roles.find((r) => r.id === u.roleId) ?? null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    status: u.status,
    role: role ? { id: role.id, name: role.name } : null,
    permissions: u.permissions,
    lastLogin: u.lastLogin,
    invitedAt: u.invitedAt,
    invitationExpiresAt: u.invitationExpiresAt,
    createdAt: u.createdAt,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function parsePermissions(value: unknown): PermissionKey[] {
  if (!Array.isArray(value)) throw badRequest("permissions must be an array");
  const known = new Set<string>(PERMISSION_KEYS);
  const invalid = value.filter((k) => typeof k !== "string" || !known.has(k));
  if (invalid.length) throw reasonError(400, "UNKNOWN_PERMISSIONS", { unknown: invalid });
  return [...new Set(value as PermissionKey[])];
}

function parseInvite(body: unknown): InviteUserRequest {
  if (!isRecord(body)) throw badRequest("Invalid body");
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) throw badRequest(["email must be an email"]);
  if (email.split("@")[1] !== CORPORATE_DOMAIN) throw badRequest("Email domain is not allowed");
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length > 120) throw badRequest(["name must be shorter than or equal to 120 characters"]);
  const roleId = typeof body.roleId === "string" && body.roleId ? body.roleId : undefined;
  if (roleId && !db().roles.some((r) => r.id === roleId)) throw badRequest("Role not found");
  return { email, name: name || undefined, roleId: roleId!, permissions: parsePermissions(body.permissions ?? []) };
}

const activeHolders = () => db().users.filter((u) => u.status === "ACTIVE" && u.permissions.includes("users"));
const isLastHolder = (u: UserRecord) => u.status === "ACTIVE" && activeHolders().length === 1 && activeHolders()[0].id === u.id;

function findUser(req: MockRequest): UserRecord {
  const user = db().users.find((u) => u.id === req.params.id);
  if (!user) throw notFound("User not found");
  return user;
}

export function registerCollaborators(router: MockRouter) {
  // Reading is open to any signed-in user so the module can be shown read-only.
  router.get("users", (req) => {
    requireUser(req);
    return json(db().users.map(toItem));
  });
  router.get("roles", (req) => {
    requireUser(req);
    return json(db().roles);
  });
  router.get("permissions", (req) => {
    requireUser(req);
    return json(CATALOG.map((p, i) => ({ id: `00000004-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, ...p })));
  });

  router.post("users/invitations", (req) => {
    requirePermission(req, "users");
    const body = parseInvite(req.body);
    if (db().users.some((u) => u.email.toLowerCase() === body.email)) throw conflict("A user with this email already exists");
    const now = Date.now();
    const record: UserRecord = {
      id: crypto.randomUUID(),
      name: body.name ?? null,
      email: body.email,
      mockProfile: null,
      status: "INVITED",
      roleId: body.roleId ?? null,
      permissions: body.permissions,
      lastLogin: null,
      invitedAt: new Date(now).toISOString(),
      invitationExpiresAt: new Date(now + INVITATION_VALID_MS).toISOString(),
      createdAt: new Date(now).toISOString(),
    };
    db().users.push(record);
    return json(toItem(record), { status: 201 });
  });

  router.put("users/:id/permissions", (req) => {
    const me = requirePermission(req, "users");
    const target = findUser(req);
    if (!isRecord(req.body)) throw badRequest("Invalid body");
    const permissions = parsePermissions(req.body.permissions);
    if (target.permissions.includes("users") && !permissions.includes("users")) {
      if (target.id === me.id) throw badRequest("No puedes quitarte a ti mismo el acceso a Colaboradores.");
      if (isLastHolder(target)) throw badRequest("No puedes quitar el acceso a Colaboradores a la única persona activa que lo tiene.");
    }
    target.permissions = permissions;
    return json(toItem(target));
  });

  router.patch("users/:id/status", (req) => {
    const me = requirePermission(req, "users");
    const target = findUser(req);
    if (!isRecord(req.body) || (req.body.status !== "ACTIVE" && req.body.status !== "INACTIVE"))
      throw badRequest(["status must be one of the following values: ACTIVE, INACTIVE"]);
    const status: Exclude<UserStatus, "INVITED"> = req.body.status;
    if (target.status === status) return json(toItem(target));
    // Activating by hand needs an account that already signed in once (Firebase-linked); lastLogin stands in for that here.
    if (status === "ACTIVE" && !target.lastLogin) throw reasonError(409, "USER_NOT_LINKED");
    // The protections only apply to ACTIVE users: INACTIVE on an INVITED user cancels the invitation.
    if (status === "INACTIVE" && target.status === "ACTIVE") {
      if (target.id === me.id) throw reasonError(409, "USER_SELF_DEACTIVATION");
      if (isLastHolder(target)) throw reasonError(409, "LAST_USERS_ADMIN");
    }
    target.status = status;
    return json(toItem(target));
  });

  router.post("users/:id/invitation/resend", (req) => {
    requirePermission(req, "users");
    const target = findUser(req);
    if (target.status !== "INVITED") throw conflict("Solo se puede reenviar la invitación a usuarios con estado INVITED");
    target.invitedAt = new Date().toISOString();
    target.invitationExpiresAt = new Date(Date.now() + INVITATION_VALID_MS).toISOString();
    return json(toItem(target));
  });
}
