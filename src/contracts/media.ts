import type { IsoDate } from "./common";

export type MediaScope = "PORTFOLIO" | "PUBLICATION";
export type MediaType = "IMAGE" | "PDF";
export type MediaStatus = "PENDING" | "CONFIRMED";

/** @api existing — body of POST /projects/:id/media */
export interface CreateMediaRequest {
  scope: MediaScope;
  type: MediaType;
  mimeType: string;
  sizeBytes: number;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

/** @api existing — body of POST /projects/:id/{portfolio|publication}/cover */
export interface CreateCoverRequest {
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  alt?: string;
  caption?: string;
}

/** @api existing — response of every "create upload" endpoint (media, cover, section pdf). */
export interface CreateMediaResult {
  mediaId: string;
  uploadUrl: string;
  storageKey: string;
  expiresIn: number;
  width: number | null;
  height: number | null;
}

/** @api existing — PATCH /media/:id/confirm */
export interface ConfirmMediaResult {
  id: string;
  status: MediaStatus;
  confirmedAt: IsoDate;
  width: number | null;
  height: number | null;
}

/** @api existing — MediaItemDto: confirmed media as returned by cover and gallery reads. */
export interface MediaItem {
  id: string;
  type: MediaType;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  displayOrder: number | null;
  url: string;
  createdAt: IsoDate;
}

/** @api existing — GET /projects/:id/media?scope= (gallery only; the cover is excluded). Takes no other query params (400). */
export interface ProjectGalleryResponse {
  scope: MediaScope;
  items: MediaItem[];
}

/** @api existing — GET /projects/:id/{portfolio|publication}/cover. `null` (200) when there is no confirmed cover. */
export interface CoverResponse {
  cover: MediaItem | null;
}

/**
 * @deprecated Old proposed shape of GET /projects/:id/media, still answered by the mock for
 * `scope=PUBLICATION` because Tienda (mock-only, not migrated yet) reads it. Use
 * `ProjectGalleryResponse` + `CoverResponse` for new code.
 */
export interface ProjectMediaResponse {
  scope: MediaScope;
  cover: MediaItem | null;
  gallery: MediaItem[];
}
