"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import type { AttentionReason } from "@/contracts/dashboard";
import { useSession } from "@/core/auth/session-provider";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { SpineCard, SpineCardHeader } from "@/shared/components/data/spine-card";
import { usePageSubtitle } from "@/shared/components/layout/page-meta";
import { formatLongDate, formatRelative, plural } from "@/shared/lib/format";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { useDashboardSummary } from "../hooks/use-dashboard-summary";
import { FlowTile } from "./flow-tile";

const REASONS: Record<AttentionReason, { label: string; tone: BadgeTone; action: string; href: (id: string) => string; spine: string }> = {
  MISSING_PORTFOLIO_COVER: { label: "Portada", tone: "tangerine", action: "Revisar", href: () => "/portafolio", spine: "bg-turquoise" },
  MISSING_PRICE: { label: "Tienda", tone: "tangerine", action: "Revisar", href: () => "/tienda", spine: "bg-tangerine" },
  MISSING_CLICKUP_LINK: { label: "ClickUp", tone: "tan", action: "Enlazar", href: () => "/produccion", spine: "bg-tan-sun" },
  STALE_PROJECT: { label: "Inactivo", tone: "turquoise", action: "Ver", href: (id) => `/proyectos?ver=${id}`, spine: "bg-grape" },
};

