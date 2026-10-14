import "server-only";
import type { CreateProjectRequest, UpdateProjectRequest } from "@/contracts/projects";
import { PUBLICATION_TYPES } from "@/contracts/publication";
import { db, newId, nowIso, uniqueSlug, type ProjectRecord } from "../db";
import { requirePermission, requireUser } from "../guards";
import { badRequest, conflict, forbidden, json, noContent, notFound } from "../http";
import { findActiveProject, touchProject } from "../lookups";
import { toProjectDetail, toProjectListItem } from "../mappers";
import type { MockRouter } from "../router";
import { createPublicationRecord, deletePublicationCascade } from "./shared/publication-records";

function validateCore(body: UpdateProjectRequest, requireTitle: boolean): string[] {
  const errors: string[] = [];
  if (requireTitle || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) errors.push("title should not be empty");
  }
  if (body.issueYear !== undefined && body.issueYear !== null && !Number.isInteger(body.issueYear)) errors.push("issueYear must be an integer number");
  if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")))
    errors.push("each value in tags must be a string");
  return errors;
}

const parseBool = (value: string | null) => (value === "true" ? true : value === "false" ? false : undefined);

/** Mirrors projects.controller.ts (core + facet create/delete). */
export function registerProjects(router: MockRouter) {
  router.get("projects", (req) => {
    requireUser(req);
    const { portfolios, publications, productions } = db();
    const filters = {
      hasPortfolio: parseBool(req.query.get("hasPortfolio")),
      hasPublication: parseBool(req.query.get("hasPublication")),
      hasProduction: parseBool(req.query.get("hasProduction")),
    };
    const items = db()
      .projects.filter((p) => !p.deletedAt)
      .filter((p) => filters.hasPortfolio === undefined || portfolios.some((x) => x.projectId === p.id) === filters.hasPortfolio)
      .filter((p) => filters.hasPublication === undefined || publications.some((x) => x.projectId === p.id) === filters.hasPublication)
      .filter((p) => filters.hasProduction === undefined || productions.some((x) => x.projectId === p.id) === filters.hasProduction)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toProjectListItem);
    return json(items);
  });

  router.get("projects/:id", (req) => {
    requireUser(req);
    return json(toProjectDetail(findActiveProject(req.params.id)));
  });

  router.post("projects", (req) => {
    const user = requirePermission(req, "projects");
    const body = (req.body ?? {}) as CreateProjectRequest;
    const errors = validateCore(body, true);
    if (body.publication && !PUBLICATION_TYPES.includes(body.publication.type)) errors.push("publication.type must be a valid enum value");
    if (errors.length) throw badRequest(errors);
    if (body.publication && !user.permissions.includes("publication")) throw forbidden("Missing required permission(s): publication");

    const now = nowIso();
    const project: ProjectRecord = {
      id: newId(),
      title: body.title.trim(),
      subtitle: body.subtitle?.trim() || null,
      description: body.description?.trim() || null,
      client: body.client?.trim() || null,
      issueYear: body.issueYear ?? null,
      tags: body.tags ?? [],
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    db().projects.push(project);
    if (body.portfolio) createPortfolioRecord(project);
    if (body.publication) createPublicationRecord(project, { type: body.publication.type });
    return json(toProjectDetail(project), { status: 201 });
  });

  router.patch("projects/:id", (req) => {
    requirePermission(req, "projects");
    const project = findActiveProject(req.params.id);
    const body = (req.body ?? {}) as UpdateProjectRequest;
    const errors = validateCore(body, false);
    if (errors.length) throw badRequest(errors);
    if (body.title !== undefined) project.title = body.title.trim();
    if (body.subtitle !== undefined) project.subtitle = body.subtitle?.trim() || null;
    if (body.description !== undefined) project.description = body.description?.trim() || null;
    if (body.client !== undefined) project.client = body.client?.trim() || null;
    if (body.issueYear !== undefined) project.issueYear = body.issueYear ?? null;
    if (body.tags !== undefined) project.tags = body.tags;
    project.updatedAt = nowIso();
    return json(toProjectDetail(project));
  });

  router.delete("projects/:id", (req) => {
    requirePermission(req, "projects");
    const project = findActiveProject(req.params.id);
    project.deletedAt = nowIso();
    // Soft delete frees the slugs, same as panel-api.
    for (const facet of [...db().portfolios, ...db().publications]) {
      if (facet.projectId === project.id) facet.slug = `${facet.slug}-deleted-${project.id}`;
    }
    return noContent();
  });

  /* ---- facets: create / delete the relation (permission `projects`) ---- */

  router.post("projects/:id/portfolio", (req) => {
    requirePermission(req, "projects");
    const project = findActiveProject(req.params.id);
    if (db().portfolios.some((p) => p.projectId === project.id)) throw conflict("Portfolio already exists for this project");
    const portfolio = createPortfolioRecord(project);
    touchProject(project.id);
    return json(portfolio, { status: 201 });
  });

  router.delete("projects/:id/portfolio", (req) => {
    requirePermission(req, "projects");
    const project = findActiveProject(req.params.id);
    const store = db();
    if (!store.portfolios.some((p) => p.projectId === project.id)) throw notFound("Portfolio not found");
    store.portfolios = store.portfolios.filter((p) => p.projectId !== project.id);
    store.media = store.media.filter((m) => !(m.projectId === project.id && m.scope === "PORTFOLIO"));
    touchProject(project.id);
    return noContent();
  });

  router.post("projects/:id/publication", (req) => {
    requirePermission(req, "projects");
    const project = findActiveProject(req.params.id);
    if (db().publications.some((p) => p.projectId === project.id)) throw conflict("Publication already exists for this project");
    const body = (req.body ?? {}) as { type?: string };
    if (!body.type || !PUBLICATION_TYPES.includes(body.type as never)) throw badRequest(["type must be one of the following values: SALE, LINK, DOI"]);
    const publication = createPublicationRecord(project, req.body as never);
    touchProject(project.id);
    return json(publication, { status: 201 });
  });

  router.delete("projects/:id/publication", (req) => {
    requirePermission(req, "projects");
    const project = findActiveProject(req.params.id);
    if (!db().publications.some((p) => p.projectId === project.id)) throw notFound("Publication not found");
    deletePublicationCascade(project.id);
    touchProject(project.id);
    return noContent();
  });
}

export function createPortfolioRecord(project: ProjectRecord) {
  const now = nowIso();
  const portfolio = {
    id: newId(),
    projectId: project.id,
    slug: uniqueSlug(project.title, db().portfolios),
    coverMediaId: null,
    isPublished: false,
    displayOrder: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  db().portfolios.push(portfolio);
  return portfolio;
}
