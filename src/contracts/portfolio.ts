import type { IsoDate } from "./common";
import type { MediaItem } from "./media";

/** @api existing — GET /projects/:id/portfolio (PortfolioDetailDto). */
export interface PortfolioDetail {
  id: string;
  slug: string;
  coverMediaId: string | null;
  isPublished: boolean;
  displayOrder: number | null;
  publishedAt: IsoDate | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

/** @api existing — PUT /projects/:id/portfolio (UpsertPortfolioDto). */
export interface UpsertPortfolioRequest {
  displayOrder?: number;
}

/** @api existing — 409 body of POST /projects/:id/portfolio/publish. */
export interface PortfolioLimitError {
  code: "PORTFOLIO_LIMIT_REACHED";
  maxItems: number;
  currentCount: number;
}

/** @api proposed — item of GET /portfolios. */
export interface PortfolioListItem {
  id: string;
  projectId: string;
  title: string;
  subtitle: string | null;
  slug: string;
  isPublished: boolean;
  displayOrder: number | null;
  publishedAt: IsoDate | null;
  cover: MediaItem | null;
  galleryCount: number;
  updatedAt: IsoDate;
}

/** @api proposed — GET /portfolios. */
export interface PortfolioListResponse {
  items: PortfolioListItem[];
  counts: { total: number; published: number; unpublished: number; withoutCover: number };
  /** SiteSettings.portfolioMaxItems */
  maxItems: number;
}
