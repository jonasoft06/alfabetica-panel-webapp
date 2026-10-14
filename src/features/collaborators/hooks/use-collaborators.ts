"use client";

import { useQuery } from "@tanstack/react-query";
import { collaboratorKeys, collaboratorsApi } from "../api/collaborators-api";

export const useCollaborators = () => useQuery({ queryKey: collaboratorKeys.list(), queryFn: collaboratorsApi.list });
export const useRoles = () => useQuery({ queryKey: collaboratorKeys.roles(), queryFn: collaboratorsApi.roles, staleTime: 10 * 60_000 });
export const usePermissionCatalog = () =>
  useQuery({ queryKey: collaboratorKeys.permissions(), queryFn: collaboratorsApi.permissionCatalog, staleTime: 10 * 60_000 });
