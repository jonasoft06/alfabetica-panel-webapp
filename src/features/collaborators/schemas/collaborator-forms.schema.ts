import { z } from "zod";
import { PERMISSION_KEYS } from "@/contracts/auth";
import type { InviteUserRequest } from "@/contracts/users";

export const CORPORATE_DOMAIN = "alfabetica.com.mx";
export const NO_ROLE = "none";
export const INVITATION_VALID_DAYS = 7;

const permissionKey = z.enum(PERMISSION_KEYS);

/** Mirrors the proposed InviteUserDto. */
export const inviteFormSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Escribe el correo de la persona.")
    .email("Escribe un correo válido.")
    .refine((v) => v.endsWith(`@${CORPORATE_DOMAIN}`), `Solo se admiten correos @${CORPORATE_DOMAIN}.`),
  name: z.string().trim().max(120, "Máximo 120 caracteres."),
  roleId: z.string(),
  permissions: z.array(permissionKey),
});
export type InviteFormValues = z.infer<typeof inviteFormSchema>;
export const emptyInviteForm: InviteFormValues = { email: "", name: "", roleId: NO_ROLE, permissions: [] };

export function toInvitePayload(values: InviteFormValues): InviteUserRequest {
  return {
    email: values.email,
    name: values.name || undefined,
    roleId: values.roleId === NO_ROLE ? undefined : values.roleId,
    permissions: values.permissions,
  };
}

/** Mirrors the proposed UpdateUserPermissionsDto. */
export const permissionsFormSchema = z.object({ permissions: z.array(permissionKey) });
export type PermissionsFormValues = z.infer<typeof permissionsFormSchema>;
