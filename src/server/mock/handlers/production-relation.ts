import "server-only";
import { db, newId, nowIso } from "../db";
import { requirePermission } from "../guards";
import { conflict, json, noContent, notFound } from "../http";
import { findActiveProject, touchProject } from "../lookups";
import type { MockRouter } from "../router";

/** Next public code: ALF-<initials>-<year>, unique. */
function publicCodeFor(title: string, year: number | null) {
  const initials = title
    .normalize("NFD")
    .replace(/[^A-Za-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 3)
    .padEnd(3, "X");
  const base = `ALF-${initials}-${year ?? new Date().getFullYear()}`;
  let code = base;
  for (let i = 2; db().productions.some((p) => p.publicCode === code); i++) code = `${base}-${i}`;
  return code;
}

/**
 * TODO(api): proposed POST / DELETE /projects/:id/production (relation lifecycle, permission `projects`
 * like the other facets). Content routes (GET/PUT, list, stages, sync) live in production.ts.
 */
export function registerProductionRelation(router: MockRouter) {
  router.post("projects/:id/production", (req) => {
    requirePermission(req, "projects");
    const project = findActiveProject(req.params.id);
    if (db().productions.some((p) => p.projectId === project.id)) throw conflict("Production already exists for this project");
    const now = nowIso();
    const production = {
      id: newId(),
      projectId: project.id,
      publicCode: publicCodeFor(project.title, project.issueYear),
      clickupListId: null,
      startDate: now.slice(0, 10),
      estimatedTotalDays: null,
      currentStageId: db().stages[0]?.id ?? null,
      estimatedEndDate: null,
      lastSyncedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    db().productions.push(production);
    touchProject(project.id);
    return json(production, { status: 201 });
  });

  router.delete("projects/:id/production", (req) => {
    requirePermission(req, "projects");
    const project = findActiveProject(req.params.id);
    const store = db();
    if (!store.productions.some((p) => p.projectId === project.id)) throw notFound("Production not found");
    store.productions = store.productions.filter((p) => p.projectId !== project.id);
    touchProject(project.id);
    return noContent();
  });
}
