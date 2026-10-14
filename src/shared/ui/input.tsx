import * as React from "react";
import { cn } from "@/shared/lib/cn";

const fieldBase =
  "w-full min-w-0 rounded-xl border-[1.5px] border-input bg-card px-3.5 text-[15px] text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/15 md:text-sm";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldBase, "h-11", className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(fieldBase, "min-h-20 resize-y py-2.5", className)} {...props} />;
}

export { Input, Textarea, fieldBase };
