import type { UserListItem, UserStatus } from "@/contracts/users";

export type StatusFilter = "all" | UserStatus;

export const STATUS_LABELS: Record<UserStatus, string> = { ACTIVE: "Activo", INVITED: "Invitado", INACTIVE: "Inactivo" };
const STATUS_ORDER: Record<UserStatus, number> = { ACTIVE: 0, INVITED: 1, INACTIVE: 2 };

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filterCollaborators(items: UserListItem[], { query, status }: { query: string; status: StatusFilter }): UserListItem[] {
  const q = normalize(query.trim());
  return items
    .filter((u) => status === "all" || u.status === status)
    .filter((u) => !q || normalize(`${u.name ?? ""} ${u.email} ${u.role?.name ?? ""}`).includes(q))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (a.name ?? a.email).localeCompare(b.name ?? b.email, "es"));
}

export const isInvitationExpired = (user: UserListItem) =>
  user.status === "INVITED" && !!user.invitationExpiresAt && new Date(user.invitationExpiresAt).getTime() < Date.now();

/* ---- lock-out protections (mirrored by the API) ---- */

const activeHolders = (all: UserListItem[]) => all.filter((u) => u.status === "ACTIVE" && u.permissions.includes("users"));
const isLastHolder = (target: UserListItem, all: UserListItem[]) => {
  const holders = activeHolders(all);
  return holders.length === 1 && holders[0].id === target.id;
};

/** Reason why the target cannot be deactivated, or null when allowed. */
export function deactivationBlock(target: UserListItem, all: UserListItem[], currentUserId: string | undefined): string | null {
  if (target.id === currentUserId) return "No puedes desactivarte a ti mismo.";
  if (target.status === "ACTIVE" && isLastHolder(target, all)) return "Es la única persona activa con acceso a Colaboradores.";
  return null;
}

/** Reason why the `users` switch is locked for the target, or null when it can change. */
export function usersPermissionLock(target: UserListItem, all: UserListItem[], currentUserId: string | undefined): string | null {
  if (!target.permissions.includes("users")) return null;
  if (target.id === currentUserId) return "No puedes quitarte tu propio acceso a Colaboradores.";
  if (target.status === "ACTIVE" && isLastHolder(target, all)) return "Es la única persona activa con este acceso.";
  return null;
}
