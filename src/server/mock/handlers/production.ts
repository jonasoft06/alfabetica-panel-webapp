import "server-only";
import { BOOK_TYPES, PRODUCTION_STATUSES, PUBLISHED_PHASE_CODE, type ProductionListItem, type ProductionStatus, type UpsertProductionRequest } from "@/contracts/production";
import { db, nowIso, type ProductionRecord } from "../db";
import { requirePermission, requireUser } from "../guards";
import { badRequest, codedError, json } from "../http";
import { findActiveProject, touchProject } from "../lookups";
import type { MockRouter } from "../router";
import { resolveForLink, resolveForSync, toProductionDetail, toProductionListItem, UNLINKED } from "./shared/production-records";

const LIST_ID = /^\d+$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const FIELDS = ["authorName", "clickupListId", "bookType", "status", "currentPhaseCode", "currentStageDueDate", "estimatedEndDate"] as const;
/** Only accepted while the production is not linked after the request (panel-api MANUAL_FIELDS). */
const MANUAL_FIELDS = ["bookType", "status", "currentPhaseCode", "currentStageDueDate", "estimatedEndDate"] as const;

/** Strict calendar date: the pattern pins the format and the round trip rejects days that do not exist. */
const isCalendarDate = (v: string) => DATE_ONLY.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

function findProduction(projectId: string): ProductionRecord {
  const production = db().productions.find((p) => p.projectId === projectId);
  if (!production) throw codedError(404, "PRODUCTION_NOT_FOUND", "Project has no production");
  return production;
}

/** Mirrors UpsertProductionDto (absent = unchanged, null = clear; whitelist + forbidNonWhitelisted). */
function validate(body: Record<string, unknown>): UpsertProductionRequest {
  const errors: string[] = [];
  for (const key of Object.keys(body)) if (!(FIELDS as readonly string[]).includes(key)) errors.push(`property ${key} should not exist`);
  const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);
  const authorName = trim(body.authorName);
  const clickupListId = trim(body.clickupListId);
  if (authorName != null) {
    if (typeof authorName !== "string" || !authorName) errors.push("authorName should not be empty");
    else if (authorName.length > 200) errors.push("authorName must be shorter than or equal to 200 characters");
  }
  if (clickupListId != null && (typeof clickupListId !== "string" || !LIST_ID.test(clickupListId)))
    errors.push("clickupListId must match /^\\d+$/ regular expression");
  if (body.bookType != null && !(BOOK_TYPES as readonly unknown[]).includes(body.bookType)) errors.push(`bookType must be one of: ${BOOK_TYPES.join(", ")}`);
  if (body.status !== undefined && !(PRODUCTION_STATUSES as readonly unknown[]).includes(body.status))
    errors.push(`status must be one of: ${PRODUCTION_STATUSES.join(", ")}`);
  if (body.currentPhaseCode != null && (typeof body.currentPhaseCode !== "string" || !body.currentPhaseCode)) errors.push("currentPhaseCode should not be empty");
  for (const key of ["currentStageDueDate", "estimatedEndDate"] as const) {
    const v = body[key];
    if (v != null && (typeof v !== "string" || !isCalendarDate(v))) errors.push(`${key} must be a valid ISO 8601 date string`);
  }
  if (errors.length) throw badRequest(errors);
  return { ...(body as UpsertProductionRequest), authorName: authorName as string | null | undefined, clickupListId: clickupListId as string | null | undefined };
}

const inconsistent = () => codedError(400, "PRODUCTION_INCONSISTENT_STATE", "Production status and phase are inconsistent");

/** Same rules as panel-api `manual-state.ts`: setting one side adjusts the other; sending both requires them to agree. */
function resolveStatusAndPhase(
  current: { status: ProductionStatus; phaseCode: string | null },
  input: { status?: ProductionStatus; phaseCode?: string | null },
) {
  const consistent = ({ status, phaseCode }: typeof current) =>
    status === "FINISHED" ? phaseCode === PUBLISHED_PHASE_CODE : status === "NOT_STARTED" ? phaseCode === null : phaseCode !== PUBLISHED_PHASE_CODE;
  if (input.status !== undefined && input.phaseCode !== undefined) {
    const next = { status: input.status, phaseCode: input.phaseCode };
    if (!consistent(next)) throw inconsistent();
    return next;
  }
  if (input.status !== undefined) {
    const status = input.status;
    if (status === "FINISHED") return { status, phaseCode: PUBLISHED_PHASE_CODE };
    if (status === "NOT_STARTED") return { status, phaseCode: null };
    return { status, phaseCode: current.phaseCode === PUBLISHED_PHASE_CODE ? null : current.phaseCode };
  }
  if (input.phaseCode !== undefined) {
    const phaseCode = input.phaseCode;
    if (phaseCode === PUBLISHED_PHASE_CODE) return { status: "FINISHED" as const, phaseCode };
    if (phaseCode === null) {
      if (current.status === "FINISHED") throw inconsistent();
      return { status: current.status, phaseCode };
    }
    return { status: "IN_PRODUCTION" as const, phaseCode };
  }
  return current;
}

