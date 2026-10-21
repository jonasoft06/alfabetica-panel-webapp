import "server-only";
import type { BookType, ProductionDetail, ProductionListItem, ProductionSource } from "@/contracts/production";
import { db, newId, nowIso, type ProductionRecord } from "../../db";
import { codedError } from "../../http";

/** Same alphabet as panel-api `public-code.util.ts`: no 0/O, 1/I/L. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const DAY = 24 * 3600 * 1000;

const group = () => Array.from({ length: 4 }, () => ALPHABET[crypto.getRandomValues(new Uint32Array(1))[0] % ALPHABET.length]).join("");

export function generatePublicCode(): string {
  let code: string;
  do code = `${group()}-${group()}`;
  while (db().productions.some((p) => p.publicCode === code));
  return code;
}

/** New production as created by POST /projects (production: {}) or POST /projects/:id/production: NOT_STARTED, manual. */
export function createProductionRecord(projectId: string): ProductionRecord {
  const now = nowIso();
  const record: ProductionRecord = {
    id: newId(),
    projectId,
    publicCode: generatePublicCode(),
    authorName: null,
    clickupListId: null,
    bookType: null,
    status: "NOT_STARTED",
    currentPhaseCode: null,
    currentStageName: null,
    currentStageDueDate: null,
    estimatedEndDate: null,
    lastSyncedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  db().productions.push(record);
  return record;
}

/**
 * What unlinking (or deleting the project) resets. Like panel-api `unlinkedData`: the production turns MANUAL
 * and keeps its last status, phase, book type and dates; only what needs a list is cleared.
 */
export const UNLINKED: Pick<ProductionRecord, "clickupListId" | "currentStageName" | "lastSyncedAt"> = {
  clickupListId: null,
  currentStageName: null,
  lastSyncedAt: null,
};

export const sourceOf = (r: ProductionRecord): ProductionSource => (r.clickupListId === null ? "MANUAL" : "CLICKUP");

/* ---------- simulated ClickUp ---------------------------------------------------------- */

/** Deterministic pseudo-random in [0, 1) from a string, so repeated syncs are reproducible. */
function hash01(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

const calendarDate = (daysFromToday: number) => new Date(Date.now() + daysFromToday * DAY).toISOString().slice(0, 10);

const STAGE_NAMES = ["Revisión de manuscrito", "Corrección de estilo", "Maquetación de interiores", "Pruebas con el autor", "Imprenta"];
/** Phases a list in production can be in (PUBLISHED only comes from an archived list). */
const IN_PRODUCTION_PHASES = ["CONTENT_REVIEW", "COPYEDITING", "LAYOUT", "FINAL_REVIEW", "PRINTING"];

/**
 * Stand-in for ClickUp. List ids starting with 404 / 422 / 418 / 502 simulate the API's errors
 * (not found, not in a production folder, unmapped stages, ClickUp down); any other numeric id is a list in production.
 */
function assertListReadable(listId: string) {
  if (listId.startsWith("404")) throw codedError(422, "CLICKUP_LIST_NOT_FOUND", "ClickUp list not found");
  if (listId.startsWith("422")) throw codedError(422, "CLICKUP_LIST_NOT_IN_PRODUCTION", "ClickUp list is not in a production folder");
  if (listId.startsWith("418")) throw codedError(422, "CLICKUP_LIST_UNMAPPED_STAGE", "ClickUp list stages cannot be mapped to production phases");
  if (listId.startsWith("502")) throw codedError(502, "CLICKUP_UNAVAILABLE", "ClickUp is unavailable");
}

type SyncData = Pick<
  ProductionRecord,
  "bookType" | "status" | "currentPhaseCode" | "currentStageName" | "currentStageDueDate" | "estimatedEndDate" | "lastSyncedAt"
>;

const pick = (r: ProductionRecord): SyncData => ({
  bookType: r.bookType,
  status: r.status,
  currentPhaseCode: r.currentPhaseCode,
  currentStageName: r.currentStageName,
  currentStageDueDate: r.currentStageDueDate,
  estimatedEndDate: r.estimatedEndDate,
  lastSyncedAt: r.lastSyncedAt,
});

function inProduction(listId: string, phaseIndex: number): SyncData {
  const index = Math.min(Math.max(phaseIndex, 0), IN_PRODUCTION_PHASES.length - 1);
  const bookType: BookType = hash01(`${listId}:type`) < 0.5 ? "ACADEMIC" : "TEXTBOOK";
  const remaining = IN_PRODUCTION_PHASES.length - index;
  const noDueDate = hash01(`${listId}:${index}:due`) < 0.2; // a stage without due date is normal in ClickUp
  return {
    bookType,
    status: "IN_PRODUCTION",
    currentPhaseCode: IN_PRODUCTION_PHASES[index],
    currentStageName: `${index + 2}. ${STAGE_NAMES[index]}`,
    currentStageDueDate: noDueDate ? null : calendarDate(4 + Math.round(hash01(`${listId}:${index}`) * 10)),
    estimatedEndDate: hash01(`${listId}:end`) < 0.15 ? null : calendarDate(remaining * 18),
    lastSyncedAt: nowIso(),
  };
}

/** Linking validates the list and reads its current state (PUT with a new clickupListId). */
export function resolveForLink(listId: string, phaseIndex = Math.floor(hash01(listId) * 4)): SyncData {
  assertListReadable(listId);
  return inProduction(listId, phaseIndex);
}

/** Re-reading a linked list: about 40% of syncs advance one phase; leaving Imprenta archives it (FINISHED). */
export function resolveForSync(record: ProductionRecord): SyncData {
  const listId = record.clickupListId!;
  assertListReadable(listId);
  const index = IN_PRODUCTION_PHASES.indexOf(record.currentPhaseCode ?? "");
  if (record.status === "FINISHED") return { ...pick(record), lastSyncedAt: nowIso() };
  const advances = hash01(`${listId}:${record.lastSyncedAt}`) < 0.4;
  if (advances && index === IN_PRODUCTION_PHASES.length - 1) {
    return { ...pick(record), status: "FINISHED", currentPhaseCode: "PUBLISHED", currentStageName: null, currentStageDueDate: null, lastSyncedAt: nowIso() };
  }
  return inProduction(listId, index + (advances ? 1 : 0));
}

/* ---------- mappers ---------------------------------------------------------------------- */

function phaseRef(code: string | null) {
  const phase = code ? db().phases.find((p) => p.code === code) : undefined;
  return phase ? { code: phase.code, label: phase.label } : null;
}

export function toProductionDetail(r: ProductionRecord): ProductionDetail {
  const { currentPhaseCode, ...rest } = r;
  return { ...rest, source: sourceOf(r), currentPhase: phaseRef(currentPhaseCode) };
}

export function toProductionListItem(r: ProductionRecord, projectTitle: string): ProductionListItem {
  return {
    projectId: r.projectId,
    projectTitle,
    publicCode: r.publicCode,
    authorName: r.authorName,
    source: sourceOf(r),
    status: r.status,
    bookType: r.bookType,
    currentPhase: phaseRef(r.currentPhaseCode),
    currentStageName: r.currentStageName,
    currentStageDueDate: r.currentStageDueDate,
    estimatedEndDate: r.estimatedEndDate,
    lastSyncedAt: r.lastSyncedAt,
    updatedAt: r.updatedAt,
  };
}
