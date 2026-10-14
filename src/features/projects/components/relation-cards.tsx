"use client";

import { CheckIcon, ImageIcon, BookOpenIcon, LockIcon, PackageIcon, PlusIcon, XIcon } from "lucide-react";
import type { PublicationType } from "@/contracts/publication";
import { TYPE_DESCRIPTIONS } from "@/features/store/lib/publication-types";
import { cn } from "@/shared/lib/cn";
import { RELATIONS, type RelationKey } from "@/shared/lib/relations";
import { Badge } from "@/shared/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { RELATION_DESCRIPTIONS } from "../lib/relation-consequences";

const ICONS = { portfolio: ImageIcon, publication: BookOpenIcon, production: PackageIcon } as const;
const ORDER: RelationKey[] = ["portfolio", "publication", "production"];
const TINT: Record<RelationKey, string> = {
  portfolio: "bg-turquoise/15 text-turquoise-dark",
  publication: "bg-tangerine/15 text-tangerine",
  production: "bg-bubblegum/25 text-bubblegum-dark",
};
const SELECTED: Record<RelationKey, string> = {
  portfolio: "border-turquoise bg-turquoise/[0.07]",
  publication: "border-tangerine bg-tangerine/[0.06]",
  production: "border-bubblegum-dark bg-bubblegum/[0.12]",
};
/** Single source for publication type names (owned by the store module). */
export const PUBLICATION_TYPE_LABELS = Object.fromEntries(
  (Object.keys(TYPE_DESCRIPTIONS) as PublicationType[]).map((t) => [t, TYPE_DESCRIPTIONS[t].title]),
) as Record<PublicationType, string>;

/** The publication relation is shown as "Venta" while the store module is disabled. */
const labelFor = (key: RelationKey, storeEnabled: boolean) => (key === "publication" && !storeEnabled ? "Venta" : RELATIONS[key].label);

function ComingSoonCard({ compact }: { compact?: boolean }) {
  return (
    <div className="relative rounded-2xl border-[1.5px] border-dashed border-eerie/15 bg-muted/70 p-4 opacity-80">
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", TINT.publication)}>
          <BookOpenIcon className="size-4" />
        </span>
        <Badge tone="tan">PRÓXIMAMENTE</Badge>
      </div>
      <p className="mt-3 text-sm font-bold text-eerie/60">Venta</p>
      <p className="mt-1 text-xs text-muted-foreground">Aún no disponible: la Tienda llega en una próxima actualización.</p>
      {compact && (
        <span className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-border text-xs font-bold text-muted-foreground">
          <LockIcon className="size-3" /> No disponible
        </span>
      )}
    </div>
  );
}

/** Create mode: pick which relations the new project starts with. */
export function RelationSelector({
  value,
  onChange,
  publicationType,
  onPublicationTypeChange,
  storeEnabled,
  canPublication,
}: {
  value: RelationKey[];
  onChange: (value: RelationKey[]) => void;
  publicationType: PublicationType;
  onPublicationTypeChange: (type: PublicationType) => void;
  storeEnabled: boolean;
  canPublication: boolean;
}) {
  const toggle = (key: RelationKey) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ORDER.map((key) => {
        if (key === "publication" && (!storeEnabled || !canPublication)) return <ComingSoonCard key={key} />;
        const Icon = ICONS[key];
        const selected = value.includes(key);
        return (
          <div
            key={key}
            className={cn("relative rounded-2xl border-[1.5px] p-4 transition-colors", selected ? SELECTED[key] : "border-border bg-card hover:bg-muted/50")}
          >
            {selected && <span aria-hidden className={cn("absolute top-4 bottom-4 left-0 w-1 rounded-r-sm", RELATIONS[key].spine)} />}
            <button
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(key)}
              className="block w-full text-left outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/30"
            >
              <span className="flex items-start justify-between">
                <span className={cn("flex size-8 items-center justify-center rounded-lg", TINT[key])}>
                  <Icon className="size-4" />
                </span>
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-md border-[1.5px]",
                    selected ? "border-transparent bg-turquoise-dark text-near-white" : "border-input",
                  )}
                >
                  {selected && <CheckIcon className="size-3.5" strokeWidth={3} />}
                </span>
              </span>
              <span className="mt-3 block text-sm font-bold">{labelFor(key, storeEnabled)}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{RELATION_DESCRIPTIONS[key]}</span>
            </button>
            {key === "publication" && selected && (
              <div className="relative z-[1] mt-3">
                <Select value={publicationType} onValueChange={(v) => onPublicationTypeChange(v as PublicationType)}>
                  <SelectTrigger className="h-9 text-xs" aria-label="Tipo de publicación">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PUBLICATION_TYPE_LABELS) as PublicationType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {PUBLICATION_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Edit mode: show each relation's state with "Quitar relación" / "Agregar relación". */
export function RelationManager({
  active,
  summaries,
  storeEnabled,
  busy,
  onAdd,
  onRemove,
}: {
  active: RelationKey[];
  summaries: Partial<Record<RelationKey, string | null>>;
  storeEnabled: boolean;
  busy?: RelationKey | null;
  onAdd: (key: RelationKey) => void;
  onRemove: (key: RelationKey) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ORDER.map((key) => {
        if (key === "publication" && !storeEnabled && !active.includes(key)) return <ComingSoonCard key={key} compact />;
        const isActive = active.includes(key);
        return (
          <div
            key={key}
            className={cn(
              "relative flex flex-col rounded-2xl border-[1.5px] p-4",
              isActive ? "border-border bg-card" : "border-dashed border-eerie/15 bg-muted/40",
            )}
          >
            {isActive && <span aria-hidden className={cn("absolute top-4 bottom-4 left-0 w-1 rounded-r-sm", RELATIONS[key].spine)} />}
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">{labelFor(key, storeEnabled)}</p>
              {isActive ? (
                <Badge tone={key === "portfolio" ? "turquoise" : key === "publication" ? "tangerine" : "bubblegum"}>Activa</Badge>
              ) : (
                <Badge>Inactiva</Badge>
              )}
            </div>
            <p className="mt-1.5 flex-1 text-xs text-muted-foreground">
              {isActive ? (summaries[key] ?? RELATION_DESCRIPTIONS[key]) : RELATION_DESCRIPTIONS[key]}
            </p>
            {isActive ? (
              <button
                type="button"
                disabled={busy === key}
                onClick={() => onRemove(key)}
                className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-destructive/30 text-xs font-bold text-destructive transition-colors hover:bg-destructive/[0.06] disabled:opacity-50"
              >
                <XIcon className="size-3.5" /> Quitar relación
              </button>
            ) : (
              <button
                type="button"
                disabled={busy === key}
                onClick={() => onAdd(key)}
                className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-border text-xs font-bold transition-colors hover:bg-muted disabled:opacity-50"
              >
                <PlusIcon className="size-3.5" /> {busy === key ? "Agregando…" : "Agregar relación"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
