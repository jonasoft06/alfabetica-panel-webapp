"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProjectRequest, UpdateProjectRequest } from "@/contracts/projects";
import type { PublicationType } from "@/contracts/publication";
import { dashboardKeys } from "@/features/dashboard/api/dashboard-api";
import { portfolioKeys } from "@/features/portfolio/api/portfolio-api";
import { productionKeys } from "@/features/production/api/production-api";
import { publicationKeys } from "@/features/store/api/publication-api";
import type { RelationKey } from "@/shared/lib/relations";
import { projectKeys, projectsApi } from "../api/projects-api";

/** Invalidates every cache that shows project data (lists in all modules + dashboard). */
function useInvalidateProjects() {
  const client = useQueryClient();
  return (projectId?: string) =>
    Promise.all([
      client.invalidateQueries({ queryKey: projectKeys.lists() }),
      projectId ? client.invalidateQueries({ queryKey: projectKeys.detail(projectId) }) : null,
      client.invalidateQueries({ queryKey: portfolioKeys.all }),
      client.invalidateQueries({ queryKey: publicationKeys.all }),
      client.invalidateQueries({ queryKey: productionKeys.all }),
      client.invalidateQueries({ queryKey: dashboardKeys.all }),
    ]);
}

export function useCreateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    /** Production is not part of CreateProjectDto, so it is attached right after creation. */
    mutationFn: async ({ body, withProduction }: { body: CreateProjectRequest; withProduction: boolean }) => {
      const project = await projectsApi.create(body);
      if (withProduction) await projectsApi.addProduction(project.id);
      return project;
    },
    onSuccess: (project) => invalidate(project.id),
  });
}

export function useUpdateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateProjectRequest }) => projectsApi.update(id, body),
    onSuccess: (project) => invalidate(project.id),
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({ mutationFn: (id: string) => projectsApi.remove(id), onSuccess: () => invalidate() });
}

export function useAddRelation() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ id, relation, publicationType = "SALE" }: { id: string; relation: RelationKey; publicationType?: PublicationType }) => {
      if (relation === "portfolio") return projectsApi.addPortfolio(id);
      if (relation === "publication")
        return projectsApi.addPublication(id, { type: publicationType, ...(publicationType === "SALE" ? { price: 0, quantity: 0 } : {}) });
      return projectsApi.addProduction(id);
    },
    onSuccess: (_, { id }) => invalidate(id),
  });
}

export function useRemoveRelation() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ id, relation }: { id: string; relation: RelationKey }) =>
      relation === "portfolio"
        ? projectsApi.removePortfolio(id)
        : relation === "publication"
          ? projectsApi.removePublication(id)
          : projectsApi.removeProduction(id),
    onSuccess: (_, { id }) => invalidate(id),
  });
}
