import type { PermissionKey } from "@/contracts/auth";
import type { Permission } from "@/contracts/users";
import { RELATIONS } from "@/shared/lib/relations";

/** Modules a collaborator can be granted access to (yes/no). `inventory` is phase 2 and handled apart. */
export const MODULE_KEYS = ["users", "projects", "portfolio", "production", "publication", "settings"] as const satisfies readonly PermissionKey[];
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const isModuleKey = (key: PermissionKey): key is ModuleKey => (MODULE_KEYS as readonly PermissionKey[]).includes(key);

/** Chip colors: relation modules keep their relation color; the rest use neutral accents. */
export const MODULE_CHIP: Record<ModuleKey, string> = {
  users: "bg-eerie/[0.08] text-eerie/70",
  projects: "bg-grape/15 text-grape",
  portfolio: RELATIONS.portfolio.chip,
  production: RELATIONS.production.chip,
  publication: RELATIONS.publication.chip,
  settings: "bg-tan-sun/30 text-tan-sun-dark",
};

export const MODULE_DOT: Record<ModuleKey, string> = {
  users: "bg-eerie/50",
  projects: "bg-grape",
  portfolio: RELATIONS.portfolio.dot,
  production: RELATIONS.production.dot,
  publication: RELATIONS.publication.dot,
  settings: "bg-tan-sun",
};

/**
 * Spanish copy per permission code. The API catalog (GET /permissions) is in English, so the UI never shows
 * its name/description for a known code; it is only the fallback for codes the panel does not know yet.
 */
export const MODULE_LABELS: Record<ModuleKey, { name: string; description: string }> = {
  users: { name: "Colaboradores", description: "Invitar, activar y desactivar colaboradores" },
  projects: { name: "Proyectos", description: "Datos generales del proyecto y sus relaciones" },
  portfolio: { name: "Portafolio", description: "Portada, galería y publicación en la web" },
  production: { name: "Producción", description: "Seguimiento editorial y sincronización con ClickUp" },
  publication: { name: "Tienda", description: "Venta, enlaces y capítulos DOI" },
  settings: { name: "Configuración", description: "Configuración general del sitio" },
};

/** Label for any permission code: Spanish for known modules, else the API's name (or the raw code). */
export function permissionLabel(key: string, catalog?: Permission[]): { name: string; description: string | null } {
  if ((MODULE_KEYS as readonly string[]).includes(key)) return MODULE_LABELS[key as ModuleKey];
  const entry = catalog?.find((p) => p.key === key);
  return { name: entry?.name ?? key, description: entry?.description ?? null };
}
