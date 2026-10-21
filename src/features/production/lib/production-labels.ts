import type { BookType, ProductionSource, ProductionStatus } from "@/contracts/production";
import type { BadgeTone } from "@/shared/ui/badge";

export const STATUS_LABELS: Record<ProductionStatus, string> = {
  NOT_STARTED: "Sin iniciar",
  IN_PRODUCTION: "En producción",
  FINISHED: "Terminado",
};

export const STATUS_TONES: Record<ProductionStatus, BadgeTone> = {
  NOT_STARTED: "neutral",
  IN_PRODUCTION: "bubblegum",
  FINISHED: "turquoise",
};

export const BOOK_TYPE_LABELS: Record<BookType, string> = {
  ACADEMIC: "Libro académico",
  TEXTBOOK: "Libro de texto",
};

export const SOURCE_LABELS: Record<ProductionSource, string> = { MANUAL: "Manual", CLICKUP: "ClickUp" };

export const LINK_CONFIRMATION = "Al vincular, los datos de producción se tomarán de ClickUp y reemplazarán lo capturado.";
export const UNLINK_CONFIRMATION = "Se conservarán los datos actuales y podrás editarlos manualmente.";

/** Shown for any calendar date that is not known yet. */
export const DATE_TBD = "Fecha por confirmar";
