import "server-only";
import type { MediaItem } from "@/contracts/media";
import type { ProjectDetail, ProjectListItem } from "@/contracts/projects";
import type { PublicationDetail } from "@/contracts/publication";
import { db, type MediaRecord, type ProjectRecord, type PublicationRecord } from "./db";

/** URL served by the mock file endpoint (stands in for the Spaces CDN URL). */
export const mockFileUrl = (mediaId: string) => `/api/__mock/files/${mediaId}`;

export function toMediaItem(media: MediaRecord): MediaItem {
  return {
    id: media.id,
    type: media.type,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes,
    width: media.width,
    height: media.height,
    displayOrder: media.displayOrder,
    url: mockFileUrl(media.id),
    createdAt: media.createdAt,
  };
}

export function mediaById(mediaId: string | null): MediaItem | null {
  if (!mediaId) return null;
  const media = db().media.find((m) => m.id === mediaId && m.status === "CONFIRMED");
  return media ? toMediaItem(media) : null;
}

export function toProjectListItem(project: ProjectRecord): ProjectListItem {
  const { portfolios, publications, productions } = db();
  const portfolio = portfolios.find((p) => p.projectId === project.id);
  return {
    id: project.id,
    title: project.title,
    client: project.client,
    issueYear: project.issueYear,
    createdAt: project.createdAt,
    isPublished: !!portfolio?.isPublished,
    hasPortfolio: !!portfolio,
    hasPublication: publications.some((p) => p.projectId === project.id),
    hasProduction: productions.some((p) => p.projectId === project.id),
    subtitle: project.subtitle,
    description: project.description,
    updatedAt: project.updatedAt,
  };
}

export function toProjectDetail(project: ProjectRecord): ProjectDetail {
  const { portfolios, publications, productions } = db();
  const portfolio = portfolios.find((p) => p.projectId === project.id);
  const publication = publications.find((p) => p.projectId === project.id);
  const production = productions.find((p) => p.projectId === project.id);
  return {
    id: project.id,
    title: project.title,
    subtitle: project.subtitle,
    description: project.description,
    client: project.client,
    issueYear: project.issueYear,
    tags: project.tags,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    portfolio: portfolio
      ? {
          id: portfolio.id,
          slug: portfolio.slug,
          coverMediaId: portfolio.coverMediaId,
          isPublished: portfolio.isPublished,
          displayOrder: portfolio.displayOrder,
          publishedAt: portfolio.publishedAt,
        }
      : null,
    publication: publication ? { id: publication.id, slug: publication.slug, type: publication.type, isPublished: publication.isPublished } : null,
    production: production ? { id: production.id, publicCode: production.publicCode } : null,
  };
}

export function toPublicationDetail(p: PublicationRecord): PublicationDetail {
  const { projectId: _projectId, ...rest } = p;
  void _projectId;
  return rest;
}
