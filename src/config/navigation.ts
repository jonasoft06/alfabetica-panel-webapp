import type { LucideIcon } from "lucide-react";
import { BookOpenIcon, FolderIcon, HomeIcon, ImageIcon, PackageIcon, UsersIcon } from "lucide-react";
import type { PermissionKey } from "@/contracts/auth";

export interface NavItem {
  key: "dashboard" | "projects" | "portfolio" | "store" | "production" | "collaborators";
  /** Spanish, user-facing route. */
  href: string;
  label: string;
  icon: LucideIcon;
  /** Permission that grants write access to the module (reading is open to any session). */
  permission?: PermissionKey;
  /** CSS colors for the module accent (spine, masthead bar) and its strong variant (buttons, links). */
  accent: string;
  accentStrong: string;
  /** Shows the "próximamente" dot in the sidebar. */
  upcoming?: boolean;
  /** Outside demo mode (some module on the real API): `hidden` drops the entry, `upcoming` keeps it with the dot. */
  whenReal?: "hidden" | "upcoming";
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    href: "/resumen",
    label: "Resumen",
    icon: HomeIcon,
    accent: "var(--alf-turquoise)",
    accentStrong: "var(--alf-turquoise-dark)",
    whenReal: "upcoming",
  },
  {
    key: "projects",
    href: "/proyectos",
    label: "Proyectos",
    icon: FolderIcon,
    permission: "projects",
    accent: "var(--alf-grape)",
    accentStrong: "var(--alf-grape)",
  },
  {
    key: "portfolio",
    href: "/portafolio",
    label: "Portafolio",
    icon: ImageIcon,
    permission: "portfolio",
    accent: "var(--alf-tan-sun)",
    accentStrong: "var(--alf-tan-sun-dark)",
  },
  {
    key: "store",
    href: "/tienda",
    label: "Tienda",
    icon: BookOpenIcon,
    permission: "publication",
    accent: "var(--alf-tangerine)",
    accentStrong: "var(--alf-tangerine)",
    whenReal: "upcoming",
  },
  {
    key: "production",
    href: "/produccion",
    label: "Producción",
    icon: PackageIcon,
    permission: "production",
    accent: "var(--alf-bubblegum)",
    accentStrong: "var(--alf-bubblegum-dark)",
  },
  {
    key: "collaborators",
    href: "/colaboradores",
    label: "Colaboradores",
    icon: UsersIcon,
    permission: "users",
    accent: "var(--alf-turquoise-dark)",
    accentStrong: "var(--alf-turquoise-dark)",
  },
];

/** Label of the "próximamente" tag shown next to upcoming entries (sidebar, drawer, tooltip). */
export const UPCOMING_LABEL = "Próximamente";

/** Entries to list in the navigation for the current runtime mode. */
export function navItemsFor(mockOnly: boolean): NavItem[] {
  if (mockOnly) return NAV_ITEMS;
  return NAV_ITEMS.filter((item) => item.whenReal !== "hidden").map((item) => (item.whenReal === "upcoming" ? { ...item, upcoming: true } : item));
}

export function navItemFor(pathname: string): NavItem {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? NAV_ITEMS[0];
}
