import type { CreateMediaResult } from "@/contracts/media";
import { UserFacingError } from "@/core/http/api-error";
import { uploadToPresignedUrl } from "@/core/http/http-client";

/** panel-api signs image uploads up to 5 MB; checked on the converted WebP, before asking for a URL. */
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const IMAGE_TOO_LARGE_MESSAGE = "La imagen es demasiado grande incluso después de optimizarla. Prueba con una de menor resolución.";

export function assertImageUploadSize(blob: Blob) {
  if (blob.size > MAX_IMAGE_UPLOAD_BYTES) throw new UserFacingError(IMAGE_TOO_LARGE_MESSAGE);
}

/**
 * The 3-step upload used by every media endpoint in panel-api:
 *   1. `create`  → API registers a PENDING ProjectMedia and returns a presigned URL (signs Content-Type
 *                  and Content-Length, expires in 300 s — so it is requested right before the PUT)
 *   2. PUT bytes → straight to Spaces, with the declared mimeType and the very blob whose size was declared
 *   3. `confirm` → API checks the object and marks it CONFIRMED (cover/section endpoints also link it);
 *                  only reached after a 2xx PUT. A 422 UPLOAD_OBJECT_* means the mediaId is dead: retry from step 1.
 */
export async function runUploadFlow<TConfirm>(params: {
  blob: Blob;
  mimeType: string;
  create: () => Promise<CreateMediaResult>;
  confirm: (mediaId: string) => Promise<TConfirm>;
}): Promise<TConfirm> {
  const created = await params.create();
  await uploadToPresignedUrl(created.uploadUrl, params.blob, params.mimeType);
  return params.confirm(created.mediaId);
}
