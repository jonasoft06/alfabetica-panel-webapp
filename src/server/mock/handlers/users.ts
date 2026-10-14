import "server-only";
import type { CurrentUser } from "@/contracts/auth";
import { db } from "../db";
import { requireUser } from "../guards";
import { json } from "../http";
import type { MockRouter } from "../router";

/** GET /users/me (existing). Collaborator management routes are registered in collaborators.ts. */
export function registerUsers(router: MockRouter) {
  router.get("users/me", (req) => {
    const user = requireUser(req);
    const role = db().roles.find((r) => r.id === user.roleId) ?? null;
    const body: CurrentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: role ? { id: role.id, name: role.name } : null,
      permissions: user.permissions,
    };
    return json(body);
  });
}
