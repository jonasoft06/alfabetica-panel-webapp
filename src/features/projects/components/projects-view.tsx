"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon, LockIcon, PlusIcon } from "lucide-react";
import type { ProjectDetail, ProjectListItem } from "@/contracts/projects";
import { usePermission } from "@/core/auth/session-provider";
import { publicationApi, publicationKeys } from "@/features/store/api/publication-api";
import { FilterChips, type FilterOption } from "@/shared/components/data/filter-chips";
import { Pagination, usePagination } from "@/shared/components/data/pagination";
import { SearchInput } from "@/shared/components/data/search-input";
import { SpineCard, SpineCardHeader } from "@/shared/components/data/spine-card";
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { notify } from "@/shared/components/feedback/notify";
import { ReadOnlyBanner } from "@/shared/components/feedback/read-only-banner";
import { usePageSubtitle } from "@/shared/components/layout/page-meta";
import { useDeferredAction } from "@/shared/hooks/use-deferred-action";
import { plural } from "@/shared/lib/format";
import { RELATIONS, type RelationKey } from "@/shared/lib/relations";
import { Button } from "@/shared/ui/button";
import { useProjects } from "../hooks/use-projects";
import { useDeleteProject, useRemoveRelation } from "../hooks/use-project-mutations";
import { filterProjects, type RelationFilter, type SortDirection } from "../lib/project-filters";
import { RELATION_CONSEQUENCES } from "../lib/relation-consequences";
import { ProjectDetailModal } from "./project-detail-modal";
import { ProjectFormModal } from "./project-form-modal";
import { ProjectList, ProjectListSkeleton } from "./project-list";
import { activeRelations } from "./relation-chips";

type FormMode = { kind: "create" } | { kind: "edit"; projectId: string } | null;
type RemoveTarget = { project: ProjectDetail; relation: RelationKey } | null;

