"use client";

import { EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { ProjectListItem } from "@/contracts/projects";
import type { RelationKey } from "@/shared/lib/relations";
import { formatRelative } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { updatedAtOf } from "../lib/project-filters";
import { RelationChips } from "./relation-chips";

export interface ProjectRowActions {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (project: ProjectListItem) => void;
}

const GRID = "md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,0.8fr)_auto] md:items-center md:gap-6";

function IconAction({ label, onClick, children, tone }: { label: string; onClick: () => void; children: React.ReactNode; tone?: "danger" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onClick={onClick}
          className={tone === "danger" ? "hover:border-destructive/40 hover:text-destructive" : undefined}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ProjectList({
  items,
  relationsOf,
  canWrite,
  actions,
}: {
  items: ProjectListItem[];
  relationsOf: (project: ProjectListItem) => RelationKey[];
  canWrite: boolean;
  actions: ProjectRowActions;
}) {
  return (
    <div role="table" aria-label="Listado de proyectos">
      <div role="row" className={`hidden border-b px-6 py-3 ${GRID}`}>
        {["Proyecto", "Relaciones", "Actualizado"].map((h) => (
          <span key={h} role="columnheader" className="eyebrow">
            {h}
          </span>
        ))}
        <span role="columnheader" className="eyebrow w-[106px] text-right">
          Acciones
        </span>
      </div>
      <ul role="rowgroup" className="divide-y">
        {items.map((project) => (
          <li key={project.id} role="row" className={`relative px-5 py-4 transition-colors hover:bg-crema/60 md:px-6 ${GRID}`}>
            <div role="cell" className="min-w-0 pr-24 md:pr-0">
              <button
                type="button"
                onClick={() => actions.onView(project.id)}
                className="text-left font-display text-[15px] leading-snug font-bold outline-none after:absolute after:inset-0 focus-visible:underline md:after:hidden"
              >
                {project.title}
              </button>
              {project.subtitle && <p className="mt-0.5 truncate text-xs font-bold text-turquoise-dark">{project.subtitle}</p>}
              {project.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{project.description}</p>}
            </div>
            <div role="cell" className="mt-3 md:mt-0">
              <RelationChips relations={relationsOf(project)} />
            </div>
            <div role="cell" className="mt-2 text-xs text-muted-foreground md:mt-0 md:text-[13px]">
              <span className="md:hidden">Actualizado · </span>
              {formatRelative(updatedAtOf(project))}
            </div>
            <div role="cell" className="absolute top-4 right-4 z-[1] flex justify-end gap-1.5 md:static md:w-[106px]">
              <span className="hidden md:inline-flex">
                <IconAction label="Ver información" onClick={() => actions.onView(project.id)}>
                  <EyeIcon />
                </IconAction>
              </span>
              {canWrite && (
                <>
                  <IconAction label="Editar" onClick={() => actions.onEdit(project.id)}>
                    <PencilIcon />
                  </IconAction>
                  <IconAction label="Eliminar" tone="danger" onClick={() => actions.onDelete(project)}>
                    <Trash2Icon />
                  </IconAction>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectListSkeleton() {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Cargando proyectos">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className={`px-5 py-5 md:px-6 ${GRID}`}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="mt-3 h-5 w-40 md:mt-0" />
          <Skeleton className="mt-2 h-3 w-20 md:mt-0" />
          <div className="hidden w-[106px] md:block" />
        </li>
      ))}
    </ul>
  );
}
