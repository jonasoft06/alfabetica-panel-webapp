import { CircleAlertIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Label } from "@/shared/ui/label";

/**
 * Label + control + hint/error, with the "TÍTULO *" / "AÑO (opcional)" convention from the mockup.
 * The error replaces the hint unless `keepHint` (for rules the user should keep seeing, e.g. the email domain).
 */
export function Field({
  label,
  htmlFor,
  required,
  optional,
  hint,
  error,
  keepHint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
  error?: string;
  keepHint?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive">*</span>}
        {optional && <span className="font-medium tracking-normal normal-case text-muted-foreground">(opcional)</span>}
      </Label>
      {children}
      {hint && (!error || keepHint) && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-semibold text-destructive">
          <CircleAlertIcon aria-hidden className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
