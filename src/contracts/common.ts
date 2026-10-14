/** ISO-8601 date string as serialized by NestJS. */
export type IsoDate = string;

/** Prisma Decimal serialized by NestJS (e.g. "385.00"). */
export type DecimalString = string;

/**
 * Error body produced by NestJS exceptions.
 * Auth errors add a machine `code` (see panel-api `auth-error.ts`).
 */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  code?: string;
  [extra: string]: unknown;
}
