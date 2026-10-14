"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LockIcon } from "lucide-react";
import { clientEnv } from "@/config/env.client";
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
import { usePublications } from "../hooks/use-publications";
import { filterPublications, type StateFilter, type TypeFilter } from "../lib/publication-filters";
import { TYPE_LABELS } from "../lib/publication-types";
import { PublicationModal } from "./publication-modal";
import { StoreComingSoon } from "./store-coming-soon";
import { StoreList, StoreListSkeleton } from "./store-list";

const TYPE_DOTS = { SALE: "bg-tangerine", LINK: "bg-turquoise", DOI: "bg-grape" } as const;

/** /tienda: "Próximamente" while the feature flag is off, the full module otherwise. */
export function StoreView() {
  return clientEnv.features.store ? <StoreCatalog /> : <StoreComingSoon />;
}

function StoreCatalog() {
  const canWrite = usePermission("publication");
  const { data, error, isPending, refetch } = usePublications();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [state, setState] = useState<StateFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(() => data?.items ?? [], [data]);
  const filtered = useMemo(() => filterPublications(items, { query, type, state }), [items, query, type, state]);
  const pagination = usePagination(filtered, 10, `${query}|${type}|${state}`);
  usePageSubtitle(data ? `${plural(data.counts.total, "título")} · ${plural(data.counts.published, "publicado")}` : null);

  const counts = data?.counts;
  const typeFilters: FilterOption<TypeFilter>[] = [
    { value: "all", label: "Todos", count: counts?.total },
    ...(["SALE", "LINK", "DOI"] as const).map((t) => ({ value: t, label: TYPE_LABELS[t], dot: TYPE_DOTS[t], count: counts?.byType[t] })),
  ];
  const stateFilters: FilterOption<StateFilter>[] = [
    { value: "all", label: "Cualquier estado" },
    { value: "published", label: "Publicados" },
    { value: "draft", label: "Sin publicar" },
  ];

  const isEmptyCatalog = !!data && items.length === 0;
  const resetFilters = () => {
    setQuery("");
    setType("all");
    setState("all");
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={query} onValueChange={setQuery} placeholder="Buscar por título o subtítulo…" className="lg:w-[330px]" aria-label="Buscar títulos" />
        <span aria-hidden className="hidden h-7 w-px bg-border lg:block" />
        <FilterChips options={typeFilters} value={type} onChange={setType} label="Filtrar por tipo" className="flex-1" />
        {!canWrite && (
          <span className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground lg:self-auto">
            <LockIcon className="size-4" /> Solo lectura
          </span>
        )}
      </div>
      <FilterChips options={stateFilters} value={state} onChange={setState} label="Filtrar por estado de publicación" />

      {!canWrite && <ReadOnlyBanner moduleLabel="Tienda" />}

      <SpineCard>
        {!isEmptyCatalog && (
          <SpineCardHeader
            title="Títulos de la tienda"
            description={data ? `${plural(filtered.length, "título")}${filtered.length !== items.length ? ` de ${items.length}` : " en total"}` : "Cargando…"}
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href="/proyectos">Agregar desde Proyectos</Link>
              </Button>
            }
          />
        )}
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <StoreListSkeleton />
        ) : isEmptyCatalog ? (
          <EmptyState
            title="La tienda aún no tiene títulos"
            description="Un título entra a la Tienda cuando su proyecto tiene la relación de Tienda. Agrégala desde Proyectos y aparecerá aquí para completar su ficha."
            action={
              <Button asChild>
                <Link href="/proyectos">Ir a Proyectos</Link>
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Ningún título coincide"
            description={
              query ? `No encontramos resultados para “${query}”. Revisa la ortografía o prueba con otro filtro.` : "No hay títulos con esos filtros."
            }
            action={
              <Button variant="outline" onClick={resetFilters}>
                Limpiar búsqueda y filtros
              </Button>
            }
          />
        ) : (
          <>
            <StoreList items={pagination.pageItems} canWrite={canWrite} onOpen={setOpenId} />
            <Pagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              onPageChange={pagination.setPage}
              summary={`Mostrando ${pagination.from}–${pagination.to} de ${plural(pagination.total, "título")}`}
            />
          </>
        )}
      </SpineCard>

      <PublicationModal item={items.find((i) => i.projectId === openId) ?? null} canWrite={canWrite} onClose={() => setOpenId(null)} />
    </div>
  );
}
