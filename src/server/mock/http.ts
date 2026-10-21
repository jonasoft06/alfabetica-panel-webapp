import "server-only";
import type { ApiErrorBody } from "@/contracts/common";

/** Normalized request handed to mock handlers. */
export interface MockRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  headers: Headers;
  cookies: Map<string, string>;
  body: unknown;
  raw: Request;
}

export type MockHandler = (req: MockRequest) => Response | Promise<Response>;

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function noContent(init: ResponseInit = {}): Response {
  return new Response(null, { ...init, status: 204 });
}

/** Thrown inside handlers; converted to a NestJS-shaped error body by the router. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string | string[],
    readonly extra: Record<string, unknown> = {},
    /** Replaces the NestJS default body (e.g. `ConflictException({ reason })` sends only `{ reason }`). */
    bodyOverride?: ApiErrorBody,
  ) {
    super(Array.isArray(message) ? message.join(", ") : message);
    this.body = bodyOverride ?? { statusCode: status, message, error: STATUS_TEXT[status] ?? "Error", ...extra };
  }
  readonly body: ApiErrorBody;
}

const STATUS_TEXT: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  502: "Bad Gateway",
};

export const badRequest = (message: string | string[]) => new HttpError(400, message);
export const unauthorized = (message = "Unauthorized") => new HttpError(401, message);
export const forbidden = (message = "Forbidden", extra?: Record<string, unknown>) => new HttpError(403, message, extra);
export const notFound = (message = "Not found") => new HttpError(404, message);
export const conflict = (message: string, extra?: Record<string, unknown>) => new HttpError(409, message, extra);

/** Newer panel-api errors: `{ statusCode, code, message }` (production, auth). */
export const codedError = (status: number, code: string, message: string) => new HttpError(status, message, {}, { statusCode: status, code, message });
/** Older facets / users: `new ConflictException({ reason })` answers exactly `{ reason }`. */
export const reasonError = (status: number, reason: string, extra: Record<string, unknown> = {}) =>
  new HttpError(status, reason, {}, { reason, ...extra });

/** Small artificial latency so loading states are visible while developing. */
export const latency = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));
