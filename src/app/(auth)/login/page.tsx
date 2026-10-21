import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginBrandPanel } from "@/features/auth/components/login-brand-panel";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-near-white md:flex-row">
      <LoginBrandPanel />
      <main className="flex flex-1 flex-col px-6 md:items-center md:justify-center md:py-16">
        {/* Mobile: fills the white area and centers the form vertically. Tablet/desktop: centered as before. */}
        <div className="flex w-full flex-1 items-center justify-center py-10 md:flex-none md:py-0">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        {/* On tablet/desktop the credit lives in the brand panel. */}
        <p className="mt-auto pt-2 pb-[max(env(safe-area-inset-bottom),1rem)] text-center text-[11px] text-muted-foreground md:hidden">
          Thanber Software &amp; Consulting
        </p>
      </main>
    </div>
  );
}
