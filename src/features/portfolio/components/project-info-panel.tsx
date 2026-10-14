"use client";

import Link from "next/link";
import { InfoIcon, LockIcon } from "lucide-react";
import { usePermission } from "@/core/auth/session-provider";
import { useProject } from "@/features/projects/hooks/use-projects";
import { SpineCard } from "@/shared/components/data/spine-card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";

function ReadOnlyField({ label, value, locked, className }: { label: string; value: string | null | undefined; locked?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="eyebrow mb-1.5">{label}</dt>
      <dd className="flex min-h-10 items-center gap-2 rounded-xl bg-muted px-3.5 py-2 text-sm">
        {locked && <LockIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />}
        {value ? <span>{value}</span> : <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

/** Read-only project data. It is edited in Proyectos (permission `projects`). */
export function ProjectInfoPanel({ projectId }: { projectId: string }) {
  const canEditProject = usePermission("projects");
  const { data: project, isPending } = useProject(projectId);

  return (
    <SpineCard spine="bg-grape" className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold">Información del proyecto</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {canEditProject
              ? "Se edita desde Proyectos para que sea la misma en todas las secciones."
              : "Se edita desde Proyectos, y para eso necesitas ese módulo."}
          </p>
        </div>
        {canEditProject ? (
          <Link href={`/proyectos?ver=${encodeURIComponent(projectId)}`} className="shrink-0 text-xs font-bold text-grape hover:underline">
            Editar en Proyectos →
          </Link>
        ) : (
          <Badge size="md" className="shrink-0 gap-1.5">
            <LockIcon className="size-3" /> Sin permiso
          </Badge>
        )}
      </div>

      {isPending || !project ? (
        <div className="mt-4 space-y-3" aria-busy="true">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <dl className="mt-4 grid gap-3.5 sm:grid-cols-[1fr_120px]">
          <ReadOnlyField label="Título" value={project.title} locked className="sm:col-span-2" />
          <ReadOnlyField label="Subtítulo" value={project.subtitle} />
          <ReadOnlyField label="Año" value={project.issueYear ? String(project.issueYear) : null} />
          <ReadOnlyField label="Descripción" value={project.description} className="sm:col-span-2" />
          <ReadOnlyField label="Cliente" value={project.client} className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <dt className="eyebrow mb-1.5">Tags</dt>
            <dd className="flex flex-wrap gap-1.5">
              {project.tags.length ? (
                project.tags.map((tag) => (
                  <Badge key={tag} tone="turquoise" size="md">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </dd>
          </div>
        </dl>
      )}

      {!canEditProject && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-tan-sun/25 px-3.5 py-3 text-xs text-eerie/80">
          <InfoIcon className="mt-px size-3.5 shrink-0 text-tan-sun-dark" />
          <span>
            Para cambiar el título, la descripción o los tags necesitas el módulo <strong className="font-bold text-eerie">Proyectos</strong>. Con el módulo
            Portafolio sí puedes editar portada, galería y publicación.
          </span>
        </p>
      )}
    </SpineCard>
  );
}
