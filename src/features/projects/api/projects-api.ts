import type { CreateProjectRequest, FindProjectsQuery, ProjectDetail, ProjectListItem, UpdateProjectRequest } from "@/contracts/projects";
import type { CreatePublicationRequest, PublicationDetail } from "@/contracts/publication";
import type { PortfolioDetail } from "@/contracts/portfolio";
import type { ProductionDetail } from "@/contracts/production";
import { endpoints } from "@/core/http/endpoints";
import { http } from "@/core/http/http-client";

/** Project core + relation (facet) lifecycle. Facet *content* lives in each module's own api. */
export const projectsApi = {
  list: (query?: FindProjectsQuery) => http.get<ProjectListItem[]>(endpoints.projects.list(), { query: { ...query } }),
  detail: (id: string) => http.get<ProjectDetail>(endpoints.projects.detail(id)),
  create: (body: CreateProjectRequest) => http.post<ProjectDetail>(endpoints.projects.list(), body),
  update: (id: string, body: UpdateProjectRequest) => http.patch<ProjectDetail>(endpoints.projects.detail(id), body),
  remove: (id: string) => http.delete(endpoints.projects.detail(id)),

  addPortfolio: (id: string) => http.post<PortfolioDetail>(endpoints.portfolio.root(id)),
  removePortfolio: (id: string) => http.delete(endpoints.portfolio.root(id)),
  addPublication: (id: string, body: CreatePublicationRequest) => http.post<PublicationDetail>(endpoints.publication.root(id), body),
  removePublication: (id: string) => http.delete(endpoints.publication.root(id)),
  addProduction: (id: string) => http.post<ProductionDetail>(endpoints.production.root(id)),
  removeProduction: (id: string) => http.delete(endpoints.production.root(id)),
};

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (query?: FindProjectsQuery) => [...projectKeys.lists(), query ?? {}] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
};
