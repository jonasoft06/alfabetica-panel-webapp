import "server-only";
import { PERMISSION_KEYS, type PermissionKey } from "@/contracts/auth";
import type { InviteUserRequest, Permission, UserListItem, UserStatus } from "@/contracts/users";
import { db, type UserRecord } from "../db";
import { requirePermission, requireUser } from "../guards";
import { badRequest, conflict, json, notFound, type MockRequest } from "../http";
import type { MockRouter } from "../router";

/* TODO(api): every route here is proposed (deferred "Gestión de usuarios"). */

const CORPORATE_DOMAIN = "alfabetica.com.mx";
const INVITATION_VALID_MS = 7 * 24 * 3600 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CATALOG: Omit<Permission, "id">[] = [
  { key: "users", name: "Colaboradores", description: "Invitar personas y administrar sus accesos." },
  { key: "projects", name: "Proyectos", description: "Crear, editar y eliminar proyectos del catálogo." },
  { key: "portfolio", name: "Portafolio", description: "Gestionar lo que se publica en el portafolio web." },
  { key: "production", name: "Producción", description: "Dar seguimiento a la producción y su avance." },
  { key: "publication", name: "Tienda", description: "Administrar publicaciones, precios y secciones de venta." },
  { key: "settings", name: "Ajustes", description: "Cambiar la configuración general del panel." },
  { key: "inventory", name: "Inventario", description: "Control de existencias (fase 2)." },
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
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function parsePermissions(value: unknown): PermissionKey[] {
  if (!Array.isArray(value)) throw badRequest("permissions must be an array");
  const known = new Set<string>(PERMISSION_KEYS);
  const invalid = value.filter((k) => typeof k !== "string" || !known.has(k));
  if (invalid.length) throw badRequest(`Unknown permission key(s): ${invalid.join(", ")}`);
  return [...new Set(value as PermissionKey[])];
}

function parseInvite(body: unknown): InviteUserRequest {
  if (!isRecord(body)) throw badRequest("Invalid body");
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) throw badRequest(["email must be an email"]);
  if (!email.endsWith(`@${CORPORATE_DOMAIN}`)) throw badRequest(`El correo debe pertenecer al dominio ${CORPORATE_DOMAIN}`);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length > 120) throw badRequest(["name must be shorter than or equal to 120 characters"]);
  const roleId = typeof body.roleId === "string" && body.roleId ? body.roleId : undefined;
  if (roleId && !db().roles.some((r) => r.id === roleId)) throw badRequest("Unknown roleId");
  return { email, name: name || undefined, roleId, permissions: parsePermissions(body.permissions ?? []) };
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
    if (db().users.some((u) => u.email.toLowerCase() === body.email)) throw conflict("Ya existe un colaborador con ese correo");
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
    if (status === "INACTIVE") {
      if (target.id === me.id) throw badRequest("No puedes desactivarte a ti mismo.");
      if (isLastHolder(target)) throw badRequest("No puedes desactivar a la única persona activa con acceso a Colaboradores.");
      target.status = "INACTIVE";
    } else {
      // Someone who never signed in goes back to INVITED (with a fresh invitation).
      if (target.lastLogin) target.status = "ACTIVE";
      else {
        target.status = "INVITED";
        target.invitedAt = new Date().toISOString();
        target.invitationExpiresAt = new Date(Date.now() + INVITATION_VALID_MS).toISOString();
      }
    }
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
