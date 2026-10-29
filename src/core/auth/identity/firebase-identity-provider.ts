import type { FirebaseApp } from "firebase/app";
import type { Auth, AuthProvider, signInWithPopup as SignInWithPopup } from "firebase/auth";
import { clientEnv } from "@/config/env.client";
import { IdentityCancelledError, type IdentityProvider } from "./identity-provider";

/**
 * Google sign-in through Firebase Auth. panel-api's FirebaseAuthGuard verifies the resulting ID token.
 *
 * Credentials live in `.env.local` (web-app config of the same Firebase project used by panel-api's Admin SDK):
 *   NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID
 * The panel domain (and localhost) must be listed in Firebase Auth → Authorized domains.
 *
 * The SDK is imported lazily so mock mode never downloads it. `prepare()` loads it ahead of the click:
 * Safari (iOS) only allows the popup while the user gesture is active, so `signInWithPopup` must be
 * the first call inside the click handler — no imports or initialization awaited before it.
 */
const CANCELLED_CODES = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]);

interface PopupSession {
  auth: Auth;
  provider: AuthProvider;
  signInWithPopup: typeof SignInWithPopup;
}

async function getAuth(): Promise<Auth> {
  const { apiKey, authDomain, projectId, appId } = clientEnv.firebase;
  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error("Falta la configuración de Firebase (NEXT_PUBLIC_FIREBASE_*). Revisa .env.local.");
  }
  const [{ getApp, getApps, initializeApp }, { getAuth: authFor }] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp({ apiKey, authDomain, projectId, appId });
  // getAuth() uses browserPopupRedirectResolver, which Firebase initializes proactively on Safari/iOS/mobile.
  return authFor(app);
}

async function loadPopupSession(): Promise<PopupSession> {
  const auth = await getAuth();
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account", ...(clientEnv.allowedEmailDomain ? { hd: clientEnv.allowedEmailDomain } : {}) });
  // Waits for persistence and the popup resolver (iframe) to finish initializing.
  await auth.authStateReady();
  return { auth, provider, signInWithPopup };
}

export class FirebaseIdentityProvider implements IdentityProvider {
  readonly kind = "firebase" as const;
  private session: PopupSession | null = null;
  private preparing: Promise<PopupSession> | null = null;

  prepare(): Promise<void> {
    return this.load().then(() => undefined);
  }

  async signIn(): Promise<string> {
    // Fallback for a click before prepare() settled: the popup may be blocked on Safari, but desktop still works.
    const { auth, provider, signInWithPopup } = this.session ?? (await this.load());
    try {
      const result = await signInWithPopup(auth, provider);
      return await result.user.getIdToken();
    } catch (error) {
      if (CANCELLED_CODES.has((error as { code?: string }).code ?? "")) throw new IdentityCancelledError();
      throw error;
    }
  }

  async signOut() {
    const { signOut } = await import("firebase/auth");
    await signOut(await getAuth());
  }

  /** Memoized; a failed load is forgotten so the next attempt retries. */
  private load(): Promise<PopupSession> {
    this.preparing ??= loadPopupSession().then(
      (session) => (this.session = session),
      (error: unknown) => {
        this.preparing = null;
        throw error;
      },
    );
    return this.preparing;
  }
}
