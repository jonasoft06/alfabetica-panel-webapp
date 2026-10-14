"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircleIcon } from "lucide-react";
import { clientEnv } from "@/config/env.client";
import { describeLoginError } from "@/core/auth/auth-errors";
import { IdentityCancelledError, MOCK_PROFILES, type MockProfileKey } from "@/core/auth/identity";
import { useSession } from "@/core/auth/session-provider";
import { cn } from "@/shared/lib/cn";
import { GoogleIcon } from "./google-icon";

/** Only internal, same-site paths are accepted as post-login destinations (prevents open redirects). */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/resumen";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(params.get("expired") ? "Tu sesión expiró. Vuelve a ingresar." : null);
  const [profile, setProfile] = useState<MockProfileKey>("admin");
  const isMock = clientEnv.authProvider === "mock";

  const handleSignIn = async () => {
    setPending(true);
    setError(null);
    try {
      await signIn({ profile });
      router.replace(safeNext(params.get("next")));
    } catch (err) {
      if (!(err instanceof IdentityCancelledError)) setError(describeLoginError(err));
      setPending(false);
    }
  };

  return (
    <div className="w-full max-w-[380px]">
      <h2 className="text-[28px] leading-tight font-extrabold">Bienvenido de vuelta</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">Ingresa con tu cuenta de Google Workspace de Alfabética para continuar.</p>

      <button
        type="button"
        onClick={handleSignIn}
        disabled={pending}
        className="mt-8 flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border-[1.5px] border-border bg-card text-[15px] font-bold shadow-sm transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-turquoise/30 focus-visible:outline-none disabled:opacity-70"
      >
        {pending ? <LoaderCircleIcon className="size-5 animate-spin" /> : <GoogleIcon className="size-5" />}
        {pending ? "Validando tu cuenta…" : "Continuar con Google"}
      </button>

      <div aria-live="assertive" className="min-h-6">
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-tangerine/10 px-3.5 py-2.5 text-[13px] font-semibold text-tangerine">
            {error}
          </p>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">Solo para el equipo de Alfabética</p>

      {isMock && (
        <fieldset className="mt-10 rounded-2xl border border-dashed border-eerie/20 p-4">
          <legend className="eyebrow px-1.5">Modo simulado · perfil</legend>
          <div className="grid grid-cols-2 gap-2">
            {MOCK_PROFILES.map((option) => (
              <label
                key={option.key}
                className={cn(
                  "cursor-pointer rounded-xl border-[1.5px] px-3 py-2 text-left transition-colors",
                  profile === option.key ? "border-turquoise bg-turquoise/10" : "border-border hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="mock-profile"
                  value={option.key}
                  checked={profile === option.key}
                  onChange={() => setProfile(option.key)}
                  className="sr-only"
                />
                <span className="block text-xs font-bold">{option.label}</span>
                <span className="block text-[11px] text-muted-foreground">{option.description}</span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Visible solo con NEXT_PUBLIC_AUTH_PROVIDER=mock. Simula la cuenta de Google con la que entras.
          </p>
        </fieldset>
      )}
    </div>
  );
}
