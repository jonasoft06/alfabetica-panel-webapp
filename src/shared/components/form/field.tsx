import { cn } from "@/shared/lib/cn";
import { Label } from "@/shared/ui/label";

/** Label + control + hint/error, with the "TÍTULO *" / "AÑO (opcional)" convention from the mockup. */
export function Field({
  label,
  htmlFor,
  required,
  optional,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
  error?: string;
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
      {error ? (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
