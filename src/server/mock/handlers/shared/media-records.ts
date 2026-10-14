import "server-only";
import type { CreateMediaResult, MediaScope, MediaType } from "@/contracts/media";
import { db, newId, nowIso, type MediaRecord } from "../../db";
import { badRequest } from "../../http";

const ALLOWED: Record<MediaType, string[]> = {
  IMAGE: ["image/webp", "image/jpeg", "image/png"],
  PDF: ["application/pdf"],
};

/** Registers a PENDING media and returns the simulated presigned URL (step 1 of the upload flow). */
export function createPendingMedia(input: {
  projectId: string;
  scope: MediaScope;
  type: MediaType;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  caption?: string | null;
  originalName?: string | null;
  displayOrder?: number | null;
}): CreateMediaResult {
  if (!ALLOWED[input.type]?.includes(input.mimeType)) throw badRequest([`mimeType ${input.mimeType} is not allowed for ${input.type}`]);
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) throw badRequest(["sizeBytes must be a positive number"]);
  const record: MediaRecord = {
    id: newId(),
    projectId: input.projectId,
    scope: input.scope,
    type: input.type,
    status: "PENDING",
    originalName: input.originalName ?? null,
    alt: input.alt ?? null,
    caption: input.caption ?? null,
    displayOrder: input.displayOrder ?? null,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    width: input.width ?? null,
    height: input.height ?? null,
    createdAt: nowIso(),
    confirmedAt: null,
  };
  db().media.push(record);
  return {
    mediaId: record.id,
    uploadUrl: `/api/__mock/upload/${record.id}`,
    storageKey: `${input.scope.toLowerCase()}/${input.projectId}/${record.id}`,
    expiresIn: 900,
    width: record.width,
    height: record.height,
  };
}

export function confirmMediaRecord(mediaId: string) {
  const media = db().media.find((m) => m.id === mediaId);
  if (!media) return null;
  media.status = "CONFIRMED";
  media.confirmedAt = nowIso();
  return media;
}

/** Next free gallery slot (displayOrder) for a project/scope. */
export function nextGalleryOrder(projectId: string, scope: MediaScope) {
  const orders = db()
    .media.filter((m) => m.projectId === projectId && m.scope === scope && m.displayOrder !== null)
    .map((m) => m.displayOrder as number);
  return orders.length ? Math.max(...orders) + 1 : 1;
}
