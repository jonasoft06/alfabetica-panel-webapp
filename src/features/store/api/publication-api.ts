import type { ConfirmMediaResult, CreateCoverRequest, CreateMediaRequest, CreateMediaResult, ProjectMediaResponse } from "@/contracts/media";
import type {
  ConfirmMediaIdRequest,
  CreateSectionPdfRequest,
  CreateSectionRequest,
  PublicationDetail,
  PublicationListResponse,
  PublicationSection,
  ReorderSectionsRequest,
  UpdateSectionRequest,
  UpsertPublicationRequest,
} from "@/contracts/publication";
import { endpoints } from "@/core/http/endpoints";
import { http } from "@/core/http/http-client";

/** "Tienda" in the UI = `publication` in panel-api. */
export const publicationApi = {
  /** TODO(api): proposed GET /publications */
  list: () => http.get<PublicationListResponse>(endpoints.publication.list()),
  detail: (projectId: string) => http.get<PublicationDetail>(endpoints.publication.root(projectId)),
  update: (projectId: string, body: UpsertPublicationRequest) => http.put<PublicationDetail>(endpoints.publication.root(projectId), body),

  /** TODO(api): proposed GET /projects/:id/media?scope=PUBLICATION */
  media: (projectId: string) => http.get<ProjectMediaResponse>(endpoints.projects.media(projectId), { query: { scope: "PUBLICATION" } }),
  createCover: (projectId: string, body: CreateCoverRequest) => http.post<CreateMediaResult>(endpoints.publication.cover(projectId), body),
  confirmCover: (projectId: string, body: ConfirmMediaIdRequest) => http.patch<PublicationDetail>(endpoints.publication.coverConfirm(projectId), body),
  createGalleryImage: (projectId: string, body: Omit<CreateMediaRequest, "scope" | "type">) =>
    http.post<CreateMediaResult>(endpoints.projects.media(projectId), { ...body, scope: "PUBLICATION", type: "IMAGE" }),
  confirmMedia: (mediaId: string) => http.patch<ConfirmMediaResult>(endpoints.media.confirm(mediaId)),
  deleteMedia: (mediaId: string) => http.delete(endpoints.media.remove(mediaId)),

  sections: (projectId: string) => http.get<PublicationSection[]>(endpoints.publication.sections(projectId)),
  createSection: (projectId: string, body: CreateSectionRequest) => http.post<PublicationSection>(endpoints.publication.sections(projectId), body),
  updateSection: (projectId: string, sectionId: string, body: UpdateSectionRequest) =>
    http.patch<PublicationSection>(endpoints.publication.section(projectId, sectionId), body),
  deleteSection: (projectId: string, sectionId: string) => http.delete(endpoints.publication.section(projectId, sectionId)),
  reorderSections: (projectId: string, body: ReorderSectionsRequest) => http.put<PublicationSection[]>(endpoints.publication.sectionsOrder(projectId), body),
  createSectionPdf: (projectId: string, sectionId: string, body: CreateSectionPdfRequest) =>
    http.post<CreateMediaResult>(endpoints.publication.sectionPdf(projectId, sectionId), body),
  confirmSectionPdf: (projectId: string, sectionId: string, body: ConfirmMediaIdRequest) =>
    http.patch<PublicationSection>(endpoints.publication.sectionPdfConfirm(projectId, sectionId), body),
};

export const publicationKeys = {
  all: ["publication"] as const,
  list: () => [...publicationKeys.all, "list"] as const,
  detail: (projectId: string) => [...publicationKeys.all, "detail", projectId] as const,
  media: (projectId: string) => [...publicationKeys.all, "media", projectId] as const,
  sections: (projectId: string) => [...publicationKeys.all, "sections", projectId] as const,
};
