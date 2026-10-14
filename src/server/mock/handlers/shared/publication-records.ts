import "server-only";
import type { CreatePublicationRequest } from "@/contracts/publication";
import { db, newId, nowIso, uniqueSlug, type ProjectRecord, type PublicationRecord } from "../../db";
import { toPublicationDetail } from "../../mappers";

/** Creates the Publication satellite (used by POST /projects and POST /projects/:id/publication). */
export function createPublicationRecord(project: ProjectRecord, body: CreatePublicationRequest) {
  const now = nowIso();
  const record: PublicationRecord = {
    id: newId(),
    projectId: project.id,
    slug: uniqueSlug(project.title, db().publications),
    coverMediaId: null,
    type: body.type,
    authors: body.authors ?? [],
    editionNumber: body.editionNumber ?? null,
    format: body.format ?? null,
    collection: body.collection ?? null,
    measures: body.measures ?? null,
    presentation: body.presentation ?? null,
    audience: body.audience ?? null,
    language: body.language ?? null,
    isbn: body.isbn ?? null,
    sku: body.type === "SALE" ? (body.sku ?? null) : null,
    price: body.type === "SALE" && body.price !== undefined ? body.price.toFixed(2) : null,
    compareAtPrice: body.type === "SALE" && body.compareAtPrice !== undefined ? body.compareAtPrice.toFixed(2) : null,
    quantity: body.type === "SALE" ? (body.quantity ?? null) : null,
    pages: body.pages ?? null,
    currency: body.currency ?? "MXN",
    externalUrl: body.type === "LINK" ? (body.externalUrl ?? null) : null,
    isPublished: body.isPublished ?? false,
    publishedAt: body.isPublished ? now : null,
    createdAt: now,
    updatedAt: now,
  };
  db().publications.push(record);
  return toPublicationDetail(record);
}

/** Removes the Publication with its sections and PUBLICATION-scoped media. */
export function deletePublicationCascade(projectId: string) {
  const store = db();
  const publication = store.publications.find((p) => p.projectId === projectId);
  if (!publication) return;
  store.sections = store.sections.filter((s) => s.publicationId !== publication.id);
  store.media = store.media.filter((m) => !(m.projectId === projectId && m.scope === "PUBLICATION"));
  store.publications = store.publications.filter((p) => p.id !== publication.id);
}
