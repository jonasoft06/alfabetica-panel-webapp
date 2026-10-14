"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { CurrentUser, PermissionKey } from "@/contracts/auth";
import { onSessionExpired, refreshAccessToken } from "@/core/http/http-client";
import { authApi } from "./auth-api";
import { getIdentityProvider } from "./identity";
import { hasPermission } from "./permissions";
import { tokenStore } from "./token-store";

type SessionStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface SessionContextValue {
  status: SessionStatus;
  user: CurrentUser | null;
  /** Restores the session from the refresh cookie (called by the panel gate). */
  bootstrap: () => Promise<void>;
  signIn: (options?: { profile?: string }) => Promise<CurrentUser>;
  signOut: () => Promise<void>;
  /** Reloads GET /users/me without touching the session status (e.g. after editing own permissions). */
  refreshUser: () => Promise<void>;
  can: (permission: PermissionKey) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const bootstrapping = useRef<Promise<void> | null>(null);

  const reset = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("unauthenticated");
    queryClient.clear();
  }, [queryClient]);

  const bootstrap = useCallback(() => {
    bootstrapping.current ??= (async () => {
      setStatus("loading");
      try {
        if (!tokenStore.get() && !(await refreshAccessToken())) throw new Error("No session");
        setUser(await authApi.me());
        setStatus("authenticated");
      } catch {
        // Stale or invalid refresh cookie: clear it so the route guard stops redirecting to the panel.
        await authApi.logout().catch(() => undefined);
        reset();
      } finally {
        bootstrapping.current = null;
      }
    })();
    return bootstrapping.current;
  }, [reset]);

  const signIn = useCallback(async (options?: { profile?: string }) => {
    const idToken = await getIdentityProvider().signIn(options);
    const { accessToken } = await authApi.login(idToken);
    tokenStore.set(accessToken);
    const me = await authApi.me();
    setUser(me);
    setStatus("authenticated");
    return me;
  }, []);

  const signOut = useCallback(async () => {
    await Promise.allSettled([authApi.logout(), getIdentityProvider().signOut()]);
    reset();
    router.replace("/login");
  }, [reset, router]);

  const refreshUser = useCallback(async () => {
    setUser(await authApi.me());
  }, []);

  // A failed refresh in the middle of the session sends the user back to /login.
  useEffect(
    () =>
      onSessionExpired(() => {
        reset();
        router.replace(`/login?expired=1&next=${encodeURIComponent(window.location.pathname)}`);
      }),
    [reset, router],
  );

  const value = useMemo<SessionContextValue>(
    () => ({ status, user, bootstrap, signIn, signOut, refreshUser, can: (p) => hasPermission(user, p) }),
    [status, user, bootstrap, signIn, signOut, refreshUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside <SessionProvider>");
  return context;
}

/** Convenience hook for permission checks in components. */
export function usePermission(permission: PermissionKey) {
  return useSession().can(permission);
}
