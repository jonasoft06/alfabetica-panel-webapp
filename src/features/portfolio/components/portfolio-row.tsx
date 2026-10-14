"use client";

import type { CSSProperties, Ref } from "react";
import { GripVerticalIcon, LockIcon, PencilIcon } from "lucide-react";
import type { PortfolioListItem } from "@/contracts/portfolio";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { CoverThumb } from "@/shared/components/data/cover-thumb";

/** Desktop grid template; mobile rows are flex cards. Exposed through a CSS variable. */
export function gridTemplate({ selectable, reorder }: { selectable: boolean; reorder: boolean }) {
  return [selectable && "28px", reorder && "72px", "60px", "minmax(0,1fr)", "170px", "40px"].filter(Boolean).join(" ");
}

export function StatusBadges({ item, className }: { item: PortfolioListItem; className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Badge tone={item.isPublished ? "turquoise" : "neutral"}>{item.isPublished ? "Publicado" : "No publicado"}</Badge>
      {!item.cover && <Badge tone="tangerine">Sin portada</Badge>}
    </span>
  );
}

export interface PortfolioRowProps {
  item: PortfolioListItem;
  selectable: boolean;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
  canWrite: boolean;
  onEdit: (item: PortfolioListItem) => void;
  /** Reorder mode: 1-based position and the drag handle node. */
  position?: number;
  handle?: React.ReactNode;
  template: string;
  rowRef?: Ref<HTMLLIElement>;
  style?: CSSProperties;
  dragging?: boolean;
}

export function PortfolioRow({
  item,
  selectable,
  selected,
  onSelectedChange,
  canWrite,
  onEdit,
  position,
  handle,
  template,
  rowRef,
  style,
  dragging,
}: PortfolioRowProps) {
  const reorder = position !== undefined;
  const actionLabel = canWrite ? `Editar ${item.title}` : `Ver ${item.title} (solo lectura)`;
  return (
    <li
      ref={rowRef}
      role="row"
      aria-selected={selectable ? selected : undefined}
      style={{ ...style, "--cols": template } as CSSProperties}
      className={cn(
        "relative flex items-start gap-3 bg-card px-4 py-3.5 transition-colors md:grid md:grid-cols-(--cols) md:items-center md:gap-4 md:px-6",
        selected ? "bg-turquoise/10" : "hover:bg-crema/60",
        dragging && "z-10 shadow-lg ring-2 ring-module",
      )}
    >
      {selectable && (
        <div role="cell" className="flex h-11 items-center md:h-auto">
          <Checkbox checked={selected} onCheckedChange={(v) => onSelectedChange(v === true)} aria-label={`Seleccionar ${item.title}`} />
        </div>
      )}
      {reorder && (
        <div role="cell" className="flex h-11 items-center gap-1 md:h-auto md:gap-2">
          {handle}
          <span className="w-4 text-center font-display text-sm font-bold md:w-6 md:text-base">{position}</span>
        </div>
      )}
      <div role="cell">
        <CoverThumb cover={item.cover} title={item.title} className="w-9 md:w-11" />
      </div>
      <div role="cell" className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="text-left font-display text-[15px] leading-snug font-bold outline-none after:absolute after:inset-0 focus-visible:underline md:after:hidden"
        >
          {item.title}
        </button>
        {item.subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.subtitle}</p>}
        <StatusBadges item={item} className="mt-2 md:hidden" />
      </div>
      <div role="cell" className="hidden md:block">
        <StatusBadges item={item} />
      </div>
      <div role="cell" className="relative z-[1] flex justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={actionLabel} onClick={() => onEdit(item)} className={canWrite ? undefined : "border-dashed"}>
              {canWrite ? <PencilIcon /> : <LockIcon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{canWrite ? "Editar" : "Solo lectura"}</TooltipContent>
        </Tooltip>
      </div>
    </li>
  );
}

export function DragHandle({ label, ...props }: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30 active:cursor-grabbing"
      {...props}
    >
      <GripVerticalIcon className="size-4" />
    </button>
  );
}