/**
 * Mirrors production.controller.ts: reads need any session; PUT and the per-project sync need `production`.
 * Relation lifecycle (POST/DELETE projects/:id/production) lives in production-relation.ts.
 */
export function registerProduction(router: MockRouter) {
  router.get("productions", (req) => {
    requireUser(req);
    const store = db();
    const items: ProductionListItem[] = [];
    for (const p of store.productions) {
      const project = store.projects.find((x) => x.id === p.projectId && !x.deletedAt);
      if (project) items.push(toProductionListItem(p, project.title));
    }
    return json(items.sort((a, b) => a.projectTitle.localeCompare(b.projectTitle, "es")));
  });

  router.get("production-phases", (req) => {
    requireUser(req);
    return json([...db().phases].sort((a, b) => a.sortOrder - b.sortOrder));
  });

  router.get("projects/:id/production", (req) => {
    requireUser(req);
    const project = findActiveProject(req.params.id);
    return json(toProductionDetail(findProduction(project.id)));
  });

  router.put("projects/:id/production", (req) => {
    requirePermission(req, "production");
    const project = findActiveProject(req.params.id);
    const production = findProduction(project.id);
    const body = validate((req.body ?? {}) as Record<string, unknown>);

    const isLinking = typeof body.clickupListId === "string" && body.clickupListId !== production.clickupListId;
    const isUnlinking = body.clickupListId === null && production.clickupListId !== null;
    // Judged on the state after the request: "unlink + edit by hand" is allowed, "link + edit by hand" is not.
    const linkedAfter = isLinking || (production.clickupListId !== null && !isUnlinking);
    const hasManual = MANUAL_FIELDS.some((field) => body[field] !== undefined);
    if (linkedAfter && hasManual) throw codedError(409, "PRODUCTION_MANAGED_BY_CLICKUP", "Production data is managed by ClickUp while a list is linked");
    if (body.currentPhaseCode && !db().phases.some((p) => p.code === body.currentPhaseCode))
      throw codedError(400, "PRODUCTION_PHASE_NOT_FOUND", "Production phase not found");
    if (isLinking) {
      if (db().productions.some((p) => p.id !== production.id && p.clickupListId === body.clickupListId))
        throw codedError(409, "CLICKUP_LIST_ALREADY_LINKED", "ClickUp list is already linked to another production");
      // Validated against "ClickUp" before anything is written, like the API.
      Object.assign(production, resolveForLink(body.clickupListId!), { clickupListId: body.clickupListId });
    }
    if (isUnlinking) Object.assign(production, UNLINKED);
    const authorChanged = body.authorName !== undefined && body.authorName !== production.authorName;
    if (authorChanged) production.authorName = body.authorName ?? null;

    let manualChanged = false;
    if (hasManual) {
      const next = resolveStatusAndPhase(
        { status: production.status, phaseCode: production.currentPhaseCode },
        { status: body.status, phaseCode: body.currentPhaseCode },
      );
      const changes = {
        status: next.status,
        currentPhaseCode: next.phaseCode,
        ...(body.bookType !== undefined && { bookType: body.bookType }),
        ...(body.currentStageDueDate !== undefined && { currentStageDueDate: body.currentStageDueDate }),
        ...(body.estimatedEndDate !== undefined && { estimatedEndDate: body.estimatedEndDate }),
      };
      manualChanged = Object.entries(changes).some(([key, value]) => production[key as keyof typeof changes] !== value);
      Object.assign(production, changes);
    }

    if (isLinking || isUnlinking || authorChanged || manualChanged) {
      production.updatedAt = nowIso();
      touchProject(project.id);
    }
    return json(toProductionDetail(production));
  });

  router.post("projects/:id/production/sync", (req) => {
    requirePermission(req, "production");
    const project = findActiveProject(req.params.id);
    const production = findProduction(project.id);
    if (!production.clickupListId) throw codedError(422, "PRODUCTION_NOT_LINKED", "Production is not linked to a ClickUp list");
    // Derived data: like the API, a sync does not bump updatedAt.
    Object.assign(production, resolveForSync(production));
    return json(toProductionDetail(production));
  });
}
