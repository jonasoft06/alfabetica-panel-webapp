import type { ConfirmMediaResult, CoverResponse, CreateCoverRequest, CreateMediaRequest, CreateMediaResult, ProjectGalleryResponse } from "@/contracts/media";
import type { FindPortfoliosQuery, PortfolioDetail, PortfolioListResponse, UpsertPortfolioRequest } from "@/contracts/portfolio";
import type { ProjectDetail } from "@/contracts/projects";
import type { ConfirmMediaIdRequest } from "@/contracts/publication";
import { endpoints } from "@/core/http/endpoints";
import { http } from "@/core/http/http-client";

export const portfolioApi = {
  list: (query?: FindPortfoliosQuery) => http.get<PortfolioListResponse>(endpoints.portfolio.list(), { query: { ...query } }),
  detail: (projectId: string) => http.get<PortfolioDetail>(endpoints.portfolio.root(projectId)),
  update: (projectId: string, body: UpsertPortfolioRequest) => http.put<PortfolioDetail>(endpoints.portfolio.root(projectId), body),
  publish: (projectId: string) => http.post<ProjectDetail>(endpoints.portfolio.publish(projectId)),
  unpublish: (projectId: string) => http.post<ProjectDetail>(endpoints.portfolio.unpublish(projectId)),

  cover: (projectId: string) => http.get<CoverResponse>(endpoints.portfolio.cover(projectId)),
  /** Gallery only (cover excluded). `scope` must be the only query param: the API rejects anything else with 400. */
  gallery: (projectId: string) => http.get<ProjectGalleryResponse>(endpoints.projects.media(projectId), { query: { scope: "PORTFOLIO" } }),
  createCover: (projectId: string, body: CreateCoverRequest) => http.post<CreateMediaResult>(endpoints.portfolio.cover(projectId), body),
  confirmCover: (projectId: string, body: ConfirmMediaIdRequest) => http.patch<ProjectDetail>(endpoints.portfolio.coverConfirm(projectId), body),
  createGalleryImage: (projectId: string, body: Omit<CreateMediaRequest, "scope" | "type">) =>
    http.post<CreateMediaResult>(endpoints.projects.media(projectId), { ...body, scope: "PORTFOLIO", type: "IMAGE" }),
  confirmMedia: (mediaId: string) => http.patch<ConfirmMediaResult>(endpoints.media.confirm(mediaId)),
  deleteMedia: (mediaId: string) => http.delete(endpoints.media.remove(mediaId)),
};

export const portfolioKeys = {
  all: ["portfolio"] as const,
  list: () => [...portfolioKeys.all, "list"] as const,
  detail: (projectId: string) => [...portfolioKeys.all, "detail", projectId] as const,
  cover: (projectId: string) => [...portfolioKeys.all, "cover", projectId] as const,
  gallery: (projectId: string) => [...portfolioKeys.all, "gallery", projectId] as const,
};
