"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InviteUserRequest, UpdateUserPermissionsRequest, UpdateUserStatusRequest } from "@/contracts/users";
import { useSession } from "@/core/auth/session-provider";
import { collaboratorKeys, collaboratorsApi } from "../api/collaborators-api";

function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: collaboratorKeys.all });
}

export function useInviteCollaborator() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (body: InviteUserRequest) => collaboratorsApi.invite(body), onSuccess: invalidate });
}

export function useUpdateCollaboratorPermissions() {
  const invalidate = useInvalidate();
  const { user, refreshUser } = useSession();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserPermissionsRequest }) => collaboratorsApi.updatePermissions(id, body),
    // Own permissions changed → reload /users/me so the UI reflects them right away.
    // (In panel-api the access token keeps the old permissions until the next refresh.)
    onSuccess: async (_, { id }) => {
      await invalidate();
      if (id === user?.id) await refreshUser().catch(() => undefined);
    },
  });
}

export function useUpdateCollaboratorStatus() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserStatusRequest }) => collaboratorsApi.updateStatus(id, body),
    onSuccess: invalidate,
  });
}

export function useResendInvitation() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => collaboratorsApi.resendInvitation(id), onSuccess: invalidate });
}
