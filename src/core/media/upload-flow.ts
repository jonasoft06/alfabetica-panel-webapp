import type { CreateMediaResult } from "@/contracts/media";
import { uploadToPresignedUrl } from "@/core/http/http-client";

/**
 * The 3-step upload used by every media endpoint in panel-api:
 *   1. `create`  → API registers a PENDING ProjectMedia and returns a presigned URL
 *   2. PUT bytes → straight to Spaces
 *   3. `confirm` → API marks it CONFIRMED (cover/section endpoints also link it)
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
