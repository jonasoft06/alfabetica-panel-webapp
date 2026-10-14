import type { IsoDate } from "./common";
import type { PublicationType } from "./publication";

/** @api existing — GET /projects query (FindProjectsQueryDto). */
export interface FindProjectsQuery {
  hasPortfolio?: boolean;
  hasPublication?: boolean;
  hasProduction?: boolean;
}

/** @api existing — item of GET /projects (ProjectListItemDto). */
export interface ProjectListItem {
  id: string;
  title: string;
  client: string | null;
  issueYear: number | null;
  createdAt: IsoDate;
  isPublished: boolean;
  hasPortfolio: boolean;
  hasPublication: boolean;
  hasProduction: boolean;
  /** @api proposed — needed by the list row (second line). */
  subtitle?: string | null;
  /** @api proposed — needed by the list row (third line). */
  description?: string | null;
  /** @api proposed — "Actualizado" column and sort. Falls back to createdAt. */
  updatedAt?: IsoDate;
}

/** @api existing — GET /projects/:id (ProjectDetailDto). */
export interface ProjectDetail {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  client: string | null;
  issueYear: number | null;
  tags: string[];
  createdAt: IsoDate;
  updatedAt: IsoDate;
  portfolio: {
    id: string;
    slug: string;
    coverMediaId: string | null;
    isPublished: boolean;
    displayOrder: number | null;
    publishedAt: IsoDate | null;
  } | null;
  publication: {
    id: string;
    slug: string;
    type: PublicationType;
    isPublished: boolean;
  } | null;
  production: {
    id: string;
    publicCode: string;
  } | null;
}

/** @api existing — POST /projects (CreateProjectDto). */
export interface CreateProjectRequest {
  title: string;
  subtitle?: string;
  description?: string;
  client?: string;
  issueYear?: number;
  tags?: string[];
  portfolio?: Record<string, never>;
  publication?: { type: PublicationType };
}

/** @api existing — PATCH /projects/:id (UpdateProjectDto). `null` clears an optional field. */
export interface UpdateProjectRequest {
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  client?: string | null;
  issueYear?: number | null;
  tags?: string[];
}
