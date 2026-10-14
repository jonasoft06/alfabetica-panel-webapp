"use client";

import { ChevronDownIcon, LogOutIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/core/auth/session-provider";
import { Avatar } from "@/shared/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, signOut } = useSession();
  if (!user) return null;
  const displayName = user.name?.split(" ")[0] ?? user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl p-1 pr-1.5 text-left outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/30">
        <Avatar name={user.name ?? user.email} seed={user.id} className="bg-grape" />
        {!compact && (
          <>
            <span className="hidden leading-tight lg:block">
              <span className="block text-sm font-bold">{displayName}</span>
              <span className="block text-[11px] text-muted-foreground">{user.role?.name ?? "Sin rol"}</span>
            </span>
            <ChevronDownIcon className="hidden size-4 text-muted-foreground lg:block" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block font-bold">{user.name ?? "Sin nombre"}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/colaboradores">
            <UsersIcon /> Colaboradores
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
          <LogOutIcon /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
