import "server-only";
import type { CreateMediaRequest, MediaScope, ProjectMediaResponse } from "@/contracts/media";
import type { PermissionKey } from "@/contracts/auth";
import { db } from "../db";
import { requireUser } from "../guards";
import { badRequest, forbidden, json, noContent, notFound } from "../http";
import { findActiveProject, touchProject } from "../lookups";
import { mediaById, toMediaItem } from "../mappers";
import type { MockRouter } from "../router";
import { confirmMediaRecord, createPendingMedia, nextGalleryOrder } from "./shared/media-records";

/** Same mapping as PERMISSION_BY_MEDIA_SCOPE in media.service.ts. */
const PERMISSION_BY_SCOPE: Record<MediaScope, PermissionKey> = { PORTFOLIO: "portfolio", PUBLICATION: "publication" };
const SCOPES: MediaScope[] = ["PORTFOLIO", "PUBLICATION"];

function assertScope(permissions: string[], scope: MediaScope) {
  const permission = PERMISSION_BY_SCOPE[scope];
  if (!permissions.includes(permission)) throw forbidden(`Missing required permission(s): ${permission}`);
}

/** Mirrors media.controller.ts plus the proposed GET /projects/:id/media. */
export function registerMedia(router: MockRouter) {
  // TODO(api): proposed endpoint — "Ruta siguiente bloque", step 1.
  router.get("projects/:id/media", (req) => {
    requireUser(req);
    const project = findActiveProject(req.params.id);
    const scope = req.query.get("scope") as MediaScope | null;
    if (!scope || !SCOPES.includes(scope)) throw badRequest(["scope must be one of the following values: PORTFOLIO, PUBLICATION"]);
    const facet = scope === "PORTFOLIO" ? db().portfolios.find((p) => p.projectId === project.id) : db().publications.find((p) => p.projectId === project.id);
    if (!facet) throw notFound(`Project has no ${scope.toLowerCase()}`);
    const gallery = db()
      .media.filter((m) => m.projectId === project.id && m.scope === scope && m.status === "CONFIRMED" && m.type === "IMAGE" && m.displayOrder !== null)
      .sort((a, b) => a.displayOrder! - b.displayOrder! || a.createdAt.localeCompare(b.createdAt))
      .map(toMediaItem);
    const body: ProjectMediaResponse = { scope, cover: mediaById(facet.coverMediaId), gallery };
    return json(body);
  });

  router.post("projects/:id/media", (req) => {
    const user = requireUser(req);
    const project = findActiveProject(req.params.id);
    const body = (req.body ?? {}) as CreateMediaRequest;
    if (!SCOPES.includes(body.scope)) throw badRequest(["scope must be one of the following values: PORTFOLIO, PUBLICATION"]);
    assertScope(user.permissions, body.scope);
    const result = createPendingMedia({
      projectId: project.id,
      ...body,
      displayOrder: body.type === "IMAGE" ? nextGalleryOrder(project.id, body.scope) : null,
    });
    return json(result, { status: 201 });
  });

  router.patch("media/:id/confirm", (req) => {
    const user = requireUser(req);
    const media = db().media.find((m) => m.id === req.params.id);
    if (!media) throw notFound("Media not found");
    assertScope(user.permissions, media.scope);
    const confirmed = confirmMediaRecord(media.id)!;
    touchProject(media.projectId);
    return json({ id: confirmed.id, status: confirmed.status, confirmedAt: confirmed.confirmedAt, width: confirmed.width, height: confirmed.height });
  });

  router.delete("media/:id", (req) => {
    const user = requireUser(req);
    const store = db();
    const media = store.media.find((m) => m.id === req.params.id);
    if (!media) throw notFound("Media not found");
    assertScope(user.permissions, media.scope);
    // Hard delete without re-indexing displayOrder (same as panel-api); unlink covers.
    for (const facet of [...store.portfolios, ...store.publications]) if (facet.coverMediaId === media.id) facet.coverMediaId = null;
    for (const section of store.sections) if (section.pdfMediaId === media.id) section.pdfMediaId = null;
    store.media = store.media.filter((m) => m.id !== media.id);
    store.files.delete(media.id);
    touchProject(media.projectId);
    return noContent();
  });
}
