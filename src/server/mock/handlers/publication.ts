import "server-only";
import type { MediaScope } from "@/contracts/media";
import {
  PUBLICATION_TYPES,
  type PublicationListItem,
  type PublicationListResponse,
  type PublicationSection,
  type PublicationType,
  type UpsertPublicationRequest,
} from "@/contracts/publication";
import { db, nowIso, type PublicationRecord, type SectionRecord } from "../db";
import { requirePermission, requireUser } from "../guards";
import { badRequest, json, noContent, notFound, type MockRequest } from "../http";
import { findActiveProject, touchProject } from "../lookups";
import { mediaById, mockFileUrl, toPublicationDetail } from "../mappers";
import type { MockRouter } from "../router";
import { confirmMediaRecord, createPendingMedia } from "./shared/media-records";

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const SALE_ONLY = ["price", "quantity", "sku", "compareAtPrice"] as const;
const TEXT_FIELDS = ["editionNumber", "format", "collection", "measures", "presentation", "audience", "language", "isbn"] as const;

/* ------------------------------------------------------------------ helpers */

const bodyOf = (req: MockRequest): Record<string, unknown> => (req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {});
const isPresent = (value: unknown) => value !== undefined && value !== null;

function publicationOf(projectId: string): PublicationRecord {
  const publication = db().publications.find((p) => p.projectId === projectId);
  if (!publication) throw notFound("Publication not found");
  return publication;
}

function toSection(section: SectionRecord): PublicationSection {
  const pdf = section.pdfMediaId ? db().media.find((m) => m.id === section.pdfMediaId && m.status === "CONFIRMED") : null;
  return {
    id: section.id,
    label: section.label,
    description: section.description,
    sortOrder: section.sortOrder,
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
    pdf: pdf ? { id: pdf.id, url: mockFileUrl(pdf.id), mimeType: pdf.mimeType, sizeBytes: pdf.sizeBytes, originalName: pdf.originalName } : null,
  };
}

