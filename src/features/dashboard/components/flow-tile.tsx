import Link from "next/link";
import { cn } from "@/shared/lib/cn";

const TONES = {
  tan: { bg: "bg-tan-sun/25", text: "text-tan-sun-dark", bar: "bg-tan-sun" },
  turquoise: { bg: "bg-turquoise/20", text: "text-turquoise-dark", bar: "bg-turquoise" },
  tangerine: { bg: "bg-tangerine/15", text: "text-tangerine", bar: "bg-tangerine" },
  bubblegum: { bg: "bg-bubblegum/25", text: "text-bubblegum-dark", bar: "bg-bubblegum" },
} as const;

/** Colored tile with a big serif number and a weekly mini bar chart. */
export function FlowTile({
  tone,
  value,
  label,
  note,
  weekly,
  href,
}: {
  tone: keyof typeof TONES;
  value: number;
  label: string;
  note: string;
  weekly: number[];
  href: string;
}) {
  const t = TONES[tone];
  const max = Math.max(1, ...weekly);
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-2xl p-4 transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/30 md:p-5",
        t.bg,
      )}
    >
      <div className="flex items-baseline gap-2">
        <span className={cn("font-display text-[32px] leading-none font-bold", t.text)}>{value}</span>
        <span className={cn("text-xs font-semibold", t.text)}>{note}</span>
      </div>
      <span className="mt-2 text-sm font-bold">{label}</span>
      <div className="mt-3 flex h-12 items-end gap-1.5" aria-label={`Actividad de las últimas 8 semanas: ${weekly.join(", ")}`} role="img">
        {weekly.map((n, i) => (
          <span key={i} className={cn("w-[7px] rounded-t-sm", t.bar)} style={{ height: `${Math.max(12, (n / max) * 100)}%`, opacity: n === 0 ? 0.35 : 1 }} />
        ))}
      </div>
    </Link>
  );
}
