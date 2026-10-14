"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ExternalLinkIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { usePermission } from "@/core/auth/session-provider";
import type { PortfolioListItem } from "@/contracts/portfolio";
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
import { plural } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { usePortfolio } from "../hooks/use-portfolio";
import { useBatchVisibility, useSaveOrder } from "../hooks/use-portfolio-mutations";
import { describePlan, planBatch } from "../lib/batch-plan";
import { getLimitError } from "../lib/limit-error";
import {
  changedOrders,
  filterPortfolio,
  FILTER_LABELS,
  matchesFilter,
  matchesQuery,
  publishedInOrder,
  SORT_LABELS,
  type PortfolioFilter,
  type PortfolioSort,
} from "../lib/portfolio-filters";
import { BatchBar } from "./batch-bar";
import { LimitMeter } from "./limit-meter";
import { PortfolioEditModal } from "./portfolio-edit-modal";
import { PortfolioList, PortfolioListSkeleton } from "./portfolio-list";

/** TODO(api): public site URL should come from SiteSettings; placeholder until then. */
const SITE_URL = "https://alfabetica.com.mx";
const PAGE_SIZE = 10;
const EMPTY_ITEMS: PortfolioListItem[] = [];

export function PortfolioView() {
  const canWrite = usePermission("portfolio");
  const canProjects = usePermission("projects");
  const { data, error, isPending, refetch } = usePortfolio();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PortfolioFilter>("all");
  const [sort, setSort] = useState<PortfolioSort>("published");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [editId, setEditId] = useState<string | null>(null);
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);

  const batch = useBatchVisibility();
  const saveOrder = useSaveOrder();

  const items = data?.items ?? EMPTY_ITEMS;
  const counts = data?.counts;
  const maxItems = data?.maxItems ?? 10;
  const publishedCount = counts?.published ?? 0;
  usePageSubtitle(counts ? `${plural(publishedCount, "título publicado", "títulos publicados")} en portafolio` : null);

  /* ---- derived list ---- */
  const reorderMode = canWrite && filter === "published" && query.trim() === "";
  const filtered = useMemo(() => filterPortfolio(items, { query, filter, sort }), [items, query, filter, sort]);
  const pagination = usePagination(filtered, PAGE_SIZE, `${query}|${filter}|${sort}`);

  const baseOrder = useMemo(() => publishedInOrder(items), [items]);
  const orderedItems = useMemo(() => {
    if (!draftOrder) return baseOrder;
    const byId = new Map(baseOrder.map((i) => [i.id, i]));
    const known = draftOrder.flatMap((id) => byId.get(id) ?? []);
    return [...known, ...baseOrder.filter((i) => !draftOrder.includes(i.id))];
  }, [baseOrder, draftOrder]);
  const orderDirty =
    draftOrder !== null &&
    changedOrders(
      baseOrder,
      orderedItems.map((i) => i.id),
    ).length > 0;

  const visibleItems = reorderMode ? orderedItems : pagination.pageItems;

  /* ---- selection ---- */
  const selectedItems = useMemo(() => items.filter((i) => selected.has(i.id)), [items, selected]);
  const plan = planBatch(selectedItems, publishedCount, maxItems);
  const toggle = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  const togglePage = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of visibleItems) {
        if (checked) next.add(item.id);
        else next.delete(item.id);
      }
      return next;
    });

  const changeFilter = (next: PortfolioFilter) => {
    setFilter(next);
    setDraftOrder(null);
  };
  const clearSearchAndFilters = () => {
    setQuery("");
    changeFilter("all");
  };

  /* ---- actions ---- */
  const runBatch = async (publish: boolean) => {
    const targets = publish ? plan.toPublish : plan.toUnpublish;
    if (targets.length === 0) return;
    try {
      const result = await batch.mutateAsync({ items: targets, publish, isLimitError: (e) => !!getLimitError(e) });
      const what = plural(result.done, "título", "títulos");
      if (result.done > 0)
        notify.success(
          publish ? `${what} ${result.done === 1 ? "publicado" : "publicados"} en la web` : `${what} ${result.done === 1 ? "quitado" : "quitados"} de la web`,
        );
      if (result.limitReached) notify.info("Límite de la web alcanzado", `La web principal muestra hasta ${maxItems} títulos. Quita alguno para publicar más.`);
      if (result.failed > 0)
        notify.info(plural(result.failed, "título no se pudo actualizar", "títulos no se pudieron actualizar"), "Revisa tu conexión e inténtalo de nuevo.");
      setSelected(new Set());
    } catch (e) {
      notify.error(e, "No se pudo completar la acción");
    }
  };

  const persistOrder = () => {
    saveOrder.mutate(
      { original: baseOrder, orderedIds: orderedItems.map((i) => i.id) },
      {
        onSuccess: () => {
          setDraftOrder(null);
          notify.success("Orden guardado", "Así aparecerán los títulos en la web principal.");
        },
        onError: (e) => notify.error(e, "No se pudo guardar el orden"),
      },
    );
  };

  const editItem = items.find((i) => i.id === editId) ?? null;
  const isEmptyCatalog = !!counts && counts.total === 0;

  const allFilters: FilterOption<PortfolioFilter>[] = [
    { value: "all", label: FILTER_LABELS.all, count: counts?.total },
    { value: "published", label: FILTER_LABELS.published, dot: "bg-turquoise", count: counts?.published },
    { value: "unpublished", label: FILTER_LABELS.unpublished, dot: "bg-eerie/30", count: counts?.unpublished },
    { value: "noCover", label: FILTER_LABELS.noCover, dot: "bg-tangerine", count: counts?.withoutCover },
  ];
  const filters = allFilters.filter((f) => !isEmptyCatalog || f.value !== "noCover");

  /* "Atlas existe pero no está publicado" hint for empty searches under a filter. */
  const elsewhere = query && filter !== "all" ? items.find((i) => matchesQuery(i, query) && !matchesFilter(i, filter)) : undefined;

  return (
    <div className={selectedItems.length > 0 && canWrite ? "space-y-4 pb-28 md:space-y-5" : "space-y-4 md:space-y-5"}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar por nombre…"
          className="lg:w-[280px]"
          aria-label="Buscar títulos del portafolio"
          disabled={isEmptyCatalog}
        />
        <span aria-hidden className="hidden h-7 w-px bg-border lg:block" />
        <FilterChips options={filters} value={filter} onChange={changeFilter} label="Filtrar portafolio" className="lg:flex-1" />
        {!isEmptyCatalog && (
          <div className="flex items-center gap-2 lg:ml-auto">
            <LimitMeter value={publishedCount} max={maxItems} className="flex-1 lg:flex-none" />
            <Button asChild variant="outline" size="lg" className="h-[46px]">
              <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon /> Ver la web
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
            </Button>
          </div>
        )}
      </div>

      {!canWrite && !isEmptyCatalog && (
        <ReadOnlyBanner moduleLabel="Portafolio">
          Puedes consultar el portafolio, pero no cambiar portadas, galería ni publicación: eso requiere el módulo{" "}
          <strong className="font-bold text-eerie">Portafolio</strong>.
        </ReadOnlyBanner>
      )}

      <SpineCard>
        {!isEmptyCatalog && (
          <SpineCardHeader
            title={reorderMode ? "Orden en la página principal" : "Listado de portafolio"}
            description={
              !counts
                ? "Cargando…"
                : reorderMode
                  ? `${plural(baseOrder.length, "título publicado", "títulos publicados")} · arrastra para cambiar el orden en que aparecen`
                  : `${plural(filtered.length, "resultado")} de ${plural(counts.total, "título")}${query || filter !== "all" ? "" : ` · ${SORT_LABELS[sort].toLowerCase()}`}`
            }
            actions={
              reorderMode ? (
                <>
                  {orderDirty && (
                    <Button variant="ghost" size="sm" onClick={() => setDraftOrder(null)} disabled={saveOrder.isPending}>
                      Descartar
                    </Button>
                  )}
                  <Button variant={orderDirty ? "default" : "outline"} size="sm" disabled={!orderDirty || saveOrder.isPending} onClick={persistOrder}>
                    {saveOrder.isPending && <LoaderCircleIcon className="animate-spin" />} Guardar orden
                  </Button>
                </>
              ) : (
                <Select value={sort} onValueChange={(v) => setSort(v as PortfolioSort)}>
                  <SelectTrigger aria-label="Ordenar listado" className="h-8 w-auto gap-2 rounded-lg px-3 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {(Object.keys(SORT_LABELS) as PortfolioSort[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {SORT_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }
          />
        )}

        {!isEmptyCatalog && (query || filter !== "all") && (
          <div className="flex flex-wrap items-center gap-2 border-b px-5 py-2.5 md:px-6" aria-label="Filtros activos">
            {query && <ActiveChip label={`“${query}”`} onRemove={() => setQuery("")} />}
            {filter !== "all" && <ActiveChip label={FILTER_LABELS[filter]} onRemove={() => changeFilter("all")} />}
          </div>
        )}

        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <PortfolioListSkeleton />
        ) : isEmptyCatalog ? (
          <EmptyState
            title="Todavía no hay títulos en portafolio"
            description="Un título llega aquí cuando su proyecto tiene la relación de Portafolio. Actívala en el proyecto y después sube su portada."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href="/proyectos">
                    <ArrowLeftIcon /> Ir a Proyectos
                  </Link>
                </Button>
                {canProjects && (
                  <Button asChild variant="outline">
                    <Link href="/proyectos">Crear un proyecto</Link>
                  </Button>
                )}
              </div>
            }
            footnote={`La página principal muestra hasta ${maxItems} títulos publicados.`}
          />
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title="Ningún título coincide"
            description={
              query ? (
                <>
                  No hay títulos {filter === "all" ? "" : `${FILTER_LABELS[filter].toLowerCase()} `}con <strong className="text-eerie">“{query}”</strong>.
                  {elsewhere && (
                    <>
                      {" "}
                      Existe <strong className="text-eerie">{elsewhere.title}</strong> en portafolio, pero no está en este filtro.
                    </>
                  )}
                </>
              ) : (
                "No hay títulos en esta categoría por ahora."
              )
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {filter !== "all" && (
                  <Button variant="outline" onClick={() => changeFilter("all")}>
                    Buscar en todos
                  </Button>
                )}
                <Button variant="dark" onClick={clearSearchAndFilters}>
                  Limpiar búsqueda
                </Button>
              </div>
            }
            footnote="La búsqueda revisa título y subtítulo."
          />
        ) : (
          <>
            <PortfolioList
              items={visibleItems}
              canWrite={canWrite}
              selectedIds={selected}
              onToggle={toggle}
              onTogglePage={togglePage}
              onEdit={(item) => setEditId(item.id)}
              onReorder={reorderMode ? setDraftOrder : undefined}
            />
            {reorderMode ? (
              <p className="border-t px-5 py-3.5 text-xs text-muted-foreground md:px-6">
                Mostrando los {plural(visibleItems.length, "título publicado", "títulos publicados")} · el orden 1–{maxItems} es el de la página principal
              </p>
            ) : (
              <Pagination
                page={pagination.page}
                pageCount={pagination.pageCount}
                onPageChange={pagination.setPage}
                summary={`Mostrando ${pagination.from}–${pagination.to} de ${plural(pagination.total, "título")}`}
              />
            )}
          </>
        )}
      </SpineCard>

      {canWrite && selectedItems.length > 0 && (
        <BatchBar
          count={selectedItems.length}
          plan={plan}
          notes={describePlan(plan, selectedItems.length, maxItems)}
          pending={batch.isPending}
          onPublish={() => void runBatch(true)}
          onUnpublish={() => setConfirmUnpublish(true)}
          onClear={() => setSelected(new Set())}
        />
      )}

      <PortfolioEditModal item={editItem} onClose={() => setEditId(null)} canWrite={canWrite} publishedCount={publishedCount} maxItems={maxItems} />

      <ConfirmDialog
        open={confirmUnpublish}
        onOpenChange={setConfirmUnpublish}
        title="Quitar de la web principal"
        description={
          <>
            Se dejarán de mostrar <strong className="text-eerie">{plural(plan.toUnpublish.length, "título", "títulos")}</strong> en la página principal. Sus
            portadas y galerías se conservan y podrás publicarlos de nuevo.
          </>
        }
        safeguard={{ type: "none" }}
        confirmLabel="Quitar de la web"
        pending={batch.isPending}
        onConfirm={() => {
          setConfirmUnpublish(false);
          void runBatch(false);
        }}
      />
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted pr-1.5 pl-3 text-xs font-semibold">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="rounded-full p-0.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <XIcon className="size-3" />
      </button>
    </span>
  );
}
