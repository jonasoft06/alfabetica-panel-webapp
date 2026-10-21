import { cn } from "@/shared/lib/cn";

/** Decorative shapes of the login brand panel. Painted with `currentColor`; always aria-hidden. */

/**
 * Soft cloud: four rounded lobes of different sizes over a flat-ish base. The pieces share one fill,
 * so the overlaps read as a single shape.
 */
export function Cloud({ className }: { className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 240 150" fill="currentColor" className={cn("h-auto", className)}>
      <circle cx="62" cy="96" r="36" />
      <circle cx="108" cy="64" r="50" />
      <circle cx="164" cy="74" r="42" />
      <circle cx="204" cy="104" r="30" />
      <rect x="26" y="96" width="208" height="46" rx="23" />
    </svg>
  );
}

/** Points of a star polygon centered in a 100×100 box: `spikes` sharp tips, valleys at `innerRatio` of the radius. */
function starPoints(spikes: number, innerRatio: number) {
  const outer = 50;
  const inner = outer * innerRatio;
  return Array.from({ length: spikes * 2 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    return `${(50 + radius * Math.cos(angle)).toFixed(2)},${(50 + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

/** Seal/badge starburst: straight, sharp spikes. Computed once per shape at module load. */
const STARBURST_16 = starPoints(16, 0.74);

export function Starburst({ className }: { className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 100 100" fill="currentColor" className={cn("h-auto", className)}>
      <polygon points={STARBURST_16} />
    </svg>
  );
}
