"use client";

import { useMemo, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, LockIcon } from "lucide-react";
import { PRODUCTION_STATUSES, type ProductionListItem } from "@/contracts/production";
import { usePermission } from "@/core/auth/session-provider";
import { FilterChips, type FilterOption } from "@/shared/components/data/filter-chips";
import { Pagination, usePagination } from "@/shared/components/data/pagination";
import { SearchInput } from "@/shared/components/data/search-input";
import { SpineCard, SpineCardHeader } from "@/shared/components/data/spine-card";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { ReadOnlyBanner } from "@/shared/components/feedback/read-only-banner";
import { usePageSubtitle } from "@/shared/components/layout/page-meta";
import { plural } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { useProductionPhases, useProductions } from "../hooks/use-production";
import { filterProductions, type ProductionSort, type StatusFilter } from "../lib/production-filters";
import { STATUS_LABELS } from "../lib/production-labels";
import { ProductionFormModal } from "./production-form-modal";
import { ProductionList, ProductionListSkeleton } from "./production-list";

const STATUS_DOT = { NOT_STARTED: "bg-eerie/30", IN_PRODUCTION: "bg-bubblegum-dark", FINISHED: "bg-turquoise" } as const;

export function ProductionView() {
  const canWrite = usePermission("production");
  const { data, error, isPending, refetch } = useProductions();
  const { data: phases = [] } = useProductionPhases();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<ProductionSort>("delivery-asc");
  const [opened, setOpened] = useState<ProductionListItem | null>(null);

  const items = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterProductions(items, { query, status, sort }), [items, query, status, sort]);
  const pagination = usePagination(filtered, 10, `${query}|${status}|${sort}`);
  const count = (s: ProductionListItem["status"]) => items.filter((p) => p.status === s).length;
  usePageSubtitle(data ? `${plural(items.length, "producción", "producciones")} · ${count("IN_PRODUCTION")} en producción` : null);

  const filters: FilterOption<StatusFilter>[] = [
    { value: "all", label: "Todas" },
    ...PRODUCTION_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s], dot: STATUS_DOT[s], count: data ? count(s) : undefined })),
  ];

  const isEmptyCatalog = !!data && items.length === 0;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar por título, autor o código…"
          className="lg:w-[330px]"
          aria-label="Buscar producciones"
        />
        <span aria-hidden className="hidden h-7 w-px bg-border lg:block" />
        <FilterChips options={filters} value={status} onChange={setStatus} label="Filtrar por estado" className="flex-1" />
      </div>

      {!canWrite && <ReadOnlyBanner moduleLabel="Producción" />}

      <SpineCard>
        <SpineCardHeader
          title="Producciones"
          description={
            data
              ? `${plural(filtered.length, "producción", "producciones")}${filtered.length !== items.length ? ` de ${items.length}` : ""} · abre una para capturar su avance o vincularla con ClickUp`
              : "Cargando…"
          }
          actions={
            <>
              {!isEmptyCatalog && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSort((s) => (s === "delivery-asc" ? "delivery-desc" : "delivery-asc"))}
                  aria-label={`Ordenar por término estimado ${sort === "delivery-asc" ? "descendente" : "ascendente"}`}
                >
                  Término {sort === "delivery-asc" ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
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
            description="Los proyectos con la relación Producción aparecerán aquí. Agrégala desde Proyectos para empezar a dar seguimiento y vincularla con ClickUp."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Ninguna producción coincide"
            description={query ? `No encontramos resultados para “${query}”. Prueba con otro título, autor o código.` : "No hay producciones con este estado."}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                Limpiar búsqueda y filtros
              </Button>
            }
          />
        ) : (
          <>
            <ProductionList items={pagination.pageItems} phases={phases} canWrite={canWrite} onOpen={setOpened} />
            <Pagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              onPageChange={pagination.setPage}
              summary={`Mostrando ${pagination.from}–${pagination.to} de ${plural(pagination.total, "producción", "producciones")}`}
            />
          </>
        )}
      </SpineCard>

      <ProductionFormModal target={opened} phases={phases} canWrite={canWrite} onClose={() => setOpened(null)} />
    </div>
  );
}
