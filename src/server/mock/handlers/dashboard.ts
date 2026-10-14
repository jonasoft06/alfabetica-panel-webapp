import "server-only";
import type { AttentionItem, DashboardSummary } from "@/contracts/dashboard";
import { db } from "../db";
import { requireUser } from "../guards";
import { json } from "../http";
import type { MockRouter } from "../router";

const WEEK = 7 * 24 * 3600 * 1000;

/** Count of records created in each of the last 8 weeks (oldest first). */
function weekly(dates: string[]): number[] {
  const now = Date.now();
  return Array.from({ length: 8 }, (_, i) => {
    const end = now - (7 - i) * WEEK;
    const start = end - WEEK;
    return dates.filter((d) => {
      const t = new Date(d).getTime();
      return t > start && t <= end;
    }).length;
  });
}

/** TODO(api): proposed GET /dashboard/summary — aggregates for the "Resumen" screen. */
export function registerDashboard(router: MockRouter) {
  router.get("dashboard/summary", (req) => {
    requireUser(req);
    const store = db();
    const active = store.projects.filter((p) => !p.deletedAt);
    const isActive = (projectId: string) => active.some((p) => p.id === projectId);
    const portfolios = store.portfolios.filter((p) => isActive(p.projectId));
    const publications = store.publications.filter((p) => isActive(p.projectId));
    const productions = store.productions.filter((p) => isActive(p.projectId));
    const titleOf = (projectId: string) => active.find((p) => p.id === projectId)!.title;

    const attention: AttentionItem[] = [
      ...portfolios
        .filter((p) => !p.coverMediaId)
        .map((p) => ({
          projectId: p.projectId,
          title: titleOf(p.projectId),
          reason: "MISSING_PORTFOLIO_COVER" as const,
          detail: "Portafolio sin portada confirmada",
        })),
      ...publications
        .filter((p) => p.type === "SALE" && !p.isPublished)
        .map((p) => ({ projectId: p.projectId, title: titleOf(p.projectId), reason: "MISSING_PRICE" as const, detail: "En tienda sin publicar" })),
      ...productions
        .filter((p) => !p.clickupListId)
        .map((p) => ({
          projectId: p.projectId,
          title: titleOf(p.projectId),
          reason: "MISSING_CLICKUP_LINK" as const,
          detail: "En producción sin enlace a ClickUp",
        })),
      ...active
        .filter((p) => Date.now() - new Date(p.updatedAt).getTime() > 20 * 24 * 3600 * 1000)
        .filter((p) => !portfolios.some((x) => x.projectId === p.id) && !publications.some((x) => x.projectId === p.id))
        .map((p) => ({ projectId: p.id, title: p.title, reason: "STALE_PROJECT" as const, detail: "Sin relaciones ni cambios recientes" })),
    ].slice(0, 6);

    const body: DashboardSummary = {
      projects: {
        total: active.length,
        createdThisWeek: active.filter((p) => Date.now() - new Date(p.createdAt).getTime() < WEEK).length,
        weekly: weekly(active.map((p) => p.updatedAt)),
      },
      portfolio: {
        total: portfolios.length,
        published: portfolios.filter((p) => p.isPublished).length,
        maxItems: store.settings.portfolioMaxItems,
        weekly: weekly(portfolios.map((p) => p.updatedAt)),
      },
      store: {
        total: publications.length,
        published: publications.filter((p) => p.isPublished).length,
        weekly: weekly(publications.map((p) => p.updatedAt)),
      },
      production: {
        total: productions.length,
        linked: productions.filter((p) => p.clickupListId).length,
        lastSyncedAt: store.settings.lastClickupSyncAt,
        weekly: weekly(productions.map((p) => p.updatedAt)),
      },
      attention,
    };
    return json(body);
  });
}
