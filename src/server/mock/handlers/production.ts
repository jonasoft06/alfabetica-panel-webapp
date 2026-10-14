import "server-only";
import type { ProductionDetail, ProductionListItem, ProductionStage, UpsertProductionRequest } from "@/contracts/production";
import { db, nowIso, type ProductionRecord, type StageRecord } from "../db";
import { requirePermission, requireUser } from "../guards";
import { badRequest, conflict, json, notFound } from "../http";
import { findActiveProject, touchProject } from "../lookups";
import type { MockRouter } from "../router";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CLICKUP_ID = /^[A-Za-z0-9]{5,20}$/;

const sortedStages = (): StageRecord[] => [...db().stages].sort((a, b) => a.sortOrder - b.sortOrder);
const toStage = (s: StageRecord): ProductionStage => ({ ...s, clickupStatusMatch: [...s.clickupStatusMatch] });
const toDetail = (p: ProductionRecord): ProductionDetail => ({ ...p });

function isValidDate(value: string) {
  return ISO_DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** Deterministic pseudo-random in [0, 1) from a string, so repeated syncs are reproducible. */
function hash01(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/** Mirrors the class-validator rules the future UpsertProductionDto will have. */
function validate(body: UpsertProductionRequest, current: ProductionRecord) {
  const errors: string[] = [];
  const store = db();
  if (body.publicCode !== undefined) {
    const code = String(body.publicCode).trim();
    if (!code) errors.push("publicCode should not be empty");
    else if (code.length > 40) errors.push("publicCode must be shorter than or equal to 40 characters");
    else if (store.productions.some((p) => p.id !== current.id && p.publicCode.toLowerCase() === code.toLowerCase()))
      throw conflict(`Public code ${code} is already in use`);
  }
  if (body.clickupListId != null && !CLICKUP_ID.test(body.clickupListId)) errors.push("clickupListId must be alphanumeric, 5 to 20 characters");
  for (const key of ["startDate", "estimatedEndDate"] as const) {
    const value = body[key];
    if (value != null && !isValidDate(value)) errors.push(`${key} must be a valid ISO 8601 date string (yyyy-mm-dd)`);
  }
  const days = body.estimatedTotalDays;
  if (days != null && (!Number.isInteger(days) || days <= 0)) errors.push("estimatedTotalDays must be a positive integer");
  if (body.currentStageId && !store.stages.some((s) => s.id === body.currentStageId)) errors.push("currentStageId must reference an existing stage");
  if (errors.length) throw badRequest(errors);
}

/**
 * TODO(api): proposed module 8 endpoints (permission `production` for writes; reads need a valid session).
 * Relation lifecycle (POST/DELETE projects/:id/production) lives in production-relation.ts.
 */
export function registerProduction(router: MockRouter) {
  router.get("productions", (req) => {
    requireUser(req);
    const store = db();
    const items: ProductionListItem[] = [];
    for (const p of store.productions) {
      const project = store.projects.find((x) => x.id === p.projectId && !x.deletedAt);
      if (!project) continue;
      const stage = store.stages.find((s) => s.id === p.currentStageId);
      items.push({
        id: p.id,
        projectId: p.projectId,
        title: project.title,
        subtitle: project.subtitle,
        publicCode: p.publicCode,
        clickupListId: p.clickupListId,
        currentStage: stage ? { id: stage.id, key: stage.key, clientLabel: stage.clientLabel, sortOrder: stage.sortOrder } : null,
        estimatedEndDate: p.estimatedEndDate,
        lastSyncedAt: p.lastSyncedAt,
      });
    }
    return json({ items, lastSyncedAt: store.settings.lastClickupSyncAt });
  });

  router.get("production-stages", (req) => {
    requireUser(req);
    return json(sortedStages().map(toStage));
  });

  router.get("projects/:id/production", (req) => {
    requireUser(req);
    const project = findActiveProject(req.params.id);
    const production = db().productions.find((p) => p.projectId === project.id);
    if (!production) throw notFound("Production not found");
    return json(toDetail(production));
  });

  router.put("projects/:id/production", (req) => {
    requirePermission(req, "production");
    const project = findActiveProject(req.params.id);
    const production = db().productions.find((p) => p.projectId === project.id);
    if (!production) throw notFound("Production not found");
    const body = (req.body ?? {}) as UpsertProductionRequest;
    validate(body, production);

    if (body.publicCode !== undefined) production.publicCode = body.publicCode.trim();
    if (body.clickupListId !== undefined && body.clickupListId !== production.clickupListId) {
      production.clickupListId = body.clickupListId;
      production.lastSyncedAt = null;
    }
    if (body.startDate !== undefined) production.startDate = body.startDate;
    if (body.estimatedTotalDays !== undefined) production.estimatedTotalDays = body.estimatedTotalDays;
    if (body.estimatedEndDate !== undefined) production.estimatedEndDate = body.estimatedEndDate;
    if (body.currentStageId !== undefined) production.currentStageId = body.currentStageId;
    production.updatedAt = nowIso();
    touchProject(project.id);
    return json(toDetail(production));
  });

  router.post("productions/sync", (req) => {
    requirePermission(req, "production");
    const store = db();
    const stages = sortedStages();
    const syncedAt = nowIso();
    let updated = 0;
    for (const p of store.productions) {
      if (!p.clickupListId || !store.projects.some((x) => x.id === p.projectId && !x.deletedAt)) continue;
      const index = stages.findIndex((s) => s.id === p.currentStageId);
      const next = stages[index + 1];
      // Deterministic "ClickUp moved the task" simulation: about a third of linked lists advance one stage.
      if (next && hash01(`${p.id}:${p.currentStageId}`) < 0.34) {
        p.currentStageId = next.id;
        p.updatedAt = syncedAt;
        updated++;
      }
      p.lastSyncedAt = syncedAt;
    }
    store.settings.lastClickupSyncAt = syncedAt;
    return json({ syncedAt, updated });
  });
}
