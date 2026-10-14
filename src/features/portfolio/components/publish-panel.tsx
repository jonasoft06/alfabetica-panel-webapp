"use client";

import { useId, useState } from "react";
import { InfoIcon } from "lucide-react";
import type { PortfolioListItem } from "@/contracts/portfolio";
import { SpineCard } from "@/shared/components/data/spine-card";
import { notify } from "@/shared/components/feedback/notify";
import { cn } from "@/shared/lib/cn";
import { Switch } from "@/shared/ui/switch";
import { usePublish, useUnpublish } from "../hooks/use-portfolio-mutations";
import { getLimitError, limitMessage } from "../lib/limit-error";
import { LimitBar } from "./limit-meter";

export interface PublishPanelProps {
  item: PortfolioListItem;
  publishedCount: number;
  maxItems: number;
  canWrite: boolean;
}

/** "Publicación en la web": switch with the 10-title limit (409 PORTFOLIO_LIMIT_REACHED handled). */
export function PublishPanel({ item, publishedCount, maxItems, canWrite }: PublishPanelProps) {
  const switchId = useId();
  const publish = usePublish();
  const unpublish = useUnpublish();
  const [limitHit, setLimitHit] = useState<string | null>(null);

  const busy = publish.isPending || unpublish.isPending;
  const full = publishedCount >= maxItems;
  const blocked = !item.isPublished && full;
  const free = Math.max(0, maxItems - publishedCount);

  const onChange = (next: boolean) => {
    setLimitHit(null);
    if (next) {
      publish.mutate(item.projectId, {
        onSuccess: () => notify.success("Publicado en la web", item.title),
        onError: (error) => {
          const limit = getLimitError(error);
          if (limit) {
            const message = limitMessage(limit);
            setLimitHit(message);
            notify.info("Límite de la web alcanzado", message);
          } else notify.error(error, "No se pudo publicar el título");
        },
      });
    } else {
      unpublish.mutate(item.projectId, {
        onSuccess: () => notify.info("Quitado de la web", item.title),
        onError: (error) => notify.error(error, "No se pudo quitar el título de la web"),
      });
    }
  };

  return (
    <SpineCard spine="bg-turquoise" className="p-5">
      <h3 className="font-display text-base font-bold">Publicación en la web</h3>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <label htmlFor={switchId} className={cn("text-sm font-bold", canWrite && !blocked && "cursor-pointer")}>
            Mostrar en la página principal
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.isPublished ? "Visible hoy en la web principal. " : ""}
            {full ? `Los ${maxItems} espacios están ocupados.` : `Quedan ${free} ${free === 1 ? "espacio" : "espacios"} de ${maxItems} disponibles.`}
          </p>
        </div>
        <Switch
          id={switchId}
          checked={item.isPublished}
          onCheckedChange={onChange}
          disabled={!canWrite || busy || blocked}
          aria-describedby={`${switchId}-note`}
        />
      </div>
      <div className="mt-4">
        <LimitBar value={publishedCount} max={maxItems} />
      </div>
      <p
        id={`${switchId}-note`}
        role={limitHit ? "alert" : undefined}
        className={cn(
          "mt-4 flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs",
          limitHit || blocked ? "bg-tangerine/10 font-semibold text-tangerine" : "bg-tan-sun/25 text-eerie/80",
        )}
      >
        <InfoIcon className="mt-px size-3.5 shrink-0" />
        <span>{limitHit ?? `Cuando los ${maxItems} espacios estén ocupados, este control se desactiva hasta que quites otro título de la web.`}</span>
      </p>
      {!canWrite && <p className="mt-3 text-xs text-muted-foreground">Solo lectura: publicar o quitar de la web requiere el módulo Portafolio.</p>}
    </SpineCard>
  );
}
