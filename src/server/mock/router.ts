import "server-only";
import { HttpError, json, latency, type MockHandler, type MockRequest } from "./http";

interface Route {
  method: string;
  parts: string[];
  handler: MockHandler;
}

/** Minimal path router: patterns like "projects/:id/portfolio". Static segments win over params. */
export class MockRouter {
  private routes: Route[] = [];

  on(method: string, pattern: string, handler: MockHandler) {
    this.routes.push({ method, parts: pattern.split("/").filter(Boolean), handler });
    return this;
  }
  get = (pattern: string, handler: MockHandler) => this.on("GET", pattern, handler);
  post = (pattern: string, handler: MockHandler) => this.on("POST", pattern, handler);
  put = (pattern: string, handler: MockHandler) => this.on("PUT", pattern, handler);
  patch = (pattern: string, handler: MockHandler) => this.on("PATCH", pattern, handler);
  delete = (pattern: string, handler: MockHandler) => this.on("DELETE", pattern, handler);

  private match(method: string, segments: string[]) {
    let best: { route: Route; params: Record<string, string>; score: number } | null = null;
    for (const route of this.routes) {
      if (route.method !== method || route.parts.length !== segments.length) continue;
      const params: Record<string, string> = {};
      let score = 0;
      const ok = route.parts.every((part, i) => {
        if (part.startsWith(":")) {
          params[part.slice(1)] = decodeURIComponent(segments[i]);
          return true;
        }
        score++;
        return part === segments[i];
      });
      if (ok && (!best || score > best.score)) best = { route, params, score };
    }
    return best;
  }

  async dispatch(req: Omit<MockRequest, "params">, segments: string[]): Promise<Response> {
    const found = this.match(req.method, segments);
    if (!found) return json({ statusCode: 404, message: `Cannot ${req.method} /${segments.join("/")}`, error: "Not Found" }, { status: 404 });
    try {
      if (req.method !== "GET") await latency(320);
      else await latency();
      return await found.route.handler({ ...req, params: found.params });
    } catch (error) {
      if (error instanceof HttpError) return json(error.body, { status: error.status });
      console.error("[mock-api]", error);
      return json({ statusCode: 500, message: "Internal server error" }, { status: 500 });
    }
  }
}
