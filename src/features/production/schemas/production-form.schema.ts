import { z } from "zod";
import type { ProductionDetail, UpsertProductionRequest } from "@/contracts/production";
import { addDaysIso, CLICKUP_ID_PATTERN } from "../lib/clickup";

const isoDate = z.string().refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`))), "Usa una fecha válida.");

/** Mirrors the proposed UpsertProductionDto. */
export const productionFormSchema = z.object({
  publicCode: z.string().trim().min(1, "Escribe el código al público.").max(40, "Máximo 40 caracteres."),
  clickupListId: z
    .string()
    .trim()
    .refine((v) => v === "" || CLICKUP_ID_PATTERN.test(v), "Usa 5 a 20 letras o números, sin espacios ni símbolos."),
  startDate: isoDate,
  estimatedTotalDays: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0 && Number(v) <= 3650), "Escribe un número entero de días mayor a 0."),
  currentStageId: z.string(),
});

export type ProductionFormValues = z.infer<typeof productionFormSchema>;

export const emptyProductionForm: ProductionFormValues = { publicCode: "", clickupListId: "", startDate: "", estimatedTotalDays: "", currentStageId: "" };

export function toFormValues(p: ProductionDetail): ProductionFormValues {
  return {
    publicCode: p.publicCode,
    clickupListId: p.clickupListId ?? "",
    startDate: p.startDate ?? "",
    estimatedTotalDays: p.estimatedTotalDays ? String(p.estimatedTotalDays) : "",
    currentStageId: p.currentStageId ?? "",
  };
}

/** Estimated end date is derived (start + days), mirroring the "CALCULADO" field of the board. */
export function computeEndDate(values: Pick<ProductionFormValues, "startDate" | "estimatedTotalDays">): string | null {
  return addDaysIso(values.startDate, Number(values.estimatedTotalDays));
}

export function toUpsertPayload(values: ProductionFormValues): UpsertProductionRequest {
  return {
    publicCode: values.publicCode,
    clickupListId: values.clickupListId || null,
    startDate: values.startDate || null,
    estimatedTotalDays: values.estimatedTotalDays ? Number(values.estimatedTotalDays) : null,
    estimatedEndDate: computeEndDate(values),
    currentStageId: values.currentStageId || null,
  };
}