const sectionsOf = (publicationId: string) =>
  db()
    .sections.filter((s) => s.publicationId === publicationId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

function sectionOf(publication: PublicationRecord, sectionId: string): SectionRecord {
  const section = db().sections.find((s) => s.id === sectionId && s.publicationId === publication.id);
  if (!section) throw notFound(`Section ${sectionId} not found`);
  return section;
}

/** Drops a media row (and its bytes) and unlinks it everywhere. */
function removeMedia(mediaId: string | null) {
  if (!mediaId) return;
  const store = db();
  store.media = store.media.filter((m) => m.id !== mediaId);
  store.files.delete(mediaId);
}

function takeMediaId(req: MockRequest, projectId: string, scope: MediaScope, type: "IMAGE" | "PDF") {
  const mediaId = bodyOf(req).mediaId;
  if (typeof mediaId !== "string" || !mediaId) throw badRequest(["mediaId should not be empty"]);
  const media = db().media.find((m) => m.id === mediaId && m.projectId === projectId && m.scope === scope && m.type === type);
  if (!media) throw notFound("Media not found");
  return confirmMediaRecord(media.id)!;
}

/** Same checks as PublicationFieldsDto + the type-specific rules of the service. */
function validateUpsert(body: Record<string, unknown>, current: PublicationRecord): string[] {
  const errors: string[] = [];
  if (isPresent(body.type) && !PUBLICATION_TYPES.includes(body.type as PublicationType))
    errors.push("type must be one of the following values: SALE, LINK, DOI");
  if (body.authors !== undefined && !(Array.isArray(body.authors) && body.authors.every((a) => typeof a === "string")))
    errors.push("authors must be an array of strings");
  for (const key of TEXT_FIELDS) if (isPresent(body[key]) && typeof body[key] !== "string") errors.push(`${key} must be a string`);
  for (const key of ["sku", "externalUrl", "currency"] as const)
    if (isPresent(body[key]) && typeof body[key] !== "string") errors.push(`${key} must be a string`);
  if (isPresent(body.pages) && !(Number.isInteger(body.pages) && (body.pages as number) >= 1)) errors.push("pages must not be less than 1");
  for (const key of ["price", "compareAtPrice"] as const)
    if (isPresent(body[key]) && !(typeof body[key] === "number" && (body[key] as number) >= 0)) errors.push(`${key} must be a positive number`);
  if (isPresent(body.quantity) && !(Number.isInteger(body.quantity) && (body.quantity as number) >= 0)) errors.push("quantity must be a non-negative integer");
  if (body.isPublished !== undefined && typeof body.isPublished !== "boolean") errors.push("isPublished must be a boolean value");
  if (errors.length) return errors;

  const type = (body.type as PublicationType | undefined) ?? current.type;
  if (type !== "SALE") for (const key of SALE_ONLY) if (isPresent(body[key])) errors.push(`${key} is only allowed for SALE publications`);
  if (type !== "LINK" && isPresent(body.externalUrl)) errors.push("externalUrl is only allowed for LINK publications");
  if (type === "LINK" && isPresent(body.externalUrl) && !/^https?:\/\/\S+$/i.test(body.externalUrl as string)) errors.push("externalUrl must be a URL address");
  return errors;
}

function applyUpsert(publication: PublicationRecord, body: UpsertPublicationRequest & Record<string, unknown>) {
  const store = db();
  const now = nowIso();

  if (body.type && body.type !== publication.type) {
    // Cascade: clear the previous type's data (and section PDFs when leaving DOI).
    if (publication.type === "DOI") {
      for (const section of store.sections.filter((s) => s.publicationId === publication.id)) {
        removeMedia(section.pdfMediaId);
        section.pdfMediaId = null;
      }
    }
    publication.sku = publication.price = publication.compareAtPrice = publication.externalUrl = null;
    publication.quantity = null;
    publication.type = body.type;
  }

  if (body.authors !== undefined) publication.authors = body.authors;
  for (const key of TEXT_FIELDS) if (body[key] !== undefined) publication[key] = (body[key] as string).trim() || null;
  if (body.currency !== undefined) publication.currency = body.currency || "MXN";
  if (body.pages !== undefined) publication.pages = body.pages ?? null;
  if (body.sku !== undefined) publication.sku = body.sku?.trim() || null;
  if (body.price !== undefined) publication.price = body.price.toFixed(2);
  if (body.compareAtPrice !== undefined) publication.compareAtPrice = body.compareAtPrice.toFixed(2);
  if (body.quantity !== undefined) publication.quantity = body.quantity;
  if (body.externalUrl !== undefined) publication.externalUrl = body.externalUrl.trim() || null;
  if (body.isPublished !== undefined && body.isPublished !== publication.isPublished) {
    publication.isPublished = body.isPublished;
    publication.publishedAt = body.isPublished ? now : null;
  }
  publication.updatedAt = now;
}

/** After merging, the final state must satisfy the type's required fields. */
function assertRequired(publication: PublicationRecord) {
  if (publication.type === "SALE") {
    const missing = [publication.price === null && "price", publication.quantity === null && "quantity"].filter(Boolean);
    if (missing.length) throw badRequest(missing.map((m) => `${m} is required for SALE publications`));
  }
  if (publication.type === "LINK" && !publication.externalUrl) throw badRequest(["externalUrl is required for LINK publications"]);
}

/* ------------------------------------------------------------------ routes */

/** Mirrors the publication / sections controllers (module 7) plus the proposed GET /publications. */
export function registerPublication(router: MockRouter) {
  // TODO(api): proposed endpoint — catalogue of publications for the Tienda list.
  router.get("publications", (req) => {
    requireUser(req);
    const store = db();
    const items: PublicationListItem[] = [];
    for (const publication of store.publications) {
      const project = store.projects.find((p) => p.id === publication.projectId && !p.deletedAt);
      if (!project) continue;
      items.push({
        id: publication.id,
        projectId: project.id,
        title: project.title,
        subtitle: project.subtitle,
        slug: publication.slug,
        type: publication.type,
        isPublished: publication.isPublished,
        price: publication.price,
        currency: publication.currency,
        quantity: publication.quantity,
        externalUrl: publication.externalUrl,
        cover: mediaById(publication.coverMediaId),
        sectionsCount: store.sections.filter((s) => s.publicationId === publication.id).length,
        updatedAt: publication.updatedAt > project.updatedAt ? publication.updatedAt : project.updatedAt,
      });
    }
    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const byType: Record<PublicationType, number> = { SALE: 0, LINK: 0, DOI: 0 };
    for (const item of items) byType[item.type]++;
    const body: PublicationListResponse = { items, counts: { total: items.length, published: items.filter((i) => i.isPublished).length, byType } };
    return json(body);
  });

  router.get("projects/:id/publication", (req) => {
    requireUser(req);
    return json(toPublicationDetail(publicationOf(findActiveProject(req.params.id).id)));
  });

  router.put("projects/:id/publication", (req) => {
    requirePermission(req, "publication");
    const project = findActiveProject(req.params.id);
    const publication = publicationOf(project.id);
    const body = bodyOf(req);
    const errors = validateUpsert(body, publication);
    if (errors.length) throw badRequest(errors);

    const snapshot = { ...publication };
    applyUpsert(publication, body as UpsertPublicationRequest & Record<string, unknown>);
    try {
      assertRequired(publication);
    } catch (error) {
      Object.assign(publication, snapshot);
      throw error;
    }
    touchProject(project.id);
    return json(toPublicationDetail(publication));
  });

  /* ---- cover ---- */
  router.post("projects/:id/publication/cover", (req) => {
    requirePermission(req, "publication");
    const project = findActiveProject(req.params.id);
    publicationOf(project.id);
    const body = bodyOf(req);
    for (const key of ["sizeBytes", "width", "height"] as const)
      if (!Number.isInteger(body[key]) || (body[key] as number) <= 0) throw badRequest([`${key} must be a positive integer`]);
    if (typeof body.mimeType !== "string") throw badRequest(["mimeType must be a string"]);
    const result = createPendingMedia({
      projectId: project.id,
      scope: "PUBLICATION",
      type: "IMAGE",
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes as number,
      width: body.width as number,
      height: body.height as number,
      alt: typeof body.alt === "string" ? body.alt : null,
      caption: typeof body.caption === "string" ? body.caption : null,
    });
    return json(result, { status: 201 });
  });

  router.patch("projects/:id/publication/cover/confirm", (req) => {
    requirePermission(req, "publication");
    const project = findActiveProject(req.params.id);
    const publication = publicationOf(project.id);
    const media = takeMediaId(req, project.id, "PUBLICATION", "IMAGE");
    if (publication.coverMediaId && publication.coverMediaId !== media.id) removeMedia(publication.coverMediaId);
    publication.coverMediaId = media.id;
    publication.updatedAt = nowIso();
    touchProject(project.id);
    return json(toPublicationDetail(publication));
  });

  /* ---- sections ---- */
  router.get("projects/:id/publication/sections", (req) => {
    requireUser(req);
    const publication = publicationOf(findActiveProject(req.params.id).id);
    return json(sectionsOf(publication.id).map(toSection));
  });

  router.post("projects/:id/publication/sections", (req) => {
    requirePermission(req, "publication");
    const project = findActiveProject(req.params.id);
    const publication = publicationOf(project.id);
    const body = bodyOf(req);
    const errors: string[] = [];
    if (typeof body.label !== "string" || !body.label.trim()) errors.push("label should not be empty");
    else if (body.label.length > 17) errors.push("label must be shorter than or equal to 17 characters");
    if (isPresent(body.description) && (typeof body.description !== "string" || body.description.length > 220))
      errors.push("description must be shorter than or equal to 220 characters");
    if (isPresent(body.sortOrder) && !(Number.isInteger(body.sortOrder) && (body.sortOrder as number) >= 0))
      errors.push("sortOrder must be a non-negative integer");
    if (errors.length) throw badRequest(errors);

    const existing = sectionsOf(publication.id);
    const now = nowIso();
    const section: SectionRecord = {
      id: crypto.randomUUID(),
      publicationId: publication.id,
      label: (body.label as string).trim(),
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : (existing.at(-1)?.sortOrder ?? 0) + 1,
      pdfMediaId: null,
      createdAt: now,
      updatedAt: now,
    };
    db().sections.push(section);
    touchProject(project.id);
    return json(toSection(section), { status: 201 });
  });

  // Registered before ":sectionId" routes; the router prefers static segments anyway.
  router.put("projects/:id/publication/sections/order", (req) => {
    requirePermission(req, "publication");
    const project = findActiveProject(req.params.id);
    const publication = publicationOf(project.id);
    const ids = bodyOf(req).sectionIds;
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) throw badRequest(["sectionIds must be an array of strings"]);
    const current = sectionsOf(publication.id);
    if (ids.length !== current.length || new Set(ids).size !== ids.length || !current.every((s) => ids.includes(s.id))) {
      throw badRequest(["sectionIds must contain every section of the publication exactly once"]);
    }
    const now = nowIso();
    ids.forEach((id, index) => {
      const section = current.find((s) => s.id === id)!;
      section.sortOrder = index + 1;
      section.updatedAt = now;
    });
    touchProject(project.id);
    return json(sectionsOf(publication.id).map(toSection));
  });

  router.patch("projects/:id/publication/sections/:sectionId", (req) => {
    requirePermission(req, "publication");
    const project = findActiveProject(req.params.id);
    const section = sectionOf(publicationOf(project.id), req.params.sectionId);
    const body = bodyOf(req);
    const errors: string[] = [];
    if (body.label !== undefined) {
      if (typeof body.label !== "string" || !body.label.trim()) errors.push("label should not be empty");
      else if (body.label.length > 17) errors.push("label must be shorter than or equal to 17 characters");
    }
    if (isPresent(body.description) && (typeof body.description !== "string" || body.description.length > 220))
      errors.push("description must be shorter than or equal to 220 characters");
    if (errors.length) throw badRequest(errors);

    if (typeof body.label === "string") section.label = body.label.trim();
    if (body.description !== undefined) section.description = typeof body.description === "string" ? body.description.trim() || null : null;
    section.updatedAt = nowIso();
    touchProject(project.id);
    return json(toSection(section));
  });

  router.delete("projects/:id/publication/sections/:sectionId", (req) => {
    requirePermission(req, "publication");
    const project = findActiveProject(req.params.id);
    const section = sectionOf(publicationOf(project.id), req.params.sectionId);
    removeMedia(section.pdfMediaId);
    db().sections = db().sections.filter((s) => s.id !== section.id);
    touchProject(project.id);
    return noContent();
  });

  /* ---- section PDF ---- */
  router.post("projects/:id/publication/sections/:sectionId/pdf", (req) => {
    requirePermission(req, "publication");
    const project = findActiveProject(req.params.id);
    const section = sectionOf(publicationOf(project.id), req.params.sectionId);
    const body = bodyOf(req);
    const errors: string[] = [];
    if (typeof body.originalName !== "string" || !body.originalName.trim()) errors.push("originalName should not be empty");
    if (body.mimeType !== "application/pdf") errors.push("mimeType must be application/pdf");
    if (!Number.isInteger(body.sizeBytes) || (body.sizeBytes as number) <= 0) errors.push("sizeBytes must be a positive integer");
    else if ((body.sizeBytes as number) > MAX_PDF_BYTES) errors.push("sizeBytes must not be greater than 52428800");
    if (errors.length) throw badRequest(errors);
    const result = createPendingMedia({
      projectId: project.id,
      scope: "PUBLICATION",
      type: "PDF",
      mimeType: "application/pdf",
      sizeBytes: body.sizeBytes as number,
      originalName: body.originalName as string,
    });
    void section;
    return json(result, { status: 201 });
  });

  router.patch("projects/:id/publication/sections/:sectionId/pdf/confirm", (req) => {
    requirePermission(req, "publication");
    const project = findActiveProject(req.params.id);
    const section = sectionOf(publicationOf(project.id), req.params.sectionId);
    const media = takeMediaId(req, project.id, "PUBLICATION", "PDF");
    if (section.pdfMediaId && section.pdfMediaId !== media.id) removeMedia(section.pdfMediaId);
    section.pdfMediaId = media.id;
    section.updatedAt = nowIso();
    touchProject(project.id);
    return json(toSection(section));
  });
}
