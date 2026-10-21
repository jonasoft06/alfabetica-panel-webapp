import type { UserErrorReason } from "@/contracts/users";
import { ApiError, type ErrorMessages } from "@/core/http/api-error";

/** Spanish messages for the `reason` of users-endpoint errors (those bodies carry no message). */
export const COLLABORATOR_ERROR_MESSAGES: Record<UserErrorReason, string> = {
  USER_NOT_LINKED: "Esta persona nunca entró al panel, así que su cuenta no se puede activar a mano.",
  USER_SELF_DEACTIVATION: "No puedes desactivarte a ti mismo.",
  LAST_USERS_ADMIN: "Es la única persona activa con acceso a Colaboradores; dale ese acceso a alguien más antes.",
  CONCURRENT_UPDATE: "Alguien más cambió a esta persona al mismo tiempo. Actualiza la lista e intenta de nuevo.",
  UNKNOWN_PERMISSIONS: "Alguno de los módulos elegidos ya no existe. Recarga la página e intenta de nuevo.",
};

/**
 * POST /users/invitations answers plain Nest errors without a code: 400 for a domain outside the
 * allowed one (or an unknown role) and 409 when the email already exists.
 */
export function inviteErrorMessages(error: unknown): ErrorMessages | string {
  if (error instanceof ApiError && !error.code) {
    if (error.isConflict) return "Ya existe un colaborador con ese correo.";
    if (error.status === 400 && /domain/i.test(error.message)) return "Solo se pueden invitar correos del dominio corporativo de Alfabética.";
    if (error.status === 400 && /role/i.test(error.message)) return "El rol elegido ya no existe. Recarga la página y elige otro.";
  }
  return COLLABORATOR_ERROR_MESSAGES;
}
