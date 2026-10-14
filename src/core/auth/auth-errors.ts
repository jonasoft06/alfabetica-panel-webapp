import type { AuthErrorCode } from "@/contracts/auth";
import { ApiError } from "@/core/http/api-error";

const MESSAGES: Record<AuthErrorCode, string> = {
  EMAIL_NOT_VERIFIED: "Tu correo de Google no está verificado.",
  USER_NOT_INVITED: "Este correo no ha sido invitado al panel. Pide acceso a un administrador.",
  INVITATION_EXPIRED: "Tu invitación expiró. Pide a un administrador que te invite de nuevo.",
  USER_INACTIVE: "Tu cuenta está desactivada. Contacta a un administrador.",
  ACCOUNT_CONFLICT: "Este correo ya está vinculado a otra cuenta de Google.",
};

export function describeLoginError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && error.code in MESSAGES) return MESSAGES[error.code as AuthErrorCode];
    if (error.isForbidden) return "Tu cuenta no tiene acceso al panel.";
    if (error.isUnauthorized) return "No pudimos validar tu sesión de Google. Intenta de nuevo.";
    if (error.status === 0) return "No hay conexión con el servidor.";
  }
  return "No pudimos iniciar sesión. Intenta de nuevo.";
}
