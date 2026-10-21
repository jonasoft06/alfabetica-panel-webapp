"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductionDetail, UpsertProductionRequest } from "@/contracts/production";
import { dashboardKeys } from "@/features/dashboard/api/dashboard-api";
import { projectKeys } from "@/features/projects/api/projects-api";
import { productionApi, productionKeys } from "../api/production-api";

export const useProductions = () => useQuery({ queryKey: productionKeys.list(), queryFn: () => productionApi.list() });
export const useProductionPhases = () => useQuery({ queryKey: productionKeys.phases(), queryFn: () => productionApi.phases(), staleTime: 10 * 60_000 });
export const useProductionDetail = (projectId: string | null) =>
  useQuery({ queryKey: productionKeys.detail(projectId ?? ""), queryFn: () => productionApi.detail(projectId!), enabled: !!projectId });

/** Both mutations answer the updated production: seed the detail cache, then refresh the lists that show it. */
function useApplyProduction() {
  const client = useQueryClient();
  return (production: ProductionDetail) => {
    client.setQueryData(productionKeys.detail(production.projectId), production);
    return Promise.all([
      client.invalidateQueries({ queryKey: productionKeys.list() }),
      client.invalidateQueries({ queryKey: projectKeys.all }),
      client.invalidateQueries({ queryKey: dashboardKeys.all }),
    ]);
  };
}

export function useUpdateProduction() {
  const apply = useApplyProduction();
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId: string; body: UpsertProductionRequest }) => productionApi.update(projectId, body),
    onSuccess: apply,
  });
}

export function useSyncProduction() {
  const apply = useApplyProduction();
  return useMutation({ mutationFn: (projectId: string) => productionApi.sync(projectId), onSuccess: apply });
}
