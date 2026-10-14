import "server-only";
import { serverEnv } from "@/config/env.server";
import { REFRESH_TOKEN_COOKIE } from "@/contracts/auth";

/** Request headers forwarded to panel-api. Everything else is dropped. */
const FORWARDED_REQUEST_HEADERS = ["authorization", "content-type", "accept", "accept-language"];
/** Response headers passed back to the browser (plus every Set-Cookie). */
const FORWARDED_RESPONSE_HEADERS = ["content-type", "cache-control", "etag", "last-modified"];

/** Proxies one request to alfabetica-panel-api (real mode). */
export async function forwardToPanelApi(request: Request, path: string, search: string): Promise<Response> {
  const target = new URL(`${path}${search}`, serverEnv.PANEL_API_URL!.replace(/\/?$/, "/"));

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Only the refresh cookie travels to the API — never the rest of the browser's cookies.
  const refresh = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${REFRESH_TOKEN_COOKIE}=`));
  if (refresh) headers.set("cookie", refresh);
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return Response.json({ statusCode: 502, message: "panel-api is unreachable", error: "Bad Gateway" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append("set-cookie", cookie);

  return new Response(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: responseHeaders });
}
