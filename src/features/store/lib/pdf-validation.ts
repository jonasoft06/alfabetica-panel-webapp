export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const PDF_MIME = "application/pdf";

/** Client-side guard for section PDFs (application/pdf only, max 50 MB). Returns an error message or null. */
export function validatePdf(file: File): string | null {
  const isPdf = file.type === PDF_MIME || (file.type === "" && file.name.toLowerCase().endsWith(".pdf"));
  if (!isPdf) return "Solo se permiten archivos PDF.";
  if (file.size <= 0) return "El archivo está vacío.";
  if (file.size > MAX_PDF_BYTES) return "El PDF supera los 50 MB.";
  return null;
}
