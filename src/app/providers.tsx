"use client";

import { SessionProvider } from "@/core/auth/session-provider";
import { QueryProvider } from "@/core/query/query-provider";
import { Toaster } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        <TooltipProvider delayDuration={250}>
          {children}
          <Toaster />
        </TooltipProvider>
      </SessionProvider>
    </QueryProvider>
  );
}
