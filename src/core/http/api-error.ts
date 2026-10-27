import type { ApiErrorBody } from "@/contracts/common";

/** Normalized error thrown by the HTTP client for any non-2xx response. */
export class ApiError extends Error {
  readonly status: number;
  /** Machine code: `code` on newer panel-api endpoints, `reason` on the older facets — both land here. */
  readonly code?: string;
  readonly body?: ApiErrorBody;

  constructor(status: number, body?: ApiErrorBody) {
    const raw = body?.message;
    super(Array.isArray(raw) ? raw.join(" · ") : (raw ?? `Request failed with status ${status}`));
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code ?? body?.reason;
    this.body = body;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isConflict() {
    return this.status === 409;
  }
}

/** Client-side failure whose message is already written for the user (Spanish). */
export class UserFacingError extends Error {
  override name = "UserFacingError";
}

/** Spanish messages per machine code (`code` / `reason`), supplied by each feature. */
export type ErrorMessages = Partial<Record<string, string>>;

/** Codes any feature can hit. 422 from a media confirm: the uploaded object is unusable, retry from scratch. */
const SHARED_MESSAGES: ErrorMessages = {
  UPLOAD_OBJECT_MISSING: "No se pudo subir el archivo, inténtalo de nuevo",
  UPLOAD_OBJECT_MISMATCH: "No se pudo subir el archivo, inténtalo de nuevo",
};

/** Human message in Spanish. Feature-specific codes win over the shared ones and the generic per-status messages. */
export function describeError(error: unknown, messages?: ErrorMessages): string {
  if (error instanceof UserFacingError) return error.message;
  if (error instanceof ApiError) {
    const specific = error.code ? (messages?.[error.code] ?? SHARED_MESSAGES[error.code]) : undefined;
    if (specific) return specific;
    if (error.status === 0) return "No hay conexión con el servidor. Revisa tu red e intenta de nuevo.";
    if (error.isForbidden) return "No tienes permiso para realizar esta acción.";
    if (error.isNotFound) return "El elemento ya no existe o fue eliminado.";
    if (error.status >= 500) return "El servidor tuvo un problema. Intenta de nuevo en unos minutos.";
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}
