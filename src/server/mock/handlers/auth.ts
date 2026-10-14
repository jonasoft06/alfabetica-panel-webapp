import "server-only";
import { serverEnv } from "@/config/env.server";
import { REFRESH_TOKEN_COOKIE } from "@/contracts/auth";
import { clearRefreshCookie, refreshCookie } from "../cookies";
import { db, nowIso } from "../db";
import { forbidden, json, noContent, unauthorized } from "../http";
import type { MockRouter } from "../router";

const randomToken = () => `mock.${crypto.randomUUID()}.${crypto.randomUUID()}`;

function issueAccessToken(userId: string) {
  const token = randomToken();
  db().accessTokens.set(token, { userId, expiresAt: Date.now() + serverEnv.MOCK_ACCESS_TOKEN_TTL * 1000 });
  return token;
}

/** Mirrors auth.controller.ts: login (Firebase ID token → access + refresh cookie), refresh, logout. */
export function registerAuth(router: MockRouter) {
  router.post("auth/login", (req) => {
    const header = req.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) throw unauthorized("Missing Firebase ID token");
    const profile = header
      .slice(7)
      .trim()
      .replace(/^mock-id-token\./, "");

    const user = db().users.find((u) => u.mockProfile === profile);
    if (!user) throw forbidden("This email has not been invited to the panel", { code: "USER_NOT_INVITED" });
    if (user.status === "INACTIVE") throw forbidden("This account is inactive", { code: "USER_INACTIVE" });

    user.status = "ACTIVE";
    user.lastLogin = nowIso();
    const refreshToken = randomToken();
    db().refreshTokens.set(refreshToken, { userId: user.id, expiresAt: Date.now() + serverEnv.MOCK_REFRESH_TOKEN_TTL * 1000 });

    return json({ accessToken: issueAccessToken(user.id) }, { headers: { "Set-Cookie": refreshCookie(refreshToken, serverEnv.MOCK_REFRESH_TOKEN_TTL) } });
  });

  router.post("auth/refresh", (req) => {
    const token = req.cookies.get(REFRESH_TOKEN_COOKIE);
    if (!token) throw unauthorized("Missing refresh token");
    const session = db().refreshTokens.get(token);
    const user = session && db().users.find((u) => u.id === session.userId && u.status === "ACTIVE");
    if (!session || session.expiresAt < Date.now() || !user) throw unauthorized("Invalid refresh token");
    return json({ accessToken: issueAccessToken(user.id) });
  });

  router.post("auth/logout", (req) => {
    const token = req.cookies.get(REFRESH_TOKEN_COOKIE);
    if (token) db().refreshTokens.delete(token);
    return noContent({ headers: { "Set-Cookie": clearRefreshCookie() } });
  });
}
