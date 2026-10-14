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

/** @api proposed — item of GET /projects/:id/media?scope= (designed in "Ruta siguiente bloque", step 1). */
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

/** @api proposed — GET /projects/:id/media?scope= */
export interface ProjectMediaResponse {
  scope: MediaScope;
  cover: MediaItem | null;
  gallery: MediaItem[];
}
