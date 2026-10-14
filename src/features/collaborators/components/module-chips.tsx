import type { PermissionKey } from "@/contracts/auth";
import { cn } from "@/shared/lib/cn";
import { MODULE_CHIP, MODULE_FALLBACK, MODULE_KEYS } from "../lib/modules";

/** Compact chips of the modules a collaborator can access, colored like their module. */
export function ModuleChips({ permissions }: { permissions: PermissionKey[] }) {
  const modules = MODULE_KEYS.filter((key) => permissions.includes(key));
  if (modules.length === 0) return <span className="text-xs text-muted-foreground">Sin módulos asignados</span>;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Módulos con acceso">
      {modules.map((key) => (
        <li key={key} className={cn("rounded-full px-2.5 py-1 text-[11px] leading-none font-bold", MODULE_CHIP[key])}>
          {MODULE_FALLBACK[key].name}
        </li>
      ))}
      {permissions.includes("inventory") && (
        <li className="rounded-full bg-eerie/[0.08] px-2.5 py-1 text-[11px] leading-none font-bold text-eerie/60">Inventario</li>
      )}
    </ul>
  );
}
