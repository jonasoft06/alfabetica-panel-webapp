import "server-only";
import type { PermissionKey } from "@/contracts/auth";
import { db, type UserRecord } from "./db";
import { forbidden, unauthorized, type MockRequest } from "./http";

/** Mirrors AccessTokenGuard: Bearer token → active session → user. */
export function requireUser(req: MockRequest): UserRecord {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw unauthorized("Missing access token");
  const session = db().accessTokens.get(header.slice(7).trim());
  if (!session || session.expiresAt < Date.now()) throw unauthorized("Invalid or expired access token");
  const user = db().users.find((u) => u.id === session.userId);
  if (!user || user.status !== "ACTIVE") throw unauthorized("Invalid or expired access token");
  return user;
}

/** Mirrors PermissionsGuard + @RequirePermissions(). */
export function requirePermission(req: MockRequest, ...permissions: PermissionKey[]): UserRecord {
  const user = requireUser(req);
  const missing = permissions.filter((p) => !user.permissions.includes(p));
  if (missing.length) throw forbidden(`Missing required permission(s): ${missing.join(", ")}`);
  return user;
}
