"use client";

import { PencilIcon } from "lucide-react";
import type { ProductionListItem, ProductionStage } from "@/contracts/production";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { positionOfStage } from "../lib/stage-progress";
import { ClickupLink } from "./link-badge";
import { StageProgressBar } from "./stage-progress-bar";

const GRID = "md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.6fr)_auto] md:items-center md:gap-6";

export function ProductionList({
  items,
  stages,
  canWrite,
  onEdit,
}: {
  items: ProductionListItem[];
  stages: ProductionStage[];
  canWrite: boolean;
  onEdit: (item: ProductionListItem) => void;
}) {
  return (
    <div role="table" aria-label="Listado de producciones">
      <div role="row" className={`hidden border-b px-6 py-3 ${GRID}`}>
        {["Proyecto", "Código al público", "Enlace con ClickUp", "Etapa actual"].map((h) => (
          <span key={h} role="columnheader" className="eyebrow">
            {h}
          </span>
        ))}
        <span role="columnheader" className="eyebrow w-9 text-right">
          <span className="sr-only">Acciones</span>
        </span>
      </div>
      <ul role="rowgroup" className="divide-y">
        {items.map((item) => {
          const { position, total } = positionOfStage(stages, item.currentStage?.id);
          return (
            <li key={item.id} role="row" className={`relative px-5 py-4 transition-colors hover:bg-crema/60 md:px-6 ${GRID}`}>
              <div role="cell" className="min-w-0 pr-12 md:pr-0">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="text-left font-display text-[15px] leading-snug font-bold outline-none after:absolute after:inset-0 focus-visible:underline md:after:hidden"
                >
                  {item.title}
                </button>
                {item.subtitle && <p className="mt-0.5 truncate text-xs font-bold text-turquoise-dark">{item.subtitle}</p>}
              </div>
              <div role="cell" className="mt-3 flex items-center gap-2 md:mt-0">
                <span className="text-[11px] font-semibold text-muted-foreground md:hidden">Código</span>
                <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-bold">{item.publicCode}</code>
              </div>
              <div role="cell" className="mt-2 md:mt-0">
                <ClickupLink listId={item.clickupListId} />
              </div>
              <div role="cell" className="mt-3 md:mt-0">
                <StageProgressBar position={position} total={total} label={item.currentStage?.clientLabel} />
              </div>
              <div role="cell" className="absolute top-4 right-4 z-[1] md:static md:w-9">
                {canWrite && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar producción de ${item.title}`} onClick={() => onEdit(item)}>
                        <PencilIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ProductionListSkeleton() {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Cargando producciones">
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className={`space-y-3 px-5 py-5 md:space-y-0 md:px-6 ${GRID}`}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-full" />
          <div className="hidden w-9 md:block" />
        </li>
      ))}
    </ul>
  );
}
