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
import { useResendInvitation, useUpdateCollaboratorStatus } from "../hooks/use-collaborator-mutations";
import { useCollaborators } from "../hooks/use-collaborators";
import { deactivationBlock, filterCollaborators, STATUS_LABELS, type StatusFilter } from "../lib/collaborator-filters";
import { CollaboratorList, CollaboratorListSkeleton } from "./collaborator-list";
import { InviteModal } from "./invite-modal";
import { PermissionsModal } from "./permissions-modal";

const STATUS_DOT = { ACTIVE: "bg-turquoise", INVITED: "bg-tangerine", INACTIVE: "bg-eerie/30" } as const;

export function CollaboratorsView() {
  const canManage = usePermission("users");
  const { user: me } = useSession();
  const { data, error, isPending, refetch } = useCollaborators();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [permissionsTarget, setPermissionsTarget] = useState<UserListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserListItem | null>(null);

  const updateStatus = useUpdateCollaboratorStatus();
  const resend = useResendInvitation();

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
    const target = deactivateTarget;
    updateStatus.mutate(
      { id: target.id, body: { status: "INACTIVE" } },
      {
        onSuccess: () => {
          setDeactivateTarget(null);
          notify.removed("Colaborador desactivado", displayName(target));
        },
        onError: (e) => notify.error(e, "No se pudo desactivar al colaborador"),
      },
    );
  };

  const actions = {
    onEditPermissions: setPermissionsTarget,
    onDeactivate: setDeactivateTarget,
    onReactivate: (u: UserListItem) =>
      updateStatus.mutate(
        { id: u.id, body: { status: "ACTIVE" } },
        { onSuccess: () => notify.success("Colaborador reactivado", displayName(u)), onError: (e) => notify.error(e, "No se pudo reactivar al colaborador") },
      ),
    onResend: (u: UserListItem) =>
      resend.mutate(u.id, {
        onSuccess: () => notify.success("Invitación reenviada", `${u.email} · vence en 7 días`),
        onError: (e) => notify.error(e, "No se pudo reenviar la invitación"),
      }),
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
            className="fixed right-4 bottom-[88px] z-30 rounded-2xl shadow-lg md:static md:rounded-xl md:shadow-sm"
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
          Puedes ver quién forma parte del equipo y a qué módulos accede, pero invitar, cambiar permisos o desactivar cuentas requiere el módulo{" "}
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
      <PermissionsModal user={permissionsTarget} allUsers={items} currentUserId={me?.id} onClose={() => setPermissionsTarget(null)} />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Desactivar colaborador"
        description={
          deactivateTarget && (
            <>
              <strong className="text-eerie">{displayName(deactivateTarget)}</strong> dejará de poder entrar al panel. Podrás reactivar la cuenta cuando
              quieras.
            </>
          )
        }
        consequencesTitle="Qué pasará"
        consequences={[
          "Se cierra el acceso al panel de inmediato",
          "Sus permisos se conservan por si lo reactivas",
          "Su trabajo en proyectos y módulos no se toca",
        ]}
        confirmLabel="Desactivar"
        pending={updateStatus.isPending}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
