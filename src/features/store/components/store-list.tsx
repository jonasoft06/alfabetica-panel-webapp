"use client";

import { PencilIcon, EyeIcon, LayersIcon } from "lucide-react";
import type { PublicationListItem } from "@/contracts/publication";
import { formatCurrency, formatRelative, plural } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { hostOf } from "../lib/publication-filters";
import { TYPE_LABELS, TYPE_TONES } from "../lib/publication-types";
import { CoverThumb } from "@/shared/components/data/cover-thumb";
import { TYPE_TILES } from "../lib/publication-types";

const GRID = "md:grid md:grid-cols-[minmax(0,2.4fr)_90px_minmax(0,1fr)_110px_minmax(0,1fr)_auto] md:items-center md:gap-5";

/** Price / access line + stock line for the three publication types. */
function commercialInfo(item: PublicationListItem): { price: string; stock: string } {
  switch (item.type) {
    case "SALE":
      return {
        price: item.price !== null && Number(item.price) > 0 ? formatCurrency(item.price, item.currency ?? "MXN") : "Sin precio",
        stock: `${plural(item.quantity ?? 0, "pza", "pzas")}`,
      };
    case "LINK":
      return { price: "Enlace externo", stock: hostOf(item.externalUrl) ?? "Sin enlace" };
    case "DOI":
      return { price: "Acceso abierto", stock: item.sectionsCount ? plural(item.sectionsCount, "sección", "secciones") : "Digital" };
  }
}

export function StoreList({ items, canWrite, onOpen }: { items: PublicationListItem[]; canWrite: boolean; onOpen: (projectId: string) => void }) {
  const ActionIcon = canWrite ? PencilIcon : EyeIcon;
  const actionLabel = canWrite ? "Editar" : "Ver ficha";
  return (
    <div role="table" aria-label="Títulos de la tienda">
      <div role="row" className={`hidden border-b px-6 py-3 ${GRID}`}>
        {["Título", "Tipo", "Precio", "Estado", "Cantidad"].map((h) => (
          <span key={h} role="columnheader" className="eyebrow">
            {h}
          </span>
        ))}
        <span role="columnheader" className="eyebrow w-[30px] text-right">
          <span className="sr-only">Acciones</span>
        </span>
      </div>
      <ul role="rowgroup" className="divide-y">
        {items.map((item) => {
          const info = commercialInfo(item);
          return (
            <li key={item.id} role="row" className={`relative px-5 py-4 transition-colors hover:bg-crema/60 md:px-6 ${GRID}`}>
              <div role="cell" className="flex min-w-0 items-center gap-3.5 pr-10 md:pr-0">
                <CoverThumb cover={item.cover} title={item.title} emptyTint={TYPE_TILES[item.type]} className="w-11" />
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpen(item.projectId)}
                    className="text-left font-display text-[15px] leading-snug font-bold outline-none after:absolute after:inset-0 focus-visible:underline md:after:hidden"
                  >
                    {item.title}
                  </button>
                  {item.subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.subtitle}</p>}
                </div>
              </div>
              <div role="cell" className="mt-3 flex items-center gap-2 md:mt-0">
                <Badge tone={TYPE_TONES[item.type]}>{TYPE_LABELS[item.type]}</Badge>
                <span className="md:hidden">
                  <Badge tone={item.isPublished ? "turquoise" : "neutral"}>{item.isPublished ? "Publicado" : "No publicado"}</Badge>
                </span>
              </div>
              <div role="cell" className="mt-2 font-display text-[15px] font-bold md:mt-0">
                {info.price}
                <span className="ml-2 text-xs font-medium text-muted-foreground md:hidden">· {info.stock}</span>
              </div>
              <div role="cell" className="hidden md:block">
                <Badge tone={item.isPublished ? "turquoise" : "neutral"}>{item.isPublished ? "Publicado" : "No publicado"}</Badge>
              </div>
              <div role="cell" className="hidden text-[13px] text-muted-foreground md:block">
                <span className="block truncate">{info.stock}</span>
                {item.type !== "DOI" && item.sectionsCount > 0 && (
                  <span className="mt-0.5 flex items-center gap-1 text-[11px]">
                    <LayersIcon className="size-3" /> {plural(item.sectionsCount, "sección", "secciones")}
                  </span>
                )}
              </div>
              <div role="cell" className="mt-2 text-xs text-muted-foreground md:hidden">
                Actualizado · {formatRelative(item.updatedAt)}
              </div>
              <div role="cell" className="absolute top-4 right-4 z-[1] md:static">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`${actionLabel}: ${item.title}`} onClick={() => onOpen(item.projectId)}>
                      <ActionIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{actionLabel}</TooltipContent>
                </Tooltip>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function StoreListSkeleton() {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Cargando títulos">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className={`px-5 py-4 md:px-6 ${GRID}`}>
          <div className="flex items-center gap-3.5">
            <Skeleton className="h-[58px] w-11 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="mt-3 h-5 w-14 md:mt-0" />
          <Skeleton className="mt-2 h-4 w-20 md:mt-0" />
          <Skeleton className="hidden h-5 w-20 md:block" />
          <Skeleton className="hidden h-4 w-16 md:block" />
          <div className="hidden w-[30px] md:block" />
        </li>
      ))}
    </ul>
  );
}
