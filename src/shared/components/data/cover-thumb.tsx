import { ImageOffIcon } from "lucide-react";
import type { MediaItem } from "@/contracts/media";
import { cn } from "@/shared/lib/cn";

/**
 * Book-cover thumbnail (3:4) used across modules.
 * Without a cover it shows either the title's initial on a tinted tile (`emptyTint`) or a dashed empty block.
 */
export function CoverThumb({
  cover,
  title,
  className,
  emptyTint,
}: {
  cover: Pick<MediaItem, "url"> | null | undefined;
  title: string;
  className?: string;
  /** Tailwind classes for the initial-letter tile (e.g. "bg-tangerine/15 text-tangerine"). */
  emptyTint?: string;
}) {
  return (
    <span
      className={cn(
        "relative block aspect-[3/4] shrink-0 overflow-hidden rounded-md",
        cover ? "bg-muted shadow-sm" : emptyTint ? cn("shadow-sm", emptyTint) : "border border-dashed border-eerie/25 bg-muted/60",
        className,
      )}
    >
      {cover ? (
        // Remote/CDN or mock URL of unknown host: a plain <img> avoids next/image domain allow-listing.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover.url} alt={`Portada de ${title}`} loading="lazy" className="size-full object-cover" />
      ) : emptyTint ? (
        <span aria-hidden className="flex size-full items-center justify-center font-display text-base font-extrabold">
          {title.trim().charAt(0).toUpperCase() || "?"}
        </span>
      ) : (
        <span className="flex size-full items-center justify-center text-eerie/30" role="img" aria-label="Sin portada">
          <ImageOffIcon className="size-1/3 min-w-3.5" />
        </span>
      )}
      <span aria-hidden className="absolute inset-y-0 left-0 w-[6%] bg-eerie/15" />
    </span>
  );
}
