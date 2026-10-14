"use client";

import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon, SendIcon } from "lucide-react";
import { notify } from "@/shared/components/feedback/notify";
import { Field } from "@/shared/components/form/field";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/shared/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useInviteCollaborator } from "../hooks/use-collaborator-mutations";
import { usePermissionCatalog, useRoles } from "../hooks/use-collaborators";
import {
  CORPORATE_DOMAIN,
  INVITATION_VALID_DAYS,
  NO_ROLE,
  emptyInviteForm,
  inviteFormSchema,
  toInvitePayload,
  type InviteFormValues,
} from "../schemas/collaborator-forms.schema";
import { PermissionSwitchList } from "./permission-switch-list";

export function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()}>
      {open && <InviteContent onClose={onClose} />}
    </Modal>
  );
}

function InviteContent({ onClose }: { onClose: () => void }) {
  const ids = { email: useId(), name: useId(), role: useId() };
  const roles = useRoles();
  const catalog = usePermissionCatalog();
  const invite = useInviteCollaborator();
  const { register, handleSubmit, control, formState } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: emptyInviteForm,
    mode: "onTouched",
  });
  const { errors, isSubmitting } = formState;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await invite.mutateAsync(toInvitePayload(values));
      notify.success("Invitación enviada", `${created.email} · vence en ${INVITATION_VALID_DAYS} días`);
      onClose();
    } catch (error) {
      notify.error(error, "No se pudo enviar la invitación");
    }
  });

  return (
    <ModalContent size="lg">
      <ModalHeader>
        <ModalTitle>Invitar colaborador</ModalTitle>
        <ModalDescription>El registro es solo por invitación. La persona entra con su cuenta de Google corporativa.</ModalDescription>
      </ModalHeader>
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <ModalBody className="space-y-5">
          <Field label="Correo corporativo" htmlFor={ids.email} required error={errors.email?.message} hint={`Debe terminar en @${CORPORATE_DOMAIN}.`}>
            <Input
              id={ids.email}
              type="email"
              inputMode="email"
              autoComplete="off"
              autoFocus
              placeholder={`nombre@${CORPORATE_DOMAIN}`}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nombre" htmlFor={ids.name} optional error={errors.name?.message}>
              <Input id={ids.name} placeholder="Ej. Mariana Ruiz" {...register("name")} />
            </Field>
            <Field label="Rol" htmlFor={ids.role} optional hint="Solo es una etiqueta del equipo; no da acceso por sí mismo.">
              <Controller
                control={control}
                name="roleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={ids.role}>
                      <SelectValue placeholder="Sin rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_ROLE}>Sin rol</SelectItem>
                      {roles.data?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <section aria-labelledby={`${ids.email}-perm`}>
            <h3 id={`${ids.email}-perm`} className="mb-1 font-display text-base font-bold">
              Acceso a módulos
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">Activa solo lo que esta persona necesita. Podrás cambiarlo después.</p>
            <Controller
              control={control}
              name="permissions"
              render={({ field }) => (
                <PermissionSwitchList catalog={catalog.data} loading={catalog.isPending && !catalog.isError} value={field.value} onChange={field.onChange} />
              )}
            />
          </section>

          <p className="flex gap-2 rounded-2xl bg-tan-sun/25 px-4 py-3 text-xs text-eerie/80">
            <InfoIcon className="mt-0.5 size-4 shrink-0 text-tan-sun-dark" />
            <span>
              La invitación vence en {INVITATION_VALID_DAYS} días y el usuario queda como <strong>Invitado</strong> hasta su primer acceso. El contenido del
              correo de invitación aún está pendiente de diseño.
            </span>
          </p>
        </ModalBody>
        <ModalFooter>
          <div className="flex flex-col-reverse gap-2 md:flex-row">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <SendIcon /> {isSubmitting ? "Enviando…" : "Enviar invitación"}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </ModalContent>
  );
}
