/**
 * Abstraction over "who are you" (Google via Firebase in production).
 * panel-api only needs the resulting ID token, sent as `Authorization: Bearer <idToken>`
 * to POST /auth/login. Swapping providers never touches the session or the UI.
 */
export interface IdentityProvider {
  readonly kind: "mock" | "firebase";
  /** Loads everything `signIn` needs ahead of the click, so the popup opens within the user gesture. */
  prepare(): Promise<void>;
  /** Opens the sign-in flow and resolves with an ID token for panel-api. */
  signIn(options?: { profile?: string }): Promise<string>;
  /** Ends the identity-provider session (Firebase signOut). */
  signOut(): Promise<void>;
}

export class IdentityCancelledError extends Error {
  constructor() {
    super("Sign-in cancelled");
    this.name = "IdentityCancelledError";
  }
}
