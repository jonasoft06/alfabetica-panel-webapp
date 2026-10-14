import { cn } from "@/shared/lib/cn";
import { initials } from "@/shared/lib/format";

const PALETTE = ["bg-grape", "bg-tangerine", "bg-turquoise", "bg-tan-sun", "bg-bubblegum-dark", "bg-turquoise-dark"];

/** Deterministic color per name so a collaborator keeps the same avatar color. */
function colorFor(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

type AvatarProps = { name: string | null | undefined; seed?: string; className?: string };

function Avatar({ name, seed, className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-near-white",
        colorFor(seed ?? name ?? "?"),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export { Avatar };
