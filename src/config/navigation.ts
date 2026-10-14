import type { LucideIcon } from "lucide-react";
import { BookOpenIcon, FolderIcon, HomeIcon, ImageIcon, PackageIcon, UsersIcon } from "lucide-react";
import type { PermissionKey } from "@/contracts/auth";

export interface NavItem {
  key: "dashboard" | "projects" | "portfolio" | "store" | "production" | "collaborators";
  /** Spanish, user-facing route. */
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  /** Permission that grants write access to the module (reading is open to any session). */
  permission?: PermissionKey;
  /** CSS colors for the module accent (spine, masthead bar) and its strong variant (buttons, links). */
  accent: string;
  accentStrong: string;
  /** Shows the "próximamente" dot in the sidebar. */
  upcoming?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    href: "/resumen",
    label: "Resumen",
    shortLabel: "Inicio",
    icon: HomeIcon,
    accent: "var(--alf-turquoise)",
    accentStrong: "var(--alf-turquoise-dark)",
  },
  {
    key: "projects",
    href: "/proyectos",
    label: "Proyectos",
    shortLabel: "Proyectos",
    icon: FolderIcon,
    permission: "projects",
    accent: "var(--alf-grape)",
    accentStrong: "var(--alf-grape)",
  },
  {
    key: "portfolio",
    href: "/portafolio",
    label: "Portafolio",
    shortLabel: "Portafolio",
    icon: ImageIcon,
    permission: "portfolio",
    accent: "var(--alf-tan-sun)",
    accentStrong: "var(--alf-tan-sun-dark)",
  },
  {
    key: "store",
    href: "/tienda",
    label: "Tienda",
    shortLabel: "Tienda",
    icon: BookOpenIcon,
    permission: "publication",
    accent: "var(--alf-tangerine)",
    accentStrong: "var(--alf-tangerine)",
  },
  {
    key: "production",
    href: "/produccion",
    label: "Producción",
    shortLabel: "Producción",
    icon: PackageIcon,
    permission: "production",
    accent: "var(--alf-bubblegum)",
    accentStrong: "var(--alf-bubblegum-dark)",
  },
  {
    key: "collaborators",
    href: "/colaboradores",
    label: "Colaboradores",
    shortLabel: "Equipo",
    icon: UsersIcon,
    permission: "users",
    accent: "var(--alf-turquoise-dark)",
    accentStrong: "var(--alf-turquoise-dark)",
  },
];

export function navItemFor(pathname: string): NavItem {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? NAV_ITEMS[0];
}
