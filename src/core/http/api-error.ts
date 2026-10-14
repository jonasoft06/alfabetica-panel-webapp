import type { ApiErrorBody } from "@/contracts/common";

/** Normalized error thrown by the HTTP client for any non-2xx response. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body?: ApiErrorBody;

  constructor(status: number, body?: ApiErrorBody) {
    const raw = body?.message;
    super(Array.isArray(raw) ? raw.join(" · ") : (raw ?? `Request failed with status ${status}`));
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code;
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

/** Human message in Spanish for generic failures; features can map specific codes. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return "No hay conexión con el servidor. Revisa tu red e intenta de nuevo.";
    if (error.isForbidden) return "No tienes permiso para realizar esta acción.";
    if (error.isNotFound) return "El elemento ya no existe o fue eliminado.";
    if (error.status >= 500) return "El servidor tuvo un problema. Intenta de nuevo en unos minutos.";
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}
