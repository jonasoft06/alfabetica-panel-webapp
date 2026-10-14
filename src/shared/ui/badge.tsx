import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const badgeVariants = cva("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] leading-none font-extrabold whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "bg-eerie/[0.08] text-eerie/60",
      turquoise: "bg-turquoise/15 text-turquoise-dark",
      tangerine: "bg-tangerine/15 text-tangerine",
      bubblegum: "bg-bubblegum/25 text-bubblegum-dark",
      tan: "bg-tan-sun/30 text-tan-sun-dark",
      grape: "bg-grape/15 text-grape",
      dark: "bg-eerie text-near-white",
    },
    size: { sm: "", md: "px-2.5 py-1.5 text-[11px]" },
  },
  defaultVariants: { tone: "neutral", size: "sm" },
});

type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
export type BadgeTone = NonNullable<BadgeProps["tone"]>;
