import { z } from "zod";
import { PERMISSION_KEYS } from "@/contracts/auth";
import type { InviteUserRequest } from "@/contracts/users";

export const CORPORATE_DOMAIN = "alfabetica.com.mx";
export const INVITATION_VALID_DAYS = 7;

const permissionKey = z.enum(PERMISSION_KEYS);

/** Mirrors InviteUserDto (the role is required by the panel even though the API accepts none). */
export const inviteFormSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Escribe el correo de la persona.")
    .email("Escribe un correo válido.")
    .refine((v) => v.endsWith(`@${CORPORATE_DOMAIN}`), `Solo se admiten correos @${CORPORATE_DOMAIN}.`),
  name: z.string().trim().max(120, "Máximo 120 caracteres."),
  roleId: z.string().min(1, "Elige el rol de la persona."),
  permissions: z.array(permissionKey),
});
export type InviteFormValues = z.infer<typeof inviteFormSchema>;
export const emptyInviteForm: InviteFormValues = { email: "", name: "", roleId: "", permissions: [] };

export function toInvitePayload(values: InviteFormValues): InviteUserRequest {
  return {
    email: values.email,
    name: values.name || undefined,
    roleId: values.roleId,
    permissions: values.permissions,
  };
}

/** Mirrors the proposed UpdateUserPermissionsDto (TODO(api): PUT /users/:id/permissions). */
export const permissionsFormSchema = z.object({ permissions: z.array(permissionKey) });
export type PermissionsFormValues = z.infer<typeof permissionsFormSchema>;
