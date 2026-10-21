import type { ProductionErrorCode } from "@/contracts/production";

/** Spanish messages for the machine `code` of production errors (400 / 409 / 422 / 502). */
export const PRODUCTION_ERROR_MESSAGES: Record<ProductionErrorCode, string> = {
  PRODUCTION_ALREADY_EXISTS: "Este proyecto ya tiene producción.",
  PRODUCTION_NOT_FOUND: "Este proyecto ya no tiene producción.",
  PRODUCTION_MANAGED_BY_CLICKUP: "Estos datos se actualizan desde ClickUp. Desvincula la lista para editarlos.",
  PRODUCTION_PHASE_NOT_FOUND: "Esa fase ya no existe. Recarga la página e intenta de nuevo.",
  PRODUCTION_INCONSISTENT_STATE: "El estado y la fase no coinciden. Revisa ambos campos.",
  PRODUCTION_NOT_LINKED: "Primero vincula una lista de ClickUp para poder sincronizar.",
  CLICKUP_LIST_ALREADY_LINKED: "Esa lista de ClickUp ya está vinculada a otra producción.",
  CLICKUP_LIST_NOT_FOUND: "No encontramos esa lista en ClickUp. Revisa el ID o la URL.",
  CLICKUP_LIST_NOT_IN_PRODUCTION: "Esa lista no está en una carpeta de producción de ClickUp (libros académicos o de texto).",
  CLICKUP_LIST_UNMAPPED_STAGE: "Las etapas de esa lista no coinciden con la plantilla de producción. Revisa la numeración de etapas en ClickUp.",
  CLICKUP_UNAVAILABLE: "ClickUp no responde en este momento. Intenta de nuevo en unos minutos.",
};
