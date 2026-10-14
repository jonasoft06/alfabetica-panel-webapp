import type { UserStatus } from "@/contracts/users";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { STATUS_LABELS } from "../lib/collaborator-filters";

const TONES: Record<UserStatus, BadgeTone> = { ACTIVE: "turquoise", INVITED: "tangerine", INACTIVE: "neutral" };

export function StatusBadge({ status, expired }: { status: UserStatus; expired?: boolean }) {
  return <Badge tone={expired ? "bubblegum" : TONES[status]}>{expired ? "Invitación vencida" : STATUS_LABELS[status]}</Badge>;
}
