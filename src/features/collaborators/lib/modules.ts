import type { PermissionKey } from "@/contracts/auth";
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

/** Fallback copy if the permission catalog has not loaded. */
export const MODULE_FALLBACK: Record<ModuleKey, { name: string; description: string }> = {
  users: { name: "Colaboradores", description: "Invitar personas y administrar sus accesos." },
  projects: { name: "Proyectos", description: "Crear, editar y eliminar proyectos del catálogo." },
  portfolio: { name: "Portafolio", description: "Gestionar lo que se publica en el portafolio web." },
  production: { name: "Producción", description: "Dar seguimiento a la producción y su avance." },
  publication: { name: "Tienda", description: "Administrar publicaciones, precios y secciones de venta." },
  settings: { name: "Ajustes", description: "Cambiar la configuración general del panel." },
};
