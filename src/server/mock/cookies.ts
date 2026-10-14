import "server-only";
import { REFRESH_TOKEN_COOKIE } from "@/contracts/auth";
import { serverEnv } from "@/config/env.server";

/** Same options as panel-api `refreshCookieOptions()`: httpOnly, sameSite lax, secure in production, path "/". */
export function refreshCookie(value: string, maxAgeSeconds: number): string {
  const parts = [
    `${REFRESH_TOKEN_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    `Expires=${new Date(Date.now() + maxAgeSeconds * 1000).toUTCString()}`,
  ];
  if (serverEnv.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export const clearRefreshCookie = () => refreshCookie("", 0);
