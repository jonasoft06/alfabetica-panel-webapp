/** @api existing — permission catalog seeded in panel-api (`prisma/seed.ts`). */
export const PERMISSION_KEYS = ["users", "projects", "portfolio", "production", "publication", "settings", "inventory"] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/** @api existing — POST /auth/login and POST /auth/refresh. Refresh token travels in the `refreshToken` httpOnly cookie. */
export interface LoginResponse {
  accessToken: string;
}

/** @api existing — GET /users/me */
export interface CurrentUser {
  id: string;
  name: string | null;
  email: string;
  status: string;
  role: { id: string; name: string } | null;
  permissions: PermissionKey[];
}

/** @api existing — machine codes returned with 403 on POST /auth/login. */
export const AUTH_ERROR_CODES = ["EMAIL_NOT_VERIFIED", "USER_NOT_INVITED", "INVITATION_EXPIRED", "USER_INACTIVE", "ACCOUNT_CONFLICT"] as const;
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

/** Name of the httpOnly cookie set by panel-api (`auth.controller.ts`). */
export const REFRESH_TOKEN_COOKIE = "refreshToken";
