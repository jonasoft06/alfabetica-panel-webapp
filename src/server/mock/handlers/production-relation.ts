import "server-only";
import { db } from "../db";
import { requirePermission } from "../guards";
import { codedError, json, noContent } from "../http";
import { findActiveProject, touchProject } from "../lookups";
import type { MockRouter } from "../router";
import { createProductionRecord, toProductionDetail } from "./shared/production-records";

/**
 * Mirrors POST / DELETE /projects/:projectId/production (relation lifecycle, permission `projects`
 * like the other facets). Content routes (GET/PUT, list, phases, sync) live in production.ts.
 */
export function registerProductionRelation(router: MockRouter) {
  router.post("projects/:id/production", (req) => {
    requirePermission(req, "projects");
    const project = findActiveProject(req.params.id);
    if (db().productions.some((p) => p.projectId === project.id)) throw codedError(409, "PRODUCTION_ALREADY_EXISTS", "Project already has a production");
    const production = createProductionRecord(project.id);
    touchProject(project.id);
    return json(toProductionDetail(production), { status: 201 });
  });

  router.delete("projects/:id/production", (req) => {
    requirePermission(req, "projects");
    const project = findActiveProject(req.params.id);
    const store = db();
    if (!store.productions.some((p) => p.projectId === project.id)) throw codedError(404, "PRODUCTION_NOT_FOUND", "Project has no production");
    store.productions = store.productions.filter((p) => p.projectId !== project.id);
    touchProject(project.id);
    return noContent();
  });
}
