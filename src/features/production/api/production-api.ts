import type { ProductionDetail, ProductionListResponse, ProductionStage, ProductionSyncResult, UpsertProductionRequest } from "@/contracts/production";
import { endpoints } from "@/core/http/endpoints";
import { http } from "@/core/http/http-client";

/** Module 8 (Production + ClickUp) — every route is TODO(api), served by the mock server. */
export const productionApi = {
  list: () => http.get<ProductionListResponse>(endpoints.production.list()),
  stages: () => http.get<ProductionStage[]>(endpoints.production.stages()),
  detail: (projectId: string) => http.get<ProductionDetail>(endpoints.production.root(projectId)),
  update: (projectId: string, body: UpsertProductionRequest) => http.put<ProductionDetail>(endpoints.production.root(projectId), body),
  sync: () => http.post<ProductionSyncResult>(endpoints.production.sync()),
};

export const productionKeys = {
  all: ["production"] as const,
  list: () => [...productionKeys.all, "list"] as const,
  stages: () => [...productionKeys.all, "stages"] as const,
  detail: (projectId: string) => [...productionKeys.all, "detail", projectId] as const,
};
