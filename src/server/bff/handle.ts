import "server-only";
import { modeFor, serverEnv } from "@/config/env.server";
import { mockApi } from "@/server/mock";
import { forwardToPanelApi } from "./forward";
import { isMockInternalPath, resolveModule } from "./module-resolver";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const error = (status: number, message: string) => Response.json({ statusCode: status, message }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * CSRF defense in depth: state-changing requests must come from this same origin.
 * (The refresh cookie is SameSite=Lax as well.)
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers / server tools
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function parseCookies(header: string | null) {
  const map = new Map<string, string>();
  header?.split(";").forEach((pair) => {
    const index = pair.indexOf("=");
    if (index > 0) map.set(pair.slice(0, index).trim(), decodeURIComponent(pair.slice(index + 1).trim()));
  });
  return map;
}

async function readJson(request: Request): Promise<unknown> {
  if (SAFE_METHODS.has(request.method)) return undefined;
  if (!request.headers.get("content-type")?.includes("application/json")) return undefined;
  const text = await request.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return Symbol.for("invalid-json");
  }
}

/** Backend-for-frontend entry point: every `/api/*` call from the browser lands here. */
export async function handleBff(request: Request, segments: string[]): Promise<Response> {
  const path = segments.join("/");
  const url = new URL(request.url);

  if (!SAFE_METHODS.has(request.method) && !isSameOrigin(request)) return error(403, "Cross-origin request rejected");

  const internal = isMockInternalPath(path);
  const apiModule = internal ? null : resolveModule(path);
  if (!internal && !apiModule) return error(404, "Not found");

  const mode = internal ? (serverEnv.NODE_ENV === "production" && serverEnv.API_MODE === "real" ? "real" : "mock") : modeFor(apiModule!);
  if (mode === "real") {
    if (internal) return error(404, "Not found");
    return forwardToPanelApi(request, path, url.search);
  }

  const body = internal ? undefined : await readJson(request);
  if (body === Symbol.for("invalid-json")) return error(400, "Invalid JSON body");

  const response = await mockApi.dispatch(
    {
      method: request.method,
      path,
      query: url.searchParams,
      headers: request.headers,
      cookies: parseCookies(request.headers.get("cookie")),
      body,
      raw: request,
    },
    segments,
  );
  if (!response.headers.has("cache-control")) response.headers.set("Cache-Control", "no-store");
  return response;
}
