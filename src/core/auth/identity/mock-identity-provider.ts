import type { IdentityProvider } from "./identity-provider";

/** Profiles understood by the mock server (`src/server/mock/data/users.ts`). */
export const MOCK_PROFILES = [
  { key: "admin", label: "Administrador", description: "Todos los módulos" },
  { key: "editorial", label: "Editorial", description: "Proyectos y Tienda" },
  { key: "readonly", label: "Solo lectura", description: "Sin módulos asignados" },
  { key: "not-invited", label: "No invitado", description: "Prueba el error de acceso" },
] as const;

export type MockProfileKey = (typeof MOCK_PROFILES)[number]["key"];

/**
 * Simulated Google sign-in. Produces a fake ID token that the mock server maps to a user.
 * Never used when NEXT_PUBLIC_AUTH_PROVIDER=firebase.
 */
export class MockIdentityProvider implements IdentityProvider {
  readonly kind = "mock" as const;

  async signIn(options?: { profile?: string }) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return `mock-id-token.${options?.profile ?? "admin"}`;
  }

  async signOut() {}
}
