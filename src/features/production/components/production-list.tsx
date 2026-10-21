"use client";

import { LinkIcon, PencilIcon } from "lucide-react";
import type { ProductionListItem, ProductionPhase } from "@/contracts/production";
import { formatCalendarDate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { computePhaseProgress } from "../lib/phase-progress";
import { BOOK_TYPE_LABELS, DATE_TBD, SOURCE_LABELS, STATUS_LABELS, STATUS_TONES } from "../lib/production-labels";
import { PhaseProgressBar } from "./phase-progress-bar";

const GRID = "md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)_auto] md:items-center md:gap-6";

export function ProductionList({
  items,
  phases,
  canWrite,
  onOpen,
}: {
  items: ProductionListItem[];
  phases: ProductionPhase[];
  canWrite: boolean;
  onOpen: (item: ProductionListItem) => void;
}) {
  return (
    <div role="table" aria-label="Listado de producciones">
      <div role="row" className={`hidden border-b px-6 py-3 ${GRID}`}>
        {["Proyecto", "Código al público", "Estado", "Fase actual", "Término estimado"].map((h) => (
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
          const finished = item.status === "FINISHED";
          const { position, total } = computePhaseProgress(phases, item.currentPhase, finished);
          return (
            <li key={item.projectId} role="row" className={`relative px-5 py-4 transition-colors hover:bg-crema/60 md:px-6 ${GRID}`}>
              <div role="cell" className="min-w-0 pr-12 md:pr-0">
                <button
                  type="button"
                  onClick={() => onOpen(item)}
                  className="text-left font-display text-[15px] leading-snug font-bold outline-none after:absolute after:inset-0 focus-visible:underline md:after:hidden"
                >
                  {item.projectTitle}
                </button>
                <p className="mt-0.5 truncate text-xs font-bold text-turquoise-dark">{item.authorName ?? "Sin autor registrado"}</p>
              </div>
              <div role="cell" className="mt-3 flex items-center gap-2 md:mt-0">
                <span className="text-[11px] font-semibold text-muted-foreground md:hidden">Código</span>
                <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-bold">{item.publicCode}</code>
              </div>
              <div role="cell" className="mt-2 flex flex-wrap items-center gap-1.5 md:mt-0 md:flex-col md:items-start">
                <Badge tone={STATUS_TONES[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  {item.source === "CLICKUP" && <LinkIcon aria-hidden className="size-3" />}
                  <span className="sr-only">Origen: </span>
                  {SOURCE_LABELS[item.source]}
                  {item.bookType && ` · ${BOOK_TYPE_LABELS[item.bookType]}`}
                </span>
              </div>
              <div role="cell" className="mt-3 md:mt-0">
                <PhaseProgressBar position={position} total={total} finished={finished} label={item.currentPhase?.label} />
              </div>
              <div role="cell" className="mt-2 text-[13px] md:mt-0">
                <span className="text-[11px] font-semibold text-muted-foreground md:hidden">Término estimado · </span>
                <span className={item.estimatedEndDate ? "font-semibold" : "text-muted-foreground"}>{formatCalendarDate(item.estimatedEndDate, DATE_TBD)}</span>
              </div>
              <div role="cell" className="absolute top-4 right-4 z-[1] md:static md:w-9">
                {canWrite && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar producción de ${item.projectTitle}`} onClick={() => onOpen(item)}>
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
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-24" />
          <div className="hidden w-9 md:block" />
        </li>
      ))}
    </ul>
  );
}
