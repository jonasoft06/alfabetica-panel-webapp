import type { IsoDate } from "./common";

/**
 * Production / ClickUp — module 8, not built in panel-api yet.
 * The Prisma models `Production` and `ProductionStage` already exist in the schema;
 * every endpoint below is @api proposed and pending the design session.
 */

/** @api proposed — mirrors model ProductionStage. */
export interface ProductionStage {
  id: string;
  key: string;
  clientLabel: string;
  clientDescription: string | null;
  sortOrder: number;
  clickupStatusMatch: string[];
}

/** @api proposed — mirrors model Production. */
export interface ProductionDetail {
  id: string;
  projectId: string;
  publicCode: string;
  clickupListId: string | null;
  startDate: IsoDate | null;
  estimatedTotalDays: number | null;
  currentStageId: string | null;
  estimatedEndDate: IsoDate | null;
  lastSyncedAt: IsoDate | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

/** @api proposed — item of GET /productions. */
export interface ProductionListItem {
  id: string;
  projectId: string;
  title: string;
  subtitle: string | null;
  publicCode: string;
  clickupListId: string | null;
  currentStage: Pick<ProductionStage, "id" | "key" | "clientLabel" | "sortOrder"> | null;
  estimatedEndDate: IsoDate | null;
  lastSyncedAt: IsoDate | null;
}

/** @api proposed — GET /productions */
export interface ProductionListResponse {
  items: ProductionListItem[];
  lastSyncedAt: IsoDate | null;
}

/** @api proposed — PUT /projects/:id/production */
export interface UpsertProductionRequest {
  publicCode?: string;
  clickupListId?: string | null;
  startDate?: IsoDate | null;
  estimatedTotalDays?: number | null;
  currentStageId?: string | null;
  estimatedEndDate?: IsoDate | null;
}

/** @api proposed — POST /productions/sync */
export interface ProductionSyncResult {
  syncedAt: IsoDate;
  updated: number;
}