export function ProjectsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const canWrite = usePermission("projects");
  const { data, error, isPending, refetch } = useProjects();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [relation, setRelation] = useState<RelationFilter>("all");
  const [sort, setSort] = useState<SortDirection>("desc");
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget>(null);
  const [hidden, setHidden] = useState<Record<string, RelationKey[]>>({});
  const viewId = params.get("ver");

  const deleteProject = useDeleteProject();
  const removeRelation = useRemoveRelation();
  const deferred = useDeferredAction();

  /* ---- URL-synced detail panel (?ver=<id>) so links from Resumen can open it ---- */
  const setViewId = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params);
      if (id) next.set("ver", id);
      else next.delete("ver");
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [params, pathname, router],
  );

  /* ---- relations pending removal (deferred so "Deshacer" works) ---- */
  const hiddenRelations = useCallback((id: string) => hidden[id] ?? [], [hidden]);
  const setHiddenFor = (id: string, update: (current: RelationKey[]) => RelationKey[]) => setHidden((h) => ({ ...h, [id]: update(h[id] ?? []) }));

  const relationsOf = useCallback((p: ProjectListItem) => activeRelations(p).filter((r) => !hiddenRelations(p.id).includes(r)), [hiddenRelations]);

  const sectionsForRemoval = useQuery({
    queryKey: publicationKeys.sections(removeTarget?.project.id ?? ""),
    queryFn: () => publicationApi.sections(removeTarget!.project.id),
    enabled: removeTarget?.relation === "publication",
  });

  const confirmRemoveRelation = () => {
    if (!removeTarget) return;
    const { project, relation: key } = removeTarget;
    const actionKey = `${project.id}:${key}`;
    setHiddenFor(project.id, (c) => [...c, key]);
    setRemoveTarget(null);
    deferred.schedule(actionKey, () =>
      removeRelation.mutate(
        { id: project.id, relation: key },
        {
          onSettled: () => setHiddenFor(project.id, (c) => c.filter((r) => r !== key)),
          onError: (e) => notify.error(e, `No se pudo quitar la relación con ${RELATIONS[key].label}`),
        },
      ),
    );
    notify.removed(`Relación de ${RELATIONS[key].label} eliminada`, `${project.title} · se borrará su información`, () => {
      if (deferred.cancel(actionKey)) {
        setHiddenFor(project.id, (c) => c.filter((r) => r !== key));
        notify.info("Relación conservada", project.title);
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteProject.mutate(target.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        setFormMode(null);
        if (viewId === target.id) setViewId(null);
        notify.removed("Proyecto eliminado", target.title);
      },
      onError: (e) => notify.error(e, "No se pudo eliminar el proyecto"),
    });
  };

  /* ---- derived list ---- */
  const items = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterProjects(items, { query, relation, sort }), [items, query, relation, sort]);
  const pagination = usePagination(filtered, 10, `${query}|${relation}|${sort}`);
  const published = items.filter((p) => p.isPublished).length;
  usePageSubtitle(data ? `${plural(items.length, "proyecto")} · ${plural(published, "publicado")}` : null);

  const count = (key: RelationKey) => items.filter((p) => relationsOf(p).includes(key)).length;
  const filters: FilterOption<RelationFilter>[] = [
    { value: "all", label: "Todos" },
    { value: "portfolio", label: "Portafolio", dot: RELATIONS.portfolio.dot, count: data ? count("portfolio") : undefined },
    { value: "publication", label: "Tienda", dot: RELATIONS.publication.dot, count: data ? count("publication") : undefined },
    { value: "production", label: "Producción", dot: RELATIONS.production.dot, count: data ? count("production") : undefined },
  ];

  const isEmptyCatalog = data && items.length === 0;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar por título, subtítulo o cliente…"
          className="lg:w-[330px]"
          aria-label="Buscar proyectos"
        />
        <span aria-hidden className="hidden h-7 w-px bg-border lg:block" />
        <FilterChips options={filters} value={relation} onChange={setRelation} label="Filtrar por relación" className="flex-1" />
        {canWrite ? (
          <Button
            size="lg"
            onClick={() => setFormMode({ kind: "create" })}
            className="fixed right-4 bottom-[88px] z-30 rounded-2xl shadow-lg md:static md:rounded-xl md:shadow-sm"
          >
            <PlusIcon /> Nuevo proyecto
          </Button>
        ) : (
          <span className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground lg:self-auto">
            <LockIcon className="size-4" /> Solo lectura
          </span>
        )}
      </div>

      {!canWrite && <ReadOnlyBanner moduleLabel="Proyectos" />}

      <SpineCard>
        {!isEmptyCatalog && (
          <SpineCardHeader
            title="Listado de proyectos"
            description={data ? `${plural(filtered.length, "proyecto")}${filtered.length !== items.length ? ` de ${items.length}` : " en total"}` : "Cargando…"}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
                aria-label={`Ordenar por actualización ${sort === "desc" ? "ascendente" : "descendente"}`}
              >
                Actualizado {sort === "desc" ? <ArrowDownIcon className="size-3" /> : <ArrowUpIcon className="size-3" />}
              </Button>
            }
          />
        )}
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <ProjectListSkeleton />
        ) : isEmptyCatalog ? (
          <EmptyState
            title="La repisa está vacía"
            description="Aún no hay proyectos en el catálogo. Crea el primero y decide en el momento si vivirá en Portafolio, en Tienda o en Producción."
            action={
              canWrite && (
                <Button onClick={() => setFormMode({ kind: "create" })}>
                  <PlusIcon /> Crear el primer proyecto
                </Button>
              )
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Ningún proyecto coincide"
            description={
              query ? `No encontramos resultados para “${query}”. Revisa la ortografía o prueba con otro filtro.` : "No hay proyectos con esta relación."
            }
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setRelation("all");
                }}
              >
                Limpiar búsqueda y filtros
              </Button>
            }
          />
        ) : (
          <>
            <ProjectList
              items={pagination.pageItems}
              relationsOf={relationsOf}
              canWrite={canWrite}
              actions={{ onView: setViewId, onEdit: (id) => setFormMode({ kind: "edit", projectId: id }), onDelete: setDeleteTarget }}
            />
            <Pagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              onPageChange={pagination.setPage}
              summary={`Mostrando ${pagination.from}–${pagination.to} de ${plural(pagination.total, "proyecto")}`}
            />
          </>
        )}
      </SpineCard>

      <ProjectDetailModal
        projectId={viewId}
        onClose={() => setViewId(null)}
        canWrite={canWrite}
        hiddenRelations={hiddenRelations}
        onEdit={(id) => {
          setViewId(null);
          setFormMode({ kind: "edit", projectId: id });
        }}
        onDelete={setDeleteTarget}
      />

      <ProjectFormModal
        mode={formMode}
        onClose={() => setFormMode(null)}
        hiddenRelations={hiddenRelations}
        onRequestRemoveRelation={(project, key) => setRemoveTarget({ project, relation: key })}
        onRequestDelete={setDeleteTarget}
        onView={setViewId}
      />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={removeTarget ? `Vas a quitar la relación con ${RELATIONS[removeTarget.relation].label}` : ""}
        description={
          removeTarget && (
            <>
              Al quitar esta relación de <strong className="text-eerie">{removeTarget.project.title}</strong> se borrará toda la información que vive en esa
              sección. Tendrás unos segundos para deshacerlo.
            </>
          )
        }
        consequences={removeTarget ? RELATION_CONSEQUENCES[removeTarget.relation]({ sections: sectionsForRemoval.data?.length }) : []}
        footnote="La información general del proyecto y sus otras relaciones no se tocan."
        safeguard={{
          type: "checkbox",
          label: removeTarget ? `Entiendo que la información de ${RELATIONS[removeTarget.relation].label} se borrará de forma permanente.` : "",
        }}
        cancelLabel="Conservar relación"
        confirmLabel="Quitar y borrar datos"
        onConfirm={confirmRemoveRelation}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        icon="trash"
        title="Eliminar este proyecto"
        description={
          deleteTarget && (
            <>
              Se eliminará <strong className="text-eerie">{deleteTarget.title}</strong> junto con sus relaciones y toda su información. Esta acción no se puede
              deshacer.
            </>
          )
        }
        consequencesTitle="Se eliminará por completo"
        consequences={[
          "Información general, tags y cliente",
          "Portafolio · publicación en la web",
          "Tienda · precio, secciones y ficha de venta",
          "Producción · código al público y enlace con ClickUp",
        ]}
        safeguard={{ type: "keyword", keyword: "ELIMINAR" }}
        confirmLabel="Eliminar proyecto"
        pending={deleteProject.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
