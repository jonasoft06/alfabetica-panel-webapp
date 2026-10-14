import type { CurrentUser, PermissionKey } from "@/contracts/auth";

/** Module-level access (yes/no), same rule as PermissionsGuard in panel-api. */
export function hasPermission(user: CurrentUser | null, permission: PermissionKey): boolean {
  return !!user?.permissions.includes(permission);
}

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  users: "Colaboradores",
  projects: "Proyectos",
  portfolio: "Portafolio",
  production: "Producción",
  publication: "Tienda",
  settings: "Ajustes",
  inventory: "Inventario",
};
