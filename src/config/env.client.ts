import { z } from "zod";

/**
 * Public (browser) configuration. Only NEXT_PUBLIC_* variables live here; they are
 * inlined at build time, so each one must be referenced literally below.
 */
const schema = z.object({
  appUrl: z.url().default("http://localhost:3000"),
  /** `mock` signs in with a simulated identity; `firebase` uses Google via Firebase Auth. */
  authProvider: z.enum(["mock", "firebase"]).default("mock"),
  /** Google Workspace domain hint for the Google account picker (e.g. alfabetica.com.mx). */
  allowedEmailDomain: z.string().optional(),
  firebase: z.object({
    apiKey: z.string().optional(),
    authDomain: z.string().optional(),
    projectId: z.string().optional(),
    appId: z.string().optional(),
  }),
  features: z.object({
    /** When false, /tienda shows the "Próximamente" screen instead of the module. */
    store: z.boolean().default(false),
  }),
});

const flag = (value: string | undefined) => value === "true";

export const clientEnv = schema.parse({
  appUrl: process.env.NEXT_PUBLIC_APP_URL || undefined,
  authProvider: process.env.NEXT_PUBLIC_AUTH_PROVIDER || undefined,
  allowedEmailDomain: process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || undefined,
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || undefined,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || undefined,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || undefined,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || undefined,
  },
  features: { store: flag(process.env.NEXT_PUBLIC_FEATURE_STORE) },
});
