import { z } from "zod";
import { BOOK_TYPES, PRODUCTION_STATUSES, type ProductionDetail, type UpsertProductionRequest } from "@/contracts/production";
import { CLICKUP_LIST_ID_PATTERN } from "../lib/clickup";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
/** Native date inputs hand back "" or "yyyy-mm-dd": kept as plain strings, never turned into a Date. */
const calendarDate = z.string().refine((v) => v === "" || DATE_ONLY.test(v), "Usa una fecha válida.");

/**
 * Mirrors UpsertProductionDto. Selects use "" for "none". bookType, status, phase and the two dates are the
 * manual fields: only sent while the production is not linked to ClickUp.
 */
export const productionFormSchema = z.object({
  authorName: z.string().trim().max(200, "Máximo 200 caracteres."),
  clickupListId: z
    .string()
    .trim()
    .refine((v) => v === "" || CLICKUP_LIST_ID_PATTERN.test(v), "Usa solo números: el ID de la lista o su URL de ClickUp."),
  bookType: z.union([z.enum(BOOK_TYPES), z.literal("")]),
  status: z.enum(PRODUCTION_STATUSES),
  currentPhaseCode: z.string(),
  currentStageDueDate: calendarDate,
  estimatedEndDate: calendarDate,
});

export type ProductionFormValues = z.infer<typeof productionFormSchema>;
type Dirty = Partial<Record<keyof ProductionFormValues, unknown>>;

export const emptyProductionForm: ProductionFormValues = {
  authorName: "",
  clickupListId: "",
  bookType: "",
  status: "NOT_STARTED",
  currentPhaseCode: "",
  currentStageDueDate: "",
  estimatedEndDate: "",
};

export function toFormValues(p: ProductionDetail): ProductionFormValues {
  return {
    authorName: p.authorName ?? "",
    clickupListId: p.clickupListId ?? "",
    bookType: p.bookType ?? "",
    status: p.status,
    currentPhaseCode: p.currentPhase?.code ?? "",
    currentStageDueDate: p.currentStageDueDate ?? "",
    estimatedEndDate: p.estimatedEndDate ?? "",
  };
}

const orNull = <T extends string>(value: T | "") => (value === "" ? null : value);

/**
 * Only changed fields are sent (absent = unchanged); an emptied field is sent as null.
 * Linking takes the list's data from ClickUp, so manual edits are left out of a link request (the API would
 * reject them). Status and phase travel together: the form keeps them consistent (`manual-state.ts`).
 */
export function toUpsertPayload(values: ProductionFormValues, dirty: Dirty, { manual }: { manual: boolean }): UpsertProductionRequest {
  const body: UpsertProductionRequest = {};
  if (dirty.authorName) body.authorName = values.authorName || null;
  if (dirty.clickupListId) body.clickupListId = values.clickupListId || null;
  if (!manual || body.clickupListId) return body;
  if (dirty.bookType) body.bookType = orNull(values.bookType);
  if (dirty.status || dirty.currentPhaseCode) {
    body.status = values.status;
    body.currentPhaseCode = orNull(values.currentPhaseCode);
  }
  if (dirty.currentStageDueDate) body.currentStageDueDate = orNull(values.currentStageDueDate);
  if (dirty.estimatedEndDate) body.estimatedEndDate = orNull(values.estimatedEndDate);
  return body;
}

/** Whether any manual field has unsaved changes (they are dropped when linking). */
export const hasManualChanges = (dirty: Dirty) =>
  !!(dirty.bookType || dirty.status || dirty.currentPhaseCode || dirty.currentStageDueDate || dirty.estimatedEndDate);
