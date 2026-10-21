/**
 * Mock/real switch per group of panel-api endpoints. Dependency-free on purpose: it is shared by
 * `env.server.ts` (validated env, BFF) and `proxy.ts`, which must not import `server-only` modules.
 */
export const API_MODULES = ["auth", "users", "projects", "portfolio", "publication", "media", "production", "dashboard"] as const;
export type ApiModule = (typeof API_MODULES)[number];
export type ApiMode = "mock" | "real";

type RawEnv = Record<string, string | undefined>;

/** Per-module override (`API_MODE_<MODULE>`), else `API_MODE`, else mock. */
export function resolveMode(module: ApiModule, env: RawEnv = process.env): ApiMode {
  return (env[`API_MODE_${module.toUpperCase()}`] ?? env.API_MODE) === "real" ? "real" : "mock";
}

/**
 * True only when every module runs against the mock server (demo mode). As soon as one module is
 * real, the screens without a real API (Resumen, Tienda) are switched off.
 */
export function isMockOnly(env: RawEnv = process.env): boolean {
  return API_MODULES.every((module) => resolveMode(module, env) === "mock");
}

/** First screen after sign-in: Resumen needs GET /dashboard/summary, which only the mock serves. */
export function homePath(mockOnly: boolean): string {
  return mockOnly ? "/resumen" : "/proyectos";
}
