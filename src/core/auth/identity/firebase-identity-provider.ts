import { clientEnv } from "@/config/env.client";
import type { IdentityProvider } from "./identity-provider";

/**
 * Google sign-in through Firebase Auth — NOT CONNECTED YET (future stage).
 *
 * Where the credentials live: `.env.local` →
 *   NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID
 * (web-app config of the same Firebase project used by panel-api's Admin SDK).
 *
 * To connect it:
 *   1. `pnpm add firebase`
 *   2. Implement signIn with `signInWithPopup(auth, provider)` using a GoogleAuthProvider
 *      with `setCustomParameters({ hd: clientEnv.allowedEmailDomain, prompt: "select_account" })`,
 *      then return `await result.user.getIdToken()`. Map `auth/popup-closed-by-user` to IdentityCancelledError.
 *   3. Implement signOut with `signOut(auth)`.
 *   4. Set NEXT_PUBLIC_AUTH_PROVIDER=firebase and API_MODE_AUTH=real.
 *   5. Add the panel domain (and localhost) to Firebase Auth → Authorized domains.
 */
export class FirebaseIdentityProvider implements IdentityProvider {
  readonly kind = "firebase" as const;

  async signIn(): Promise<string> {
    void clientEnv.firebase;
    throw new Error("Firebase identity provider is not connected yet. See firebase-identity-provider.ts.");
  }

  async signOut() {}
}
