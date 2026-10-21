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

/** Exact pixel size panel-api requires for a portfolio cover (`portfolio-cover.config.ts`, 3:4). */
export const PORTFOLIO_COVER_SIZE = { width: 1200, height: 1600 } as const;

/** @api existing — PUT /projects/:id/portfolio (UpsertPortfolioDto). */
export interface UpsertPortfolioRequest {
  displayOrder?: number;
}

/** @api existing — GET /portfolios query (FindPortfoliosQueryDto). */
export interface FindPortfoliosQuery {
  status?: "published" | "unpublished";
}

/** @api existing — 409 body of POST /projects/:id/portfolio/publish (the API sends the code as `reason`). */
export interface PortfolioLimitError {
  code: "PORTFOLIO_LIMIT_REACHED";
  maxItems: number;
  currentCount: number;
}

/** @api existing — item of GET /portfolios (PortfolioListItemDto). */
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

/** @api existing — GET /portfolios?status=published|unpublished. `counts` ignore the filter. */
export interface PortfolioListResponse {
  items: PortfolioListItem[];
  counts: { total: number; published: number; unpublished: number; withoutCover: number };
  /** SiteSettings.portfolioMaxItems */
  maxItems: number;
}
