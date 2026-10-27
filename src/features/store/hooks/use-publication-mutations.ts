"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateSectionRequest, PublicationSection, UpdateSectionRequest, UpsertPublicationRequest } from "@/contracts/publication";
import { UserFacingError } from "@/core/http/api-error";
import { assertImageUploadSize, runUploadFlow } from "@/core/media/upload-flow";
import { prepareImage } from "@/core/media/prepare-image";
import { projectKeys } from "@/features/projects/api/projects-api";
import { publicationApi, publicationKeys } from "../api/publication-api";

/** Refreshes everything that shows this publication (list, detail, media, sections, project lists). */
function useInvalidate(projectId: string) {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: publicationKeys.all }),
      client.invalidateQueries({ queryKey: projectKeys.lists() }),
      client.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
    ]);
}

export function useUpdatePublication(projectId: string) {
  const client = useQueryClient();
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: (body: UpsertPublicationRequest) => publicationApi.update(projectId, body),
    onSuccess: (detail) => {
      client.setQueryData(publicationKeys.detail(projectId), detail);
      return invalidate();
    },
  });
}

/** Cover upload: prepare (WebP) → POST cover → PUT bytes → PATCH cover/confirm. */
export function useUploadCover(projectId: string) {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: async (file: File) => {
      const image = await prepareImage(file);
      try {
        assertImageUploadSize(image.blob);
        return await runUploadFlow({
          blob: image.blob,
          mimeType: image.mimeType,
          create: () =>
            publicationApi.createCover(projectId, { mimeType: image.mimeType, sizeBytes: image.sizeBytes, width: image.width, height: image.height }),
          confirm: (mediaId) => publicationApi.confirmCover(projectId, { mediaId }),
        });
      } finally {
        URL.revokeObjectURL(image.previewUrl);
      }
    },
    onSuccess: () => invalidate(),
  });
}

export function useUploadGalleryImages(projectId: string) {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    /** Uploads sequentially (keeps displayOrder stable); resolves with the number of images that failed (and how many were too large). */
    mutationFn: async (files: File[]) => {
      let failed = 0;
      let tooLarge = 0;
      for (const file of files) {
        try {
          const image = await prepareImage(file);
          try {
            assertImageUploadSize(image.blob);
            await runUploadFlow({
              blob: image.blob,
              mimeType: image.mimeType,
              create: () =>
                publicationApi.createGalleryImage(projectId, {
                  mimeType: image.mimeType,
                  sizeBytes: image.sizeBytes,
                  width: image.width,
                  height: image.height,
                }),
              confirm: (mediaId) => publicationApi.confirmMedia(mediaId),
            });
          } finally {
            URL.revokeObjectURL(image.previewUrl);
          }
        } catch (error) {
          failed++;
          if (error instanceof UserFacingError) tooLarge++;
        }
      }
      return { total: files.length, failed, tooLarge };
    },
    onSettled: () => invalidate(),
  });
}

export function useDeleteMedia(projectId: string) {
  const invalidate = useInvalidate(projectId);
  return useMutation({ mutationFn: (mediaId: string) => publicationApi.deleteMedia(mediaId), onSuccess: () => invalidate() });
}

export function useCreateSection(projectId: string) {
  const invalidate = useInvalidate(projectId);
  return useMutation({ mutationFn: (body: CreateSectionRequest) => publicationApi.createSection(projectId, body), onSuccess: () => invalidate() });
}

export function useUpdateSection(projectId: string) {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: ({ sectionId, body }: { sectionId: string; body: UpdateSectionRequest }) => publicationApi.updateSection(projectId, sectionId, body),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteSection(projectId: string) {
  const invalidate = useInvalidate(projectId);
  return useMutation({ mutationFn: (sectionId: string) => publicationApi.deleteSection(projectId, sectionId), onSuccess: () => invalidate() });
}

/** Optimistic reorder: the list reflects the drop immediately and rolls back if the API refuses. */
export function useReorderSections(projectId: string) {
  const client = useQueryClient();
  const key = publicationKeys.sections(projectId);
  return useMutation({
    mutationFn: (sectionIds: string[]) => publicationApi.reorderSections(projectId, { sectionIds }),
    onMutate: async (sectionIds) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<PublicationSection[]>(key);
      if (previous) {
        const byId = new Map(previous.map((s) => [s.id, s]));
        client.setQueryData(
          key,
          sectionIds.flatMap((id, i) => (byId.has(id) ? [{ ...byId.get(id)!, sortOrder: i + 1 }] : [])),
        );
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}

export function useUploadSectionPdf(projectId: string) {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: ({ sectionId, file }: { sectionId: string; file: File }) =>
      runUploadFlow({
        blob: file,
        mimeType: "application/pdf",
        create: () => publicationApi.createSectionPdf(projectId, sectionId, { originalName: file.name, mimeType: "application/pdf", sizeBytes: file.size }),
        confirm: (mediaId) => publicationApi.confirmSectionPdf(projectId, sectionId, { mediaId }),
      }),
    onSuccess: () => invalidate(),
  });
}
