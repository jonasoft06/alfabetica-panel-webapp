"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import type { PermissionKey } from "@/contracts/auth";
import type { UserListItem } from "@/contracts/users";
import { notify } from "@/shared/components/feedback/notify";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/shared/ui/modal";
import { useUpdateCollaboratorPermissions } from "../hooks/use-collaborator-mutations";
import { usePermissionCatalog } from "../hooks/use-collaborators";
import { usersPermissionLock } from "../lib/collaborator-filters";
import { permissionsFormSchema, type PermissionsFormValues } from "../schemas/collaborator-forms.schema";
import { PermissionSwitchList } from "./permission-switch-list";

export interface PermissionsModalProps {
  user: UserListItem | null;
  allUsers: UserListItem[];
  currentUserId: string | undefined;
  onClose: () => void;
}

export function PermissionsModal(props: PermissionsModalProps) {
  return (
    <Modal open={!!props.user} onOpenChange={(open) => !open && props.onClose()}>
      {props.user && <PermissionsContent key={props.user.id} {...props} user={props.user} />}
    </Modal>
  );
}

function PermissionsContent({ user, allUsers, currentUserId, onClose }: PermissionsModalProps & { user: UserListItem }) {
  const catalog = usePermissionCatalog();
  const update = useUpdateCollaboratorPermissions();
  const { control, handleSubmit, formState } = useForm<PermissionsFormValues>({
    resolver: zodResolver(permissionsFormSchema),
    defaultValues: { permissions: user.permissions },
  });
  const { isDirty, isSubmitting } = formState;
  const lock = usersPermissionLock(user, allUsers, currentUserId);
  const locked: Partial<Record<PermissionKey, string>> = lock ? { users: lock } : {};

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync({ id: user.id, body: values });
      notify.success("Permisos actualizados", user.name ?? user.email);
      onClose();
    } catch (error) {
      notify.error(error, "No se pudieron guardar los permisos");
    }
  });

  return (
    <ModalContent size="lg">
      <ModalHeader>
        <ModalTitle>Permisos de acceso</ModalTitle>
        <ModalDescription>Elige a qué módulos puede entrar esta persona.</ModalDescription>
      </ModalHeader>
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <ModalBody className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl bg-crema/60 px-4 py-3">
            <Avatar name={user.name ?? user.email} seed={user.id} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.name ?? "Sin nombre"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
                {user.role && ` · ${user.role.name}`}
              </p>
            </div>
          </div>
          <Controller
            control={control}
            name="permissions"
            render={({ field }) => (
              <PermissionSwitchList
                catalog={catalog.data}
                loading={catalog.isPending && !catalog.isError}
                value={field.value}
                onChange={field.onChange}
                locked={locked}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">El rol es solo una etiqueta del equipo: el acceso depende únicamente de los módulos activados aquí.</p>
        </ModalBody>
        <ModalFooter>
          <div className="flex flex-col-reverse gap-2 md:flex-row">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              <CheckIcon /> {isSubmitting ? "Guardando…" : "Guardar permisos"}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </ModalContent>
  );
}
