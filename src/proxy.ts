import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "@/contracts/auth";

/** Panel routes that require a session. */
const PROTECTED = ["/resumen", "/proyectos", "/portafolio", "/tienda", "/produccion", "/colaboradores"];

/**
 * Optimistic route guard: only checks that the refresh cookie exists.
 * The real validation happens client-side (POST /auth/refresh) and in panel-api on every call.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (PROTECTED.some((route) => pathname === route || pathname.startsWith(`${route}/`)) && !hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if ((pathname === "/login" && hasSession && !request.nextUrl.searchParams.has("expired")) || pathname === "/") {
    return NextResponse.redirect(new URL(hasSession ? "/resumen" : "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/resumen/:path*", "/proyectos/:path*", "/portafolio/:path*", "/tienda/:path*", "/produccion/:path*", "/colaboradores/:path*"],
};
