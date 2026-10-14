"use client";

import { useQuery } from "@tanstack/react-query";
import { publicationApi, publicationKeys } from "../api/publication-api";

export function usePublications() {
  return useQuery({ queryKey: publicationKeys.list(), queryFn: () => publicationApi.list() });
}

export function usePublication(projectId: string | null) {
  return useQuery({ queryKey: publicationKeys.detail(projectId ?? ""), queryFn: () => publicationApi.detail(projectId!), enabled: !!projectId });
}

export function usePublicationMedia(projectId: string | null) {
  return useQuery({ queryKey: publicationKeys.media(projectId ?? ""), queryFn: () => publicationApi.media(projectId!), enabled: !!projectId });
}

export function usePublicationSections(projectId: string | null) {
  return useQuery({ queryKey: publicationKeys.sections(projectId ?? ""), queryFn: () => publicationApi.sections(projectId!), enabled: !!projectId });
}
