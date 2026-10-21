"use client";

import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, CircleAlertIcon, CircleCheckIcon, CopyIcon, InfoIcon, SendIcon } from "lucide-react";
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
  emptyInviteForm,
  inviteFormSchema,
  toInvitePayload,
  type InviteFormValues,
} from "../schemas/collaborator-forms.schema";
import { classifyInviteError } from "../lib/collaborator-errors";
import { PermissionSwitchList } from "./permission-switch-list";

export function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()}>
      {open && <InviteContent onClose={onClose} />}
    </Modal>
  );
}

function InviteContent({ onClose }: { onClose: () => void }) {
  const [invited, setInvited] = useState<string | null>(null);
  if (invited) return <InviteCreated who={invited} onClose={onClose} />;
  return <InviteForm onClose={onClose} onInvited={setInvited} />;
}

function InviteForm({ onClose, onInvited }: { onClose: () => void; onInvited: (who: string) => void }) {
  const ids = { email: useId(), name: useId(), role: useId() };
  const roles = useRoles();
  const catalog = usePermissionCatalog();
  const invite = useInviteCollaborator();
  const [failure, setFailure] = useState<string | null>(null);
  const { register, handleSubmit, control, setError, formState } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: emptyInviteForm,
    mode: "onTouched",
  });
  const { errors, isSubmitting } = formState;

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    try {
      const created = await invite.mutateAsync(toInvitePayload(values));
      onInvited(created.name ?? created.email);
    } catch (error) {
      // The dialog stays open: field errors go under their field, the rest in a banner.
      const { field, message } = classifyInviteError(error);
      if (field) setError(field, { message }, { shouldFocus: true });
      else setFailure(message);
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
          {failure && (
            <p role="alert" className="flex gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm font-semibold text-destructive">
              <CircleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>No se pudo crear la invitación. {failure}</span>
            </p>
          )}
          <Field
            label="Correo corporativo"
            htmlFor={ids.email}
            required
            error={errors.email?.message}
            hint={`Debe terminar en @${CORPORATE_DOMAIN}.`}
            keepHint
          >
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
            <Field
              label="Rol"
              htmlFor={ids.role}
              required
              error={errors.roleId?.message}
              hint="Solo es una etiqueta del equipo; no da acceso por sí mismo."
            >
              <Controller
                control={control}
                name="roleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={roles.isPending}>
                    <SelectTrigger id={ids.role} aria-invalid={!!errors.roleId} onBlur={field.onBlur}>
                      <SelectValue placeholder={roles.isPending ? "Cargando roles…" : "Elige un rol"} />
                    </SelectTrigger>
                    <SelectContent>
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
              La invitación vence en {INVITATION_VALID_DAYS} días y el usuario queda como <strong>Invitado</strong> hasta su primer acceso. El panel no
              envía ningún correo: tendrás que avisarle tú.
            </span>
          </p>
        </ModalBody>
        <ModalFooter>
          <div className="flex flex-col-reverse gap-2 md:flex-row">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <SendIcon /> {isSubmitting ? "Creando…" : "Crear invitación"}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </ModalContent>
  );
}

/**
 * The API does not send any email: the confirmation tells the inviter to let the person know, with the
 * panel's own origin (localhost in dev, the production domain once deployed) and a copy button.
 */
function InviteCreated({ who, onClose }: { who: string; onClose: () => void }) {
  const [panelUrl] = useState(() => window.location.origin);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (copy !== "copied") return;
    const timer = setTimeout(() => setCopy("idle"), 2000);
    return () => clearTimeout(timer);
  }, [copy]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(panelUrl);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  };

  return (
    <ModalContent size="sm">
      <ModalHeader>
        <ModalTitle className="flex items-center gap-2">
          <CircleCheckIcon aria-hidden className="size-5 text-turquoise-dark" /> Invitación creada
        </ModalTitle>
        <ModalDescription className="leading-relaxed">
          Avísale a <strong className="text-eerie">{who}</strong> que ya puede entrar con su cuenta de Google en{" "}
          <strong className="whitespace-nowrap text-eerie">{panelUrl}</strong>. La invitación vence en {INVITATION_VALID_DAYS} días.
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        <div className="flex items-center gap-2 rounded-xl bg-muted py-1.5 pr-1.5 pl-3.5">
          <code className="min-w-0 flex-1 truncate font-mono text-xs font-bold">{panelUrl}</code>
          <Button type="button" size="sm" variant="outline" onClick={copyLink} aria-live="polite">
            {copy === "copied" ? <CheckIcon /> : <CopyIcon />}
            {copy === "copied" ? "Copiado" : "Copiar enlace"}
          </Button>
        </div>
        {copy === "failed" && (
          <p role="alert" className="mt-2 text-xs font-semibold text-destructive">
            No se pudo copiar. Selecciona el enlace y cópialo a mano.
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" onClick={onClose}>
          Listo
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}
