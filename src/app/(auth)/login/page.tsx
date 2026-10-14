import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginBrandPanel } from "@/features/auth/components/login-brand-panel";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-near-white md:flex-row">
      <LoginBrandPanel />
      <main className="flex flex-1 items-start justify-center px-6 py-10 md:items-center md:py-16">
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
