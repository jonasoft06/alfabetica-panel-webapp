import type { CurrentUser, LoginResponse } from "@/contracts/auth";
import { endpoints } from "@/core/http/endpoints";
import { http } from "@/core/http/http-client";

export const authApi = {
  /** POST /auth/login — the identity token goes in the Authorization header (FirebaseAuthGuard). */
  login: (idToken: string) =>
    http.post<LoginResponse>(endpoints.auth.login(), undefined, {
      anonymous: true,
      headers: { Authorization: `Bearer ${idToken}` },
    }),
  logout: () => http.post<void>(endpoints.auth.logout(), undefined, { anonymous: true }),
  me: () => http.get<CurrentUser>(endpoints.users.me()),
};
