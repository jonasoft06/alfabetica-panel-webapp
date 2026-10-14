import "server-only";
import { z } from "zod";

/** Groups of panel-api endpoints that can be switched between the mock server and the real API. */
export const API_MODULES = ["auth", "users", "projects", "portfolio", "publication", "media", "production", "dashboard"] as const;
export type ApiModule = (typeof API_MODULES)[number];

const mode = z.enum(["mock", "real"]);
export type ApiMode = z.infer<typeof mode>;

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    /** Base URL of alfabetica-panel-api (server only, never exposed to the browser). */
    PANEL_API_URL: z.url().optional(),
    /** Default mode for every module. */
    API_MODE: mode.default("mock"),
    API_MODE_AUTH: mode.optional(),
    API_MODE_USERS: mode.optional(),
    API_MODE_PROJECTS: mode.optional(),
    API_MODE_PORTFOLIO: mode.optional(),
    API_MODE_PUBLICATION: mode.optional(),
    API_MODE_MEDIA: mode.optional(),
    API_MODE_PRODUCTION: mode.optional(),
    API_MODE_DASHBOARD: mode.optional(),
    /** Simulated access-token lifetime in seconds (mock auth only). Mirrors JWT_ACCESS_EXPIRES_IN. */
    MOCK_ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(3600),
    /** Simulated refresh-cookie lifetime in seconds (mock auth only). Mirrors JWT_REFRESH_EXPIRES_IN. */
    MOCK_REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(43200),
  })
  .superRefine((env, ctx) => {
    const anyReal = API_MODULES.some((m) => (env[`API_MODE_${m.toUpperCase()}` as keyof typeof env] ?? env.API_MODE) === "real");
    if (anyReal && !env.PANEL_API_URL) {
      ctx.addIssue({ code: "custom", path: ["PANEL_API_URL"], message: "PANEL_API_URL is required when any module runs in real mode" });
    }
  });

export const serverEnv = schema.parse(process.env);

export function modeFor(module: ApiModule): ApiMode {
  const key = `API_MODE_${module.toUpperCase()}` as keyof typeof serverEnv;
  return (serverEnv[key] as ApiMode | undefined) ?? serverEnv.API_MODE;
}
