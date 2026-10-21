import type { UserErrorReason } from "@/contracts/users";
import { ApiError, describeError } from "@/core/http/api-error";
import { CORPORATE_DOMAIN } from "../schemas/collaborator-forms.schema";

/** Spanish messages for the `reason` of users-endpoint errors (those bodies carry no message). */
export const COLLABORATOR_ERROR_MESSAGES: Record<UserErrorReason, string> = {
  USER_NOT_LINKED: "Esta persona nunca entró al panel, así que su cuenta no se puede activar a mano.",
  USER_SELF_DEACTIVATION: "No puedes desactivarte a ti mismo.",
  LAST_USERS_ADMIN: "Es la única persona activa con acceso a Colaboradores; dale ese acceso a alguien más antes.",
  CONCURRENT_UPDATE: "Alguien más cambió a esta persona al mismo tiempo. Actualiza la lista e intenta de nuevo.",
  UNKNOWN_PERMISSIONS: "Alguno de los módulos elegidos ya no existe. Recarga la página e intenta de nuevo.",
};

export type InviteError = { field: "email" | "roleId"; message: string } | { field: null; message: string };

/**
 * Where a failed POST /users/invitations should be shown. Those errors carry no `code`, so they are told
 * apart by status and by which field they are about:
 * - 409 on invite can only be the email (it already exists);
 * - 400 about the role (unknown roleId / "Role not found") goes under the role select;
 * - any other 400 about the email is the domain check (the form already validates the email format);
 * - anything else (coded errors such as UNKNOWN_PERMISSIONS, network, 5xx) is a banner in the dialog.
 */
export function classifyInviteError(error: unknown): InviteError {
  if (error instanceof ApiError && !error.code) {
    if (error.isConflict) return { field: "email", message: "Ya existe un colaborador con este correo." };
    if (error.status === 400) {
      const raw = error.body?.message;
      const text = (Array.isArray(raw) ? raw.join(" ") : (raw ?? "")).toLowerCase();
      if (/role/.test(text)) return { field: "roleId", message: "Selecciona un rol válido." };
      if (/email|domain/.test(text)) return { field: "email", message: `Solo se permiten correos @${CORPORATE_DOMAIN}.` };
    }
  }
  return { field: null, message: describeError(error, COLLABORATOR_ERROR_MESSAGES) };
}
