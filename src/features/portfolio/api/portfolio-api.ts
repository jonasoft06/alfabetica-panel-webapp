import type { ConfirmMediaResult, CreateCoverRequest, CreateMediaRequest, CreateMediaResult, ProjectMediaResponse } from "@/contracts/media";
import type { PortfolioDetail, PortfolioListResponse, UpsertPortfolioRequest } from "@/contracts/portfolio";
import type { ConfirmMediaIdRequest } from "@/contracts/publication";
import { endpoints } from "@/core/http/endpoints";
import { http } from "@/core/http/http-client";

export const portfolioApi = {
  /** TODO(api): proposed GET /portfolios */
  list: () => http.get<PortfolioListResponse>(endpoints.portfolio.list()),
  detail: (projectId: string) => http.get<PortfolioDetail>(endpoints.portfolio.root(projectId)),
  update: (projectId: string, body: UpsertPortfolioRequest) => http.put<PortfolioDetail>(endpoints.portfolio.root(projectId), body),
  publish: (projectId: string) => http.post<PortfolioDetail>(endpoints.portfolio.publish(projectId)),
  unpublish: (projectId: string) => http.post<PortfolioDetail>(endpoints.portfolio.unpublish(projectId)),

  /** TODO(api): proposed GET /projects/:id/media?scope=PORTFOLIO */
  media: (projectId: string) => http.get<ProjectMediaResponse>(endpoints.projects.media(projectId), { query: { scope: "PORTFOLIO" } }),
  createCover: (projectId: string, body: CreateCoverRequest) => http.post<CreateMediaResult>(endpoints.portfolio.cover(projectId), body),
  confirmCover: (projectId: string, body: ConfirmMediaIdRequest) => http.patch<PortfolioDetail>(endpoints.portfolio.coverConfirm(projectId), body),
  createGalleryImage: (projectId: string, body: Omit<CreateMediaRequest, "scope" | "type">) =>
    http.post<CreateMediaResult>(endpoints.projects.media(projectId), { ...body, scope: "PORTFOLIO", type: "IMAGE" }),
  confirmMedia: (mediaId: string) => http.patch<ConfirmMediaResult>(endpoints.media.confirm(mediaId)),
  deleteMedia: (mediaId: string) => http.delete(endpoints.media.remove(mediaId)),
};

export const portfolioKeys = {
  all: ["portfolio"] as const,
  list: () => [...portfolioKeys.all, "list"] as const,
  detail: (projectId: string) => [...portfolioKeys.all, "detail", projectId] as const,
  media: (projectId: string) => [...portfolioKeys.all, "media", projectId] as const,
};