export function DashboardView() {
  const { user } = useSession();
  const { data, error, isPending, refetch } = useDashboardSummary();
  usePageSubtitle(`Alfabética Workspace · ${formatLongDate()}`);
  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-5 md:space-y-6">
      <header>
        <h2 className="font-display text-[28px] leading-tight font-bold md:text-[32px]">Hola{firstName ? `, ${firstName}` : ""}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Esto es lo que está pasando hoy en el catálogo.</p>
      </header>

      {error ? (
        <SpineCard>
          <ErrorState error={error} onRetry={() => refetch()} />
        </SpineCard>
      ) : (
        <>
          <SpineCard spine="bg-turquoise">
            <SpineCardHeader
              title="Flujo editorial"
              description={data ? `${plural(data.projects.total, "proyecto")} en el catálogo · cada barra es una semana` : "Cargando…"}
              actions={
                <Link href="/proyectos" className="hidden text-xs font-bold text-turquoise-dark hover:underline sm:inline">
                  Ver todos los proyectos →
                </Link>
              }
              className="border-b-0 pb-0"
            />
            <div className="grid grid-cols-2 gap-3 p-4 md:p-5 lg:grid-cols-4">
              {isPending || !data ? (
                Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
              ) : (
                <>
                  <FlowTile
                    tone="tan"
                    value={data.projects.total}
                    label="Proyectos"
                    note={`+${data.projects.createdThisWeek} esta semana`}
                    weekly={data.projects.weekly}
                    href="/proyectos"
                  />
                  <FlowTile
                    tone="turquoise"
                    value={data.portfolio.total}
                    label="En portafolio"
                    note={`${data.portfolio.published} publicados`}
                    weekly={data.portfolio.weekly}
                    href="/portafolio"
                  />
                  <FlowTile
                    tone="tangerine"
                    value={data.store.total}
                    label="En tienda"
                    note={`${data.store.published} publicados`}
                    weekly={data.store.weekly}
                    href="/tienda"
                  />
                  <FlowTile
                    tone="bubblegum"
                    value={data.production.total}
                    label="En producción"
                    note={`${data.production.linked} enlazados a ClickUp`}
                    weekly={data.production.weekly}
                    href="/produccion"
                  />
                </>
              )}
            </div>
          </SpineCard>

          <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr] md:gap-6">
            <SpineCard spine="bg-tangerine">
              <SpineCardHeader
                title="Necesita tu atención"
                description={data ? `${plural(data.attention.length, "pendiente")} que detienen un título` : "Cargando…"}
                actions={
                  data &&
                  data.attention.length > 0 && (
                    <Badge tone="tangerine" size="md">
                      {data.attention.length}
                    </Badge>
                  )
                }
              />
              <ul className="divide-y px-5 md:px-6">
                {isPending || !data
                  ? Array.from({ length: 4 }, (_, i) => (
                      <li key={i} className="py-3.5">
                        <Skeleton className="h-10" />
                      </li>
                    ))
                  : data.attention.length === 0 && (
                      <li className="py-10 text-center text-sm text-muted-foreground">Todo en orden. No hay pendientes por ahora.</li>
                    )}
                {data?.attention.map((item) => {
                  const reason = REASONS[item.reason];
                  return (
                    <li key={`${item.projectId}-${item.reason}`} className="flex items-center gap-3 py-3.5">
                      <span
                        className={`flex h-9 w-7 shrink-0 items-center justify-center rounded-[4px] font-display text-xs font-bold text-near-white ${reason.spine}`}
                      >
                        {item.title.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{item.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <Badge tone={reason.tone} className="hidden sm:inline-flex">
                        {reason.label}
                      </Badge>
                      <Link href={reason.href(item.projectId)} className="shrink-0 text-xs font-bold text-turquoise-dark hover:underline">
                        {reason.action}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SpineCard>

            <div className="flex flex-col gap-5 md:gap-6">
              <SpineCard spine="bg-tan-sun" className="flex-1">
                <SpineCardHeader title="Portafolio en la web" description="Títulos visibles en la página principal" className="border-b-0 pb-0" />
                <div className="px-5 pt-3 pb-5 md:px-6">
                  {data ? (
                    <>
                      <p className="flex items-baseline gap-2">
                        <span className="font-display text-4xl font-bold text-tan-sun-dark">{data.portfolio.published}</span>
                        <span className="text-sm text-muted-foreground">de {data.portfolio.maxItems} espacios</span>
                      </p>
                      <div
                        className="mt-3 h-2 rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={data.portfolio.published}
                        aria-valuemax={data.portfolio.maxItems}
                        aria-label="Espacios usados del portafolio"
                      >
                        <div
                          className="h-full rounded-full bg-tan-sun"
                          style={{ width: `${Math.min(100, (data.portfolio.published / data.portfolio.maxItems) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Quedan {Math.max(0, data.portfolio.maxItems - data.portfolio.published)} espacios libres ·{" "}
                        {plural(data.portfolio.total - data.portfolio.published, "título")} del portafolio sin publicar.
                      </p>
                    </>
                  ) : (
                    <Skeleton className="h-20" />
                  )}
                  <Link href="/portafolio" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-tan-sun-dark hover:underline">
                    Gestionar portafolio <ArrowRightIcon className="size-3" />
                  </Link>
                </div>
              </SpineCard>

              <SpineCard spine="bg-bubblegum" className="flex-1">
                <SpineCardHeader
                  title="Producción · ClickUp"
                  description={data ? `Última sincronización: ${formatRelative(data.production.lastSyncedAt).toLowerCase()}` : "Cargando…"}
                  className="border-b-0 pb-0"
                />
                <div className="px-5 pt-3 pb-5 md:px-6">
                  {data ? (
                    <>
                      <p className="flex items-baseline gap-2">
                        <span className="font-display text-4xl font-bold text-bubblegum-dark">{data.production.linked}</span>
                        <span className="text-sm text-muted-foreground">de {plural(data.production.total, "proyecto")} enlazados</span>
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Badge tone="turquoise" size="md">
                          {data.production.linked} enlazados
                        </Badge>
                        <Badge size="md">{data.production.total - data.production.linked} sin enlace</Badge>
                      </div>
                    </>
                  ) : (
                    <Skeleton className="h-20" />
                  )}
                  <Link href="/produccion" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-bubblegum-dark hover:underline">
                    Ver producción <ArrowRightIcon className="size-3" />
                  </Link>
                </div>
              </SpineCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
