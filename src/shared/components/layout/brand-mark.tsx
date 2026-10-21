import Image from "next/image";
import { cn } from "@/shared/lib/cn";

/**
 * Alfabética logo (`public/brand/logo.png`) on a near-white tile, so the teal mark reads on any
 * background (the turquoise login panel as well as the light panel chrome). Size it with `className`.
 */
export function BrandLogo({ className, loading = "lazy" }: { className?: string; loading?: "lazy" | "eager" }) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-near-white p-1.5 shadow-sm", className)}>
      <Image src="/brand/logo.png" alt="Alfabética" width={512} height={512} loading={loading} className="size-full object-contain" />
    </span>
  );
}
