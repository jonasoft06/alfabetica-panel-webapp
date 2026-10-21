import type { ApiErrorBody } from "@/contracts/common";
import type { LoginResponse } from "@/contracts/auth";
import { tokenStore } from "@/core/auth/token-store";
import { ApiError } from "./api-error";
import { endpoints } from "./endpoints";

/** Every request goes through the Next.js BFF (same origin), never straight to panel-api. */
const BFF_PREFIX = "/api";

type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  query?: Query;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  /** Skip the bearer token and the 401 → refresh → retry cycle (auth endpoints). */
  anonymous?: boolean;
}

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/** Lets the session layer react (redirect to /login) when a refresh fails mid-session. */
export function onSessionExpired(listener: SessionExpiredListener) {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function buildUrl(path: string, query?: Query) {
  const url = `${BFF_PREFIX}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function send(method: string, path: string, options: RequestOptions, token: string | null = null): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (!options.anonymous && token) headers.set("Authorization", `Bearer ${token}`);

  try {
    return await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "same-origin",
      cache: "no-store",
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, { statusCode: 0, message: "Network error" });
  }
}

/* ---------- single-flight refresh ------------------------------------------------ */

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Exchanges the httpOnly refresh cookie for a new access token.
 * Concurrent 401s share one refresh request instead of racing.
 *
 * Resolves `null` only when panel-api rejects the refresh cookie (401/403): the session is over.
 * A network error or a 5xx rejects with `ApiError` instead, so a hiccup never logs the user out
 * while the refresh token is still valid.
 */
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      const response = await send("POST", endpoints.auth.refresh(), { anonymous: true });
      if (response.status === 401 || response.status === 403) return null;
      if (!response.ok) throw new ApiError(response.status, await parseBody<ApiErrorBody>(response).catch(() => undefined));
      const { accessToken } = await parseBody<LoginResponse>(response);
      tokenStore.set(accessToken);
      return accessToken;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const sentToken = tokenStore.get();
  let response = await send(method, path, options, sentToken);

  // Access tokens last 15 minutes: renew once and retry. If another call already renewed the token
  // while this one was in flight, retry with that token instead of refreshing again.
  if (response.status === 401 && !options.anonymous) {
    const current = tokenStore.get();
    const renewed = current && current !== sentToken ? current : await refreshAccessToken();
    if (!renewed) {
      tokenStore.clear();
      sessionExpiredListeners.forEach((listener) => listener());
      throw new ApiError(401, await parseBody<ApiErrorBody>(response).catch(() => undefined));
    }
    response = await send(method, path, options, renewed);
  }

  if (!response.ok) {
    const body = await parseBody<ApiErrorBody>(response).catch(() => undefined);
    throw new ApiError(response.status, body);
  }
  return parseBody<T>(response);
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PATCH", path, { ...options, body }),
  delete: <T = void>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};

/**
 * Uploads a file straight to the presigned URL returned by panel-api (DigitalOcean Spaces).
 * In mock mode the URL points back to the BFF, which accepts and discards the bytes.
 */
export async function uploadToPresignedUrl(uploadUrl: string, file: Blob, contentType: string) {
  const response = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": contentType } });
  if (!response.ok) throw new ApiError(response.status, { statusCode: response.status, message: "Upload failed" });
}
