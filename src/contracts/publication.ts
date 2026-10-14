import type { DecimalString, IsoDate } from "./common";
import type { MediaItem } from "./media";

export const PUBLICATION_TYPES = ["SALE", "LINK", "DOI"] as const;
export type PublicationType = (typeof PUBLICATION_TYPES)[number];

/** @api existing — GET /projects/:id/publication (PublicationDetailDto). */
export interface PublicationDetail {
  id: string;
  slug: string;
  type: PublicationType;
  coverMediaId: string | null;
  authors: string[];
  editionNumber: string | null;
  format: string | null;
  collection: string | null;
  measures: string | null;
  presentation: string | null;
  audience: string | null;
  language: string | null;
  isbn: string | null;
  sku: string | null;
  price: DecimalString | null;
  quantity: number | null;
  pages: number | null;
  compareAtPrice: DecimalString | null;
  currency: string | null;
  externalUrl: string | null;
  isPublished: boolean;
  publishedAt: IsoDate | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

/**
 * @api existing — PublicationFieldsDto.
 * Rules (enforced by the API): SALE requires price + quantity, allows sku/compareAtPrice;
 * LINK requires externalUrl; those fields must be absent for the other types.
 */
export interface PublicationFields {
  authors?: string[];
  editionNumber?: string;
  format?: string;
  collection?: string;
  measures?: string;
  presentation?: string;
  audience?: string;
  language?: string;
  isbn?: string;
  sku?: string;
  price?: number;
  quantity?: number;
  compareAtPrice?: number;
  pages?: number | null;
  currency?: string;
  externalUrl?: string;
  isPublished?: boolean;
}

/** @api existing — POST /projects/:id/publication */
export interface CreatePublicationRequest extends PublicationFields {
  type: PublicationType;
}

/** @api existing — PUT /projects/:id/publication (changing `type` cascades and clears the old type's data). */
export interface UpsertPublicationRequest extends PublicationFields {
  type?: PublicationType;
}

/** @api existing — PublicationSectionDto. */
export interface PublicationSection {
  id: string;
  label: string;
  description: string | null;
  sortOrder: number;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  pdf: { id: string; url: string; mimeType: string; sizeBytes: number; originalName: string | null } | null;
}

/** @api existing — POST /projects/:id/publication/sections (label ≤ 17, description ≤ 220). */
export interface CreateSectionRequest {
  label: string;
  description?: string;
  sortOrder?: number;
}

/** @api existing — PATCH /projects/:id/publication/sections/:sectionId */
export interface UpdateSectionRequest {
  label?: string;
  description?: string | null;
}

/** @api existing — PUT /projects/:id/publication/sections/order */
export interface ReorderSectionsRequest {
  sectionIds: string[];
}

/** @api existing — POST /projects/:id/publication/sections/:sectionId/pdf */
export interface CreateSectionPdfRequest {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/** @api existing — PATCH .../pdf/confirm and .../cover/confirm */
export interface ConfirmMediaIdRequest {
  mediaId: string;
}

/** @api proposed — item of GET /publications. */
export interface PublicationListItem {
  id: string;
  projectId: string;
  title: string;
  subtitle: string | null;
  slug: string;
  type: PublicationType;
  isPublished: boolean;
  price: DecimalString | null;
  currency: string | null;
  quantity: number | null;
  externalUrl: string | null;
  cover: MediaItem | null;
  sectionsCount: number;
  updatedAt: IsoDate;
}

/** @api proposed — GET /publications. */
export interface PublicationListResponse {
  items: PublicationListItem[];
  counts: { total: number; published: number; byType: Record<PublicationType, number> };
}
