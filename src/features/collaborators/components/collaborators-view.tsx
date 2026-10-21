"use client";

import { useMemo, useState } from "react";
import { LockIcon, UserPlusIcon } from "lucide-react";
import type { UserListItem } from "@/contracts/users";
import { usePermission, useSession } from "@/core/auth/session-provider";
import { FilterChips, type FilterOption } from "@/shared/components/data/filter-chips";
import { Pagination, usePagination } from "@/shared/components/data/pagination";
import { SearchInput } from "@/shared/components/data/search-input";
import { SpineCard, SpineCardHeader } from "@/shared/components/data/spine-card";
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { notify } from "@/shared/components/feedback/notify";
import { ReadOnlyBanner } from "@/shared/components/feedback/read-only-banner";
import { usePageSubtitle } from "@/shared/components/layout/page-meta";
import { plural } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { useUpdateCollaboratorStatus } from "../hooks/use-collaborator-mutations";
import { useCollaborators } from "../hooks/use-collaborators";
import { COLLABORATOR_ERROR_MESSAGES } from "../lib/collaborator-errors";
import { deactivationBlock, filterCollaborators, STATUS_LABELS, type StatusFilter } from "../lib/collaborator-filters";
import { CollaboratorList, CollaboratorListSkeleton } from "./collaborator-list";
import { InviteModal } from "./invite-modal";

const STATUS_DOT = { ACTIVE: "bg-turquoise", INVITED: "bg-tangerine", INACTIVE: "bg-eerie/30" } as const;

