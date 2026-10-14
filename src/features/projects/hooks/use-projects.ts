"use client";

import { useQuery } from "@tanstack/react-query";
import { projectKeys, projectsApi } from "../api/projects-api";

export function useProjects() {
  return useQuery({ queryKey: projectKeys.list(), queryFn: () => projectsApi.list() });
}

export function useProject(id: string | null) {
  return useQuery({ queryKey: projectKeys.detail(id ?? ""), queryFn: () => projectsApi.detail(id!), enabled: !!id });
}
