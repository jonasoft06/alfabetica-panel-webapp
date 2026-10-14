/**
 * Browser-side image preparation (panel-api expects WebP uploads with known dimensions).
 * Converts any image to WebP, capping the longest side, and returns the bytes + size.
 */
export interface PreparedImage {
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  previewUrl: string;
}

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export async function prepareImage(file: File, maxSide = 2400, quality = 0.86): Promise<PreparedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error("Formato no permitido. Usa JPG, PNG o WebP.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("La imagen supera los 15 MB.");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen."))), "image/webp", quality),
  );
  return { blob, mimeType: "image/webp", sizeBytes: blob.size, width, height, previewUrl: URL.createObjectURL(blob) };
}
