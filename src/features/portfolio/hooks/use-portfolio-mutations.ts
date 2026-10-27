"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/features/dashboard/api/dashboard-api";
import { projectKeys } from "@/features/projects/api/projects-api";
import { prepareCoverImage, prepareImage } from "@/core/media/prepare-image";
import { assertImageUploadSize, runUploadFlow } from "@/core/media/upload-flow";
import { portfolioApi, portfolioKeys } from "../api/portfolio-api";
import { changedOrders } from "../lib/portfolio-filters";
import { PORTFOLIO_COVER_SIZE, type PortfolioListItem } from "@/contracts/portfolio";

/** Refreshes everything that shows portfolio state (this module, Proyectos lists, Resumen). */
function useInvalidate() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: portfolioKeys.all }),
      client.invalidateQueries({ queryKey: projectKeys.lists() }),
      client.invalidateQueries({ queryKey: dashboardKeys.all }),
    ]);
}

export function usePublish() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (projectId: string) => portfolioApi.publish(projectId),
    onSettled: () => invalidate(),
  });
}

export function useUnpublish() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (projectId: string) => portfolioApi.unpublish(projectId),
    onSettled: () => invalidate(),
  });
}

export interface BatchResult {
  done: number;
  failed: number;
  /** True when the server answered 409 PORTFOLIO_LIMIT_REACHED and the run stopped. */
  limitReached: boolean;
}

/** Runs publish/unpublish sequentially so the server-side limit is evaluated in order. */
export function useBatchVisibility() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      items,
      publish,
      isLimitError,
    }: {
      items: PortfolioListItem[];
      publish: boolean;
      isLimitError: (e: unknown) => boolean;
    }): Promise<BatchResult> => {
      const result: BatchResult = { done: 0, failed: 0, limitReached: false };
      for (const item of items) {
        try {
          await (publish ? portfolioApi.publish(item.projectId) : portfolioApi.unpublish(item.projectId));
          result.done++;
        } catch (error) {
          if (isLimitError(error)) {
            result.limitReached = true;
            break;
          }
          result.failed++;
        }
      }
      return result;
    },
    onSettled: () => invalidate(),
  });
}

/** Persists a new order: one PUT /projects/:id/portfolio per item whose position changed. */
export function useSaveOrder() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ original, orderedIds }: { original: PortfolioListItem[]; orderedIds: string[] }) =>
      Promise.all(changedOrders(original, orderedIds).map(({ item, displayOrder }) => portfolioApi.update(item.projectId, { displayOrder }))),
    onSettled: () => invalidate(),
  });
}

/**
 * Cover: prepare (WebP, cropped to the exact size the API requires) → POST cover → PUT bytes → PATCH confirm.
 * panel-api answers 409 COVER_ALREADY_EXISTS while a cover is set, so a replacement deletes the current
 * one first (after the new image is ready, to keep the window without cover short).
 */
export function useUploadCover() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ projectId, file, alt, replaceMediaId }: { projectId: string; file: File; alt?: string; replaceMediaId?: string }) => {
      const image = await prepareCoverImage(file, PORTFOLIO_COVER_SIZE);
      try {
        // Before deleting the current cover: a too-large result must not leave the title without one.
        assertImageUploadSize(image.blob);
        if (replaceMediaId) await portfolioApi.deleteMedia(replaceMediaId);
        return await runUploadFlow({
          blob: image.blob,
          mimeType: image.mimeType,
          create: () =>
            portfolioApi.createCover(projectId, { mimeType: image.mimeType, sizeBytes: image.sizeBytes, width: image.width, height: image.height, alt }),
          confirm: (mediaId) => portfolioApi.confirmCover(projectId, { mediaId }),
        });
      } finally {
        URL.revokeObjectURL(image.previewUrl);
      }
    },
    onSettled: () => invalidate(),
  });
}

/** Gallery image: prepare → POST media → PUT bytes → PATCH /media/:id/confirm. */
export function useUploadGalleryImage() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ projectId, file, alt }: { projectId: string; file: File; alt?: string }) => {
      const image = await prepareImage(file);
      try {
        assertImageUploadSize(image.blob);
        return await runUploadFlow({
          blob: image.blob,
          mimeType: image.mimeType,
          create: () =>
            portfolioApi.createGalleryImage(projectId, { mimeType: image.mimeType, sizeBytes: image.sizeBytes, width: image.width, height: image.height, alt }),
          confirm: (mediaId) => portfolioApi.confirmMedia(mediaId),
        });
      } finally {
        URL.revokeObjectURL(image.previewUrl);
      }
    },
    onSettled: () => invalidate(),
  });
}

export function useDeleteMedia() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (mediaId: string) => portfolioApi.deleteMedia(mediaId), onSettled: () => invalidate() });
}
