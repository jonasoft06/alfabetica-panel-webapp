import type { ProductionDetail, ProductionListItem, ProductionPhase, UpsertProductionRequest } from "@/contracts/production";
import { endpoints } from "@/core/http/endpoints";
import { http } from "@/core/http/http-client";

/** Production facet content (link with ClickUp). Adding/removing the facet lives in projectsApi. */
export const productionApi = {
  list: () => http.get<ProductionListItem[]>(endpoints.production.list()),
  phases: () => http.get<ProductionPhase[]>(endpoints.production.phases()),
  detail: (projectId: string) => http.get<ProductionDetail>(endpoints.production.root(projectId)),
  update: (projectId: string, body: UpsertProductionRequest) => http.put<ProductionDetail>(endpoints.production.root(projectId), body),
  /** Re-reads this production's ClickUp list now (also works on FINISHED productions). */
  sync: (projectId: string) => http.post<ProductionDetail>(endpoints.production.sync(projectId)),
};

export const productionKeys = {
  all: ["production"] as const,
  list: () => [...productionKeys.all, "list"] as const,
  phases: () => [...productionKeys.all, "phases"] as const,
  detail: (projectId: string) => [...productionKeys.all, "detail", projectId] as const,
};
