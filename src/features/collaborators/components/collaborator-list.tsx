"use client";

import { MailCheckIcon, MailXIcon, MoreHorizontalIcon, ShieldCheckIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import type { UserListItem } from "@/contracts/users";
import { formatRelative } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { Skeleton } from "@/shared/ui/skeleton";
import { isInvitationExpired } from "../lib/collaborator-filters";
import { ModuleChips } from "./module-chips";
import { StatusBadge } from "./status-badge";

export interface CollaboratorRowActions {
  onDeactivate: (user: UserListItem) => void;
  onCancelInvitation: (user: UserListItem) => void;
  onReactivate: (user: UserListItem) => void;
}

/** Tag for actions whose panel-api endpoint does not exist yet (PUT /users/:id/permissions, resend). */
function ComingSoon() {
  return <span className="ml-auto pl-3 text-[10px] font-extrabold tracking-wide text-muted-foreground uppercase">Próximamente</span>;
}

const GRID = "md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1.9fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto] md:items-center md:gap-5";

function lastAccess(user: UserListItem) {
  if (user.lastLogin) return formatRelative(user.lastLogin);
  return user.status === "INVITED" ? "Aún no entra" : "—";
}

function RowMenu({ user, actions, deactivateBlock }: { user: UserListItem; actions: CollaboratorRowActions; deactivateBlock: string | null }) {
  const name = user.name ?? user.email;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${name}`}>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={`Acciones para ${name}`}>
        <DropdownMenuItem disabled>
          <ShieldCheckIcon /> Editar permisos
          <ComingSoon />
        </DropdownMenuItem>
        {user.status === "INVITED" && (
          <DropdownMenuItem disabled>
            <MailCheckIcon /> Reenviar invitación
            <ComingSoon />
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {user.status === "INVITED" ? (
          <DropdownMenuItem variant="destructive" onSelect={() => actions.onCancelInvitation(user)}>
            <MailXIcon /> Cancelar invitación
          </DropdownMenuItem>
        ) : user.status === "INACTIVE" ? (
          // Only accounts that already signed in once (linked to Google) can be activated by hand.
          <DropdownMenuItem disabled={!user.lastLogin} onSelect={() => actions.onReactivate(user)}>
            <UserCheckIcon /> Reactivar
            {!user.lastLogin && <span className="ml-auto pl-3 text-[10px] font-semibold text-muted-foreground">Nunca entró al panel</span>}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" disabled={!!deactivateBlock} title={deactivateBlock ?? undefined} onSelect={() => actions.onDeactivate(user)}>
            <UserXIcon /> Desactivar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CollaboratorList({
  items,
  canManage,
  actions,
  deactivationBlock,
}: {
  items: UserListItem[];
  canManage: boolean;
  actions: CollaboratorRowActions;
  deactivationBlock: (user: UserListItem) => string | null;
}) {
  return (
    <div role="table" aria-label="Listado de colaboradores">
      <div role="row" className={`hidden border-b px-6 py-3 ${GRID}`}>
        {["Colaborador", "Rol", "Módulos", "Estado", "Último acceso"].map((h) => (
          <span key={h} role="columnheader" className="eyebrow">
            {h}
          </span>
        ))}
        <span role="columnheader" className="eyebrow w-[30px] text-right">
          <span className="sr-only">Acciones</span>
        </span>
      </div>
      <ul role="rowgroup" className="divide-y">
        {items.map((user) => {
          const expired = isInvitationExpired(user);
          return (
            <li
              key={user.id}
              role="row"
              className={`relative px-5 py-4 transition-colors hover:bg-crema/60 md:px-6 ${GRID} ${user.status === "INACTIVE" ? "opacity-70" : ""}`}
            >
              <div role="cell" className="flex min-w-0 items-center gap-3 pr-10 md:pr-0">
                <Avatar name={user.name ?? user.email} seed={user.id} />
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] leading-snug font-bold">{user.name ?? "Sin nombre"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div role="cell" className="mt-3 text-[13px] md:mt-0">
                <span className="md:hidden eyebrow mr-2">Rol</span>
                {user.role?.name ?? <span className="text-muted-foreground">Sin rol</span>}
              </div>
              <div role="cell" className="mt-3 md:mt-0">
                <ModuleChips permissions={user.permissions} />
              </div>
              <div role="cell" className="mt-3 md:mt-0">
                <StatusBadge status={user.status} expired={expired} />
              </div>
              <div role="cell" className="mt-2 text-xs text-muted-foreground md:mt-0 md:text-[13px]">
                <span className="md:hidden">Último acceso · </span>
                {lastAccess(user)}
              </div>
              <div role="cell" className="absolute top-4 right-4 flex justify-end md:static md:w-[30px]">
                {canManage && <RowMenu user={user} actions={actions} deactivateBlock={deactivationBlock(user)} />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CollaboratorListSkeleton() {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Cargando colaboradores">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className={`px-5 py-5 md:px-6 ${GRID}`}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <Skeleton className="mt-3 h-4 w-16 md:mt-0" />
          <Skeleton className="mt-3 h-5 w-40 md:mt-0" />
          <Skeleton className="mt-3 h-5 w-16 md:mt-0" />
          <Skeleton className="mt-2 h-3 w-20 md:mt-0" />
          <div className="hidden w-[30px] md:block" />
        </li>
      ))}
    </ul>
  );
}
