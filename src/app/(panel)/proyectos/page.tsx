import { Suspense } from "react";
import type { Metadata } from "next";
import { ProjectsView } from "@/features/projects/components/projects-view";

export const metadata: Metadata = { title: "Proyectos" };

export default function ProyectosPage() {
  return (
    <Suspense>
      <ProjectsView />
    </Suspense>
  );
}
