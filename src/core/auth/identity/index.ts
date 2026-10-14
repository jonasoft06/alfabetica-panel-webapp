import { clientEnv } from "@/config/env.client";
import { FirebaseIdentityProvider } from "./firebase-identity-provider";
import type { IdentityProvider } from "./identity-provider";
import { MockIdentityProvider } from "./mock-identity-provider";

let instance: IdentityProvider | null = null;

/** Returns the configured identity provider (NEXT_PUBLIC_AUTH_PROVIDER). */
export function getIdentityProvider(): IdentityProvider {
  instance ??= clientEnv.authProvider === "firebase" ? new FirebaseIdentityProvider() : new MockIdentityProvider();
  return instance;
}

export { IdentityCancelledError } from "./identity-provider";
export type { IdentityProvider } from "./identity-provider";
export { MOCK_PROFILES, type MockProfileKey } from "./mock-identity-provider";
