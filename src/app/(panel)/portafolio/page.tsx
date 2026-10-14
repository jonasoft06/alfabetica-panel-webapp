import type { Metadata } from "next";
import { PortfolioView } from "@/features/portfolio/components/portfolio-view";

export const metadata: Metadata = { title: "Portafolio" };

export default function PortafolioPage() {
  return <PortfolioView />;
}
