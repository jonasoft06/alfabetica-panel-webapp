"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpsertProductionRequest } from "@/contracts/production";
import { dashboardKeys } from "@/features/dashboard/api/dashboard-api";
import { projectKeys } from "@/features/projects/api/projects-api";
import { productionApi, productionKeys } from "../api/production-api";

export const useProductions = () => useQuery({ queryKey: productionKeys.list(), queryFn: () => productionApi.list() });
export const useProductionStages = () => useQuery({ queryKey: productionKeys.stages(), queryFn: () => productionApi.stages(), staleTime: 5 * 60_000 });
export const useProductionDetail = (projectId: string | null) =>
  useQuery({ queryKey: productionKeys.detail(projectId ?? ""), queryFn: () => productionApi.detail(projectId!), enabled: !!projectId });

function useInvalidateProduction() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: productionKeys.all }),
      client.invalidateQueries({ queryKey: projectKeys.all }),
      client.invalidateQueries({ queryKey: dashboardKeys.all }),
    ]);
}

export function useUpdateProduction() {
  const invalidate = useInvalidateProduction();
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId: string; body: UpsertProductionRequest }) => productionApi.update(projectId, body),
    onSuccess: () => invalidate(),
  });
}

export function useSyncProductions() {
  const invalidate = useInvalidateProduction();
  return useMutation({ mutationFn: () => productionApi.sync(), onSuccess: () => invalidate() });
}
