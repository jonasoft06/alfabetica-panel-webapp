"use client";

import { useId } from "react";
import { LockIcon } from "lucide-react";
import type { PermissionKey } from "@/contracts/auth";
import type { Permission } from "@/contracts/users";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Switch } from "@/shared/ui/switch";
import { MODULE_DOT, MODULE_KEYS, permissionLabel, type ModuleKey } from "../lib/modules";

export interface PermissionSwitchListProps {
  /** Catalog from GET /permissions: labels are Spanish per code (`permissionLabel`), the catalog is only a fallback. */
  catalog: Permission[] | undefined;
  value: PermissionKey[];
  onChange: (next: PermissionKey[]) => void;
  /** Modules that cannot change, with the reason shown to the user. */
  locked?: Partial<Record<PermissionKey, string>>;
  disabled?: boolean;
  loading?: boolean;
}

/** One yes/no switch per module (permissions are stored per user; the role is only a label). */
export function PermissionSwitchList({ catalog, value, onChange, locked = {}, disabled, loading }: PermissionSwitchListProps) {
  const baseId = useId();
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {MODULE_KEYS.map((key) => (
          <Skeleton key={key} className="h-[68px] rounded-2xl" />
        ))}
      </div>
    );
  }

  const toggle = (key: ModuleKey, on: boolean) => onChange(on ? [...value.filter((k) => k !== key), key] : value.filter((k) => k !== key));

  return (
    <ul className="space-y-2" aria-label="Acceso por módulo">
      {MODULE_KEYS.map((key) => {
        const { name, description } = permissionLabel(key, catalog);
        const reason = locked[key];
        const on = value.includes(key);
        const id = `${baseId}-${key}`;
        return (
          <li
            key={key}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3 transition-colors",
              on ? "border-primary/40 bg-primary/[0.05]" : "border-border",
            )}
          >
            <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", MODULE_DOT[key])} />
            <div className="min-w-0 flex-1">
              <label htmlFor={id} className="block text-sm font-bold">
                {name}
              </label>
              <p id={`${id}-desc`} className="text-xs text-muted-foreground">
                {description}
              </p>
              {reason && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-tan-sun-dark">
                  <LockIcon className="size-3" /> {reason}
                </p>
              )}
            </div>
            <span className="text-xs font-bold text-muted-foreground" aria-hidden>
              {on ? "Sí" : "No"}
            </span>
            <Switch id={id} checked={on} onCheckedChange={(next) => toggle(key, next)} disabled={disabled || !!reason} aria-describedby={`${id}-desc`} />
          </li>
        );
      })}
      <li className="flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed px-4 py-3 opacity-70">
        <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-eerie/20" />
        <div className="min-w-0 flex-1">
          <label htmlFor={`${baseId}-inventory`} className="flex items-center gap-2 text-sm font-bold">
            Inventario <Badge>Fase 2</Badge>
          </label>
          <p className="text-xs text-muted-foreground">Disponible en una próxima etapa.</p>
        </div>
        <Switch id={`${baseId}-inventory`} checked={false} disabled />
      </li>
    </ul>
  );
}
