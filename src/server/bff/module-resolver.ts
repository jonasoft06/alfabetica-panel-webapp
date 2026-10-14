import "server-only";
import type { ApiModule } from "@/config/env.server";

/**
 * Allow-list of panel-api paths the BFF will serve, grouped by module.
 * Anything not matched here is rejected with 404 (the BFF is not an open proxy).
 * Order matters: first match wins.
 */
const RULES: [RegExp, ApiModule][] = [
  [/^auth\/(login|refresh|logout)$/, "auth"],
  [/^users(\/.*)?$/, "users"],
  [/^roles$/, "users"],
  [/^permissions$/, "users"],
  [/^projects\/[^/]+\/media$/, "media"],
  [/^media\/.+$/, "media"],
  [/^projects\/[^/]+\/portfolio(\/.*)?$/, "portfolio"],
  [/^portfolios(\/.*)?$/, "portfolio"],
  [/^projects\/[^/]+\/publication(\/.*)?$/, "publication"],
  [/^publications(\/.*)?$/, "publication"],
  [/^projects\/[^/]+\/production(\/.*)?$/, "production"],
  [/^productions(\/.*)?$/, "production"],
  [/^production-stages$/, "production"],
  [/^projects(\/[^/]+)?$/, "projects"],
  [/^dashboard\/.+$/, "dashboard"],
];

export function resolveModule(path: string): ApiModule | null {
  return RULES.find(([pattern]) => pattern.test(path))?.[1] ?? null;
}

/** Internal mock-only paths (simulated Spaces upload + CDN). */
export const isMockInternalPath = (path: string) => path.startsWith("__mock/");
