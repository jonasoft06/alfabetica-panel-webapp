import Link from "next/link";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { Button } from "@/shared/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <EmptyState
        title="Esta página no está en el catálogo"
        description="La dirección no existe o fue movida."
        action={
          <Button asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        }
      />
    </main>
  );
}
