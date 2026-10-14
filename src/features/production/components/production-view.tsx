"use client";

import { useMemo, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, FlaskConicalIcon, LockIcon, RefreshCwIcon } from "lucide-react";
import type { ProductionListItem } from "@/contracts/production";
import { usePermission } from "@/core/auth/session-provider";
import { FilterChips, type FilterOption } from "@/shared/components/data/filter-chips";
import { Pagination, usePagination } from "@/shared/components/data/pagination";
import { SearchInput } from "@/shared/components/data/search-input";
import { SpineCard, SpineCardHeader } from "@/shared/components/data/spine-card";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { notify } from "@/shared/components/feedback/notify";
import { ReadOnlyBanner } from "@/shared/components/feedback/read-only-banner";
import { usePageSubtitle } from "@/shared/components/layout/page-meta";
import { formatRelative, plural } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { useProductions, useProductionStages, useSyncProductions } from "../hooks/use-production";
import { filterProductions, type LinkFilter, type ProductionSort } from "../lib/production-filters";
import { ProductionFormModal } from "./production-form-modal";
import { ProductionList, ProductionListSkeleton } from "./production-list";

export function ProductionView() {
  const canWrite = usePermission("production");
  const { data, error, isPending, refetch } = useProductions();
  const { data: stages = [] } = useProductionStages();
  const sync = useSyncProductions();

  const [query, setQuery] = useState("");
  const [link, setLink] = useState<LinkFilter>("all");
  const [sort, setSort] = useState<ProductionSort>("stage-asc");
  const [editing, setEditing] = useState<ProductionListItem | null>(null);

  const items = useMemo(() => data?.items ?? [], [data]);
  const filtered = useMemo(() => filterProductions(items, { query, link, sort }), [items, query, link, sort]);
  const pagination = usePagination(filtered, 10, `${query}|${link}|${sort}`);
  const linkedCount = items.filter((p) => p.clickupListId).length;
  usePageSubtitle(data ? `${plural(items.length, "producción", "producciones")} · ${plural(linkedCount, "enlazada")} con ClickUp` : null);

  const filters: FilterOption<LinkFilter>[] = [
    { value: "all", label: "Todas" },
    { value: "linked", label: "Enlazadas", count: data ? linkedCount : undefined },
    { value: "unlinked", label: "Sin enlace", count: data ? items.length - linkedCount : undefined },
  ];

  const runSync = () =>
    sync.mutate(undefined, {
      onSuccess: ({ updated }) =>
        notify.success(
          "Sincronización completa",
          updated ? `${plural(updated, "producción cambió", "producciones cambiaron")} de etapa.` : "Todo estaba al día; ninguna etapa cambió.",
        ),
      onError: (e) => notify.error(e, "No se pudo actualizar desde ClickUp"),
    });

  const isEmptyCatalog = !!data && items.length === 0;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar por título o código…"
          className="lg:w-[330px]"
          aria-label="Buscar producciones"
        />
        <span aria-hidden className="hidden h-7 w-px bg-border lg:block" />
        <FilterChips options={filters} value={link} onChange={setLink} label="Filtrar por enlace con ClickUp" className="flex-1" />
        <span
          className="inline-flex h-8 items-center gap-1.5 self-start rounded-full bg-muted px-3 text-[11px] font-bold text-muted-foreground lg:self-auto"
          title="Esta vista usa datos de muestra hasta que el API de producción esté lista."
        >
          <FlaskConicalIcon className="size-3.5" /> Vista previa · pendiente de API
        </span>
      </div>

      {!canWrite && <ReadOnlyBanner moduleLabel="Producción" />}

      <SpineCard>
        <SpineCardHeader
          title="Producciones en curso"
          description={
            data ? (
              <>
                {plural(filtered.length, "producción", "producciones")}
                {filtered.length !== items.length ? ` de ${items.length}` : ""} · Última sincronización:{" "}
                {data.lastSyncedAt ? formatRelative(data.lastSyncedAt).toLowerCase() : "nunca"}
              </>
            ) : (
              "Cargando…"
            )
          }
          actions={
            <>
              {!isEmptyCatalog && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSort((s) => (s === "stage-asc" ? "stage-desc" : "stage-asc"))}
                  aria-label={`Ordenar por etapa ${sort === "stage-asc" ? "descendente" : "ascendente"}`}
                >
                  Etapa {sort === "stage-asc" ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
                </Button>
              )}
              {canWrite && (
                <Button size="sm" onClick={runSync} disabled={sync.isPending || isPending} aria-busy={sync.isPending}>
                  <RefreshCwIcon className={sync.isPending ? "animate-spin" : undefined} />
                  <span className="hidden sm:inline">{sync.isPending ? "Sincronizando…" : "Actualizar desde ClickUp"}</span>
                  <span className="sm:hidden">{sync.isPending ? "…" : "Actualizar"}</span>
                </Button>
              )}
              {!canWrite && (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-muted px-3 text-xs font-semibold text-muted-foreground">
                  <LockIcon className="size-3.5" /> Solo lectura
                </span>
              )}
            </>
          }
        />
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <ProductionListSkeleton />
        ) : isEmptyCatalog ? (
          <EmptyState
            title="Aún no hay producciones"
            description="Los proyectos con la relación Producción aparecerán aquí. Agrégala desde Proyectos para empezar a dar seguimiento y enlazarla con ClickUp."
            footnote="Vista previa con datos de muestra."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Ninguna producción coincide"
            description={query ? `No encontramos resultados para “${query}”. Prueba con otro título o código.` : "No hay producciones con este filtro."}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setLink("all");
                }}
              >
                Limpiar búsqueda y filtros
              </Button>
            }
          />
        ) : (
          <>
            <ProductionList items={pagination.pageItems} stages={stages} canWrite={canWrite} onEdit={setEditing} />
            <Pagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              onPageChange={pagination.setPage}
              summary={`Mostrando ${pagination.from}–${pagination.to} de ${plural(pagination.total, "producción", "producciones")}`}
            />
          </>
        )}
      </SpineCard>

      <ProductionFormModal target={editing} stages={stages} canWrite={canWrite} onClose={() => setEditing(null)} />
    </div>
  );
}
