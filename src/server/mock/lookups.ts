import "server-only";
import { db } from "./db";
import { notFound } from "./http";

/** Mirrors `findActiveOrFail` (project-existence.util.ts): 404 when missing or soft-deleted. */
export function findActiveProject(projectId: string) {
  const project = db().projects.find((p) => p.id === projectId && !p.deletedAt);
  if (!project) throw notFound(`Project ${projectId} not found`);
  return project;
}

export function touchProject(projectId: string) {
  const project = db().projects.find((p) => p.id === projectId);
  if (project) project.updatedAt = new Date().toISOString();
}
