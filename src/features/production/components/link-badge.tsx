import { LinkIcon, UnlinkIcon } from "lucide-react";
import { Badge } from "@/shared/ui/badge";

export function ClickupLink({ listId }: { listId: string | null }) {
  return listId ? (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="turquoise">
        <LinkIcon className="size-3" /> Enlazado
      </Badge>
      <code className="font-mono text-xs text-muted-foreground">#{listId}</code>
    </div>
  ) : (
    <Badge tone="neutral">
      <UnlinkIcon className="size-3" /> Sin enlace
    </Badge>
  );
}
