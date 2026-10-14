import type { Metadata } from "next";
import { CollaboratorsView } from "@/features/collaborators/components/collaborators-view";

export const metadata: Metadata = { title: "Colaboradores" };

export default function Page() {
  return <CollaboratorsView />;
}
