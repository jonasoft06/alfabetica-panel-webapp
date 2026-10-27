export const MAX_PDF_BYTES = 25 * 1024 * 1024;
export const PDF_MIME = "application/pdf";

/** Client-side guard for section PDFs (application/pdf only, max 25 MB). Returns an error message or null. */
export function validatePdf(file: File): string | null {
  const isPdf = file.type === PDF_MIME || (file.type === "" && file.name.toLowerCase().endsWith(".pdf"));
  if (!isPdf || file.size > MAX_PDF_BYTES) return "Solo se aceptan archivos PDF de hasta 25 MB";
  if (file.size <= 0) return "El archivo está vacío.";
  return null;
}
