/** ISO-8601 date string as serialized by NestJS. */
export type IsoDate = string;

/** Prisma Decimal serialized by NestJS (e.g. "385.00"). */
export type DecimalString = string;

/**
 * Error body produced by NestJS exceptions.
 * Newer endpoints (auth, production) add a machine `code`; older facets and users send `reason` instead.
 * Some conflicts carry only `{ reason }` (no statusCode/message), so every field is optional.
 */
export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  code?: string;
  reason?: string;
  [extra: string]: unknown;
}