export function CollaboratorsView() {
  const canManage = usePermission("users");
  const { user: me } = useSession();
  const { data, error, isPending, refetch } = useCollaborators();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  // Deactivating an ACTIVE user and cancelling an invitation are the same call (status INACTIVE).
  const [deactivateTarget, setDeactivateTarget] = useState<{ user: UserListItem; kind: "deactivate" | "cancel" } | null>(null);

  const updateStatus = useUpdateCollaboratorStatus();

  const items = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterCollaborators(items, { query, status }), [items, query, status]);
  const pagination = usePagination(filtered, 10, `${query}|${status}`);
  const count = (s: UserListItem["status"]) => items.filter((u) => u.status === s).length;
  usePageSubtitle(data ? `${plural(items.length, "colaborador")} · ${plural(count("ACTIVE"), "activo")}` : null);

  const filters: FilterOption<StatusFilter>[] = [
    { value: "all", label: "Todos" },
    ...(["ACTIVE", "INVITED", "INACTIVE"] as const).map((s) => ({
      value: s,
      label: `${STATUS_LABELS[s]}s`,
      dot: STATUS_DOT[s],
      count: data ? count(s) : undefined,
    })),
  ];
  const blockOf = (u: UserListItem) => deactivationBlock(u, items, me?.id);
  const displayName = (u: UserListItem) => u.name ?? u.email;

  const confirmDeactivate = () => {
    if (!deactivateTarget) return;
    const { user: target, kind } = deactivateTarget;
    updateStatus.mutate(
      { id: target.id, body: { status: "INACTIVE" } },
      {
        onSuccess: () => {
          setDeactivateTarget(null);
          notify.removed(kind === "cancel" ? "Invitación cancelada" : "Colaborador desactivado", kind === "cancel" ? target.email : displayName(target));
        },
        onError: (e) =>
          notify.error(e, kind === "cancel" ? "No se pudo cancelar la invitación" : "No se pudo desactivar al colaborador", COLLABORATOR_ERROR_MESSAGES),
      },
    );
  };

  const actions = {
    onDeactivate: (user: UserListItem) => setDeactivateTarget({ user, kind: "deactivate" }),
    onCancelInvitation: (user: UserListItem) => setDeactivateTarget({ user, kind: "cancel" }),
    onReactivate: (u: UserListItem) =>
      updateStatus.mutate(
        { id: u.id, body: { status: "ACTIVE" } },
        {
          onSuccess: () => notify.success("Colaborador reactivado", displayName(u)),
          onError: (e) => notify.error(e, "No se pudo reactivar al colaborador", COLLABORATOR_ERROR_MESSAGES),
        },
      ),
  };

  const isEmptyCatalog = data && items.length === 0;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar por nombre, correo o rol…"
          className="lg:w-[330px]"
          aria-label="Buscar colaboradores"
        />
        <span aria-hidden className="hidden h-7 w-px bg-border lg:block" />
        <FilterChips options={filters} value={status} onChange={setStatus} label="Filtrar por estado" className="flex-1" />
        {canManage ? (
          <Button
            size="lg"
            onClick={() => setInviteOpen(true)}
            className="fixed right-4 bottom-[max(env(safe-area-inset-bottom),1rem)] z-30 rounded-2xl shadow-lg md:static md:rounded-xl md:shadow-sm"
          >
            <UserPlusIcon /> Invitar colaborador
          </Button>
        ) : (
          <span className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground lg:self-auto">
            <LockIcon className="size-4" /> Solo lectura
          </span>
        )}
      </div>

      {!canManage && (
        <ReadOnlyBanner moduleLabel="Colaboradores" showLink={false}>
          Puedes ver quién forma parte del equipo y a qué módulos accede, pero invitar o desactivar cuentas requiere el módulo{" "}
          <strong className="font-bold text-eerie">Colaboradores</strong>.
        </ReadOnlyBanner>
      )}

      <SpineCard>
        {!isEmptyCatalog && (
          <SpineCardHeader
            title="Equipo"
            description={
              data ? `${plural(filtered.length, "colaborador")}${filtered.length !== items.length ? ` de ${items.length}` : " en total"}` : "Cargando…"
            }
          />
        )}
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <CollaboratorListSkeleton />
        ) : isEmptyCatalog ? (
          <EmptyState
            title="Aún no hay colaboradores"
            description="Invita a las personas del equipo con su correo corporativo y elige a qué módulos pueden entrar."
            action={
              canManage && (
                <Button onClick={() => setInviteOpen(true)}>
                  <UserPlusIcon /> Invitar al primer colaborador
                </Button>
              )
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nadie coincide"
            description={query ? `No encontramos resultados para “${query}”.` : "No hay colaboradores con este estado."}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                Limpiar búsqueda y filtros
              </Button>
            }
          />
        ) : (
          <>
            <CollaboratorList items={pagination.pageItems} canManage={canManage} actions={actions} deactivationBlock={blockOf} />
            <Pagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              onPageChange={pagination.setPage}
              summary={`Mostrando ${pagination.from}–${pagination.to} de ${plural(pagination.total, "colaborador")}`}
            />
          </>
        )}
      </SpineCard>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title={deactivateTarget?.kind === "cancel" ? "Cancelar invitación" : "Desactivar colaborador"}
        description={
          deactivateTarget &&
          (deactivateTarget.kind === "cancel" ? (
            <>
              <strong className="text-eerie">{deactivateTarget.user.email}</strong> ya no podrá entrar al panel con esta invitación.
            </>
          ) : (
            <>
              <strong className="text-eerie">{displayName(deactivateTarget.user)}</strong> dejará de poder entrar al panel. Podrás reactivar la cuenta cuando
              quieras.
            </>
          ))
        }
        consequencesTitle="Qué pasará"
        consequences={
          deactivateTarget?.kind === "cancel"
            ? ["La invitación deja de ser válida de inmediato", "La persona queda como Inactiva en la lista", "Volver a invitarla aún no está disponible"]
            : ["Se cierra el acceso al panel de inmediato", "Sus permisos se conservan por si lo reactivas", "Su trabajo en proyectos y módulos no se toca"]
        }
        confirmLabel={deactivateTarget?.kind === "cancel" ? "Cancelar invitación" : "Desactivar"}
        pending={updateStatus.isPending}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
