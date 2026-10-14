"use client";

import { useQuery } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import type { ProjectDetail } from "@/contracts/projects";
import { portfolioApi, portfolioKeys } from "@/features/portfolio/api/portfolio-api";
import { productionApi, productionKeys } from "@/features/production/api/production-api";
import { publicationApi, publicationKeys } from "@/features/store/api/publication-api";
import { CoverThumb } from "@/shared/components/data/cover-thumb";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { cn } from "@/shared/lib/cn";
import { formatCurrency, formatDate, formatRelative } from "@/shared/lib/format";
import { RELATIONS, type RelationKey } from "@/shared/lib/relations";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/shared/ui/modal";
import { Skeleton } from "@/shared/ui/skeleton";
import { useProject } from "../hooks/use-projects";

function RelationBlock({ relation, badge, rows }: { relation: RelationKey; badge?: React.ReactNode; rows: [string, React.ReactNode][] }) {
  return (
    <div className="relative rounded-2xl bg-muted px-4 py-3.5">
      <span aria-hidden className={cn("absolute top-3 bottom-3 left-0 w-1 rounded-r-sm", RELATIONS[relation].spine)} />
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">{RELATIONS[relation].label}</p>
        {badge}
      </div>
      <dl className="mt-2 space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-[13px]">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PortfolioBlock({ project }: { project: ProjectDetail }) {
  const portfolio = project.portfolio!;
  return (
    <RelationBlock
      relation="portfolio"
      badge={<Badge tone={portfolio.isPublished ? "turquoise" : "neutral"}>{portfolio.isPublished ? "Publicado en la web" : "No publicado"}</Badge>}
      rows={[
        ["Portada", portfolio.coverMediaId ? "Confirmada" : "Sin portada"],
        ["Orden en la web", portfolio.displayOrder ?? "—"],
      ]}
    />
  );
}

function PublicationBlock({ projectId }: { projectId: string }) {
  const detail = useQuery({ queryKey: publicationKeys.detail(projectId), queryFn: () => publicationApi.detail(projectId) });
  const sections = useQuery({ queryKey: publicationKeys.sections(projectId), queryFn: () => publicationApi.sections(projectId) });
  const p = detail.data;
  if (detail.isError) return <RelationBlock relation="publication" rows={[["Detalle", "No disponible por ahora"]]} />;
  if (!p) return <Skeleton className="h-24 rounded-2xl" />;
  const rows: [string, React.ReactNode][] =
    p.type === "SALE"
      ? [
          ["Precio", formatCurrency(p.price, p.currency ?? "MXN")],
          ["Existencias", `${p.quantity ?? 0} pzas · ${sections.data?.length ?? 0} secciones`],
        ]
      : p.type === "LINK"
        ? [
            [
              "Enlace",
              p.externalUrl ? (
                <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" className="text-turquoise-dark hover:underline">
                  Abrir ↗
                </a>
              ) : (
                "—"
              ),
            ],
          ]
        : [["Secciones DOI", sections.data?.length ?? 0]];
  return (
    <RelationBlock
      relation="publication"
      badge={<Badge tone="tangerine">{p.type}</Badge>}
      rows={[...rows, ["Estado", p.isPublished ? "Publicado" : "Sin publicar"]]}
    />
  );
}

function ProductionBlock({ project }: { project: ProjectDetail }) {
  const { data, isError } = useQuery({ queryKey: productionKeys.detail(project.id), queryFn: () => productionApi.detail(project.id), retry: false });
  const linked = !!data?.clickupListId;
  return (
    <RelationBlock
      relation="production"
      badge={data && <Badge tone={linked ? "turquoise" : "neutral"}>{linked ? "Enlazado" : "Sin enlace"}</Badge>}
      rows={[
        [
          "Código al público",
          <span key="c" className="font-mono text-xs">
            {project.production!.publicCode}
          </span>,
        ],
        ["Lista en ClickUp", data ? linked ? <span className="font-mono text-xs">#{data.clickupListId}</span> : "—" : isError ? "—" : "…"],
      ]}
    />
  );
}

function ProjectCover({ project }: { project: ProjectDetail }) {
  const { data } = useQuery({
    queryKey: portfolioKeys.media(project.id),
    queryFn: () => portfolioApi.media(project.id),
    enabled: !!project.portfolio?.coverMediaId,
  });
  return <CoverThumb cover={data?.cover} title={project.title} emptyTint="bg-turquoise-dark text-near-white" className="w-16 rounded-[6px] shadow-md" />;
}

export function ProjectDetailModal({
  projectId,
  onClose,
  canWrite,
  hiddenRelations,
  onEdit,
  onDelete,
}: {
  projectId: string | null;
  onClose: () => void;
  canWrite: boolean;
  hiddenRelations: (projectId: string) => RelationKey[];
  onEdit: (id: string) => void;
  onDelete: (project: { id: string; title: string }) => void;
}) {
  const { data: project, error, isPending, refetch } = useProject(projectId);
  const hidden = projectId ? hiddenRelations(projectId) : [];
  const show = (key: RelationKey) => project?.[key] && !hidden.includes(key);

  return (
    <Modal open={!!projectId} onOpenChange={(open) => !open && onClose()}>
      <ModalContent placement="side">
        {error ? (
          <>
            <ModalTitle className="sr-only">Proyecto</ModalTitle>
            <ErrorState error={error} onRetry={() => refetch()} />
          </>
        ) : isPending || !project ? (
          <ModalBody className="space-y-4">
            <ModalTitle className="sr-only">Cargando proyecto</ModalTitle>
            <Skeleton className="h-24" />
            <Skeleton className="h-40" />
          </ModalBody>
        ) : (
          <>
            <ModalHeader className="flex gap-4">
              <ProjectCover project={project} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {project.portfolio?.isPublished && <Badge tone="turquoise">Publicado</Badge>}
                  <span className="text-xs text-muted-foreground">Actualizado {formatRelative(project.updatedAt).toLowerCase()}</span>
                </div>
                <ModalTitle className="mt-1.5 leading-tight">{project.title}</ModalTitle>
                <ModalDescription className="font-bold text-turquoise-dark">{project.subtitle ?? "Sin subtítulo"}</ModalDescription>
              </div>
            </ModalHeader>
            <ModalBody className="space-y-6">
              <section>
                <h3 className="eyebrow">Descripción</h3>
                <p className="mt-1.5 text-sm leading-relaxed">{project.description ?? <span className="text-muted-foreground">Sin descripción.</span>}</p>
              </section>
              <dl className="grid grid-cols-3 gap-4">
                {[
                  ["Cliente", project.client ?? "—"],
                  ["Año", project.issueYear ?? "—"],
                  ["Creado", formatDate(project.createdAt)],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="eyebrow">{label}</dt>
                    <dd className="mt-1 text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
              <section>
                <h3 className="eyebrow">Tags</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.tags.length ? (
                    project.tags.map((tag) => (
                      <Badge key={tag} tone="turquoise" size="md">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin tags.</span>
                  )}
                </div>
              </section>
              <section>
                <h3 className="eyebrow">Relaciones activas</h3>
                <div className="mt-2.5 space-y-2.5">
                  {show("portfolio") && <PortfolioBlock project={project} />}
                  {show("publication") && <PublicationBlock projectId={project.id} />}
                  {show("production") && <ProductionBlock project={project} />}
                  {!show("portfolio") && !show("publication") && !show("production") && (
                    <p className="text-sm text-muted-foreground">Este proyecto aún no tiene relaciones.</p>
                  )}
                </div>
              </section>
            </ModalBody>
            <ModalFooter className="md:justify-between">
              {canWrite ? (
                <button type="button" onClick={() => onDelete(project)} className="self-center text-sm font-bold text-destructive hover:underline md:self-auto">
                  Eliminar proyecto
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-col-reverse gap-2 md:flex-row">
                <Button variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
                {canWrite && (
                  <Button onClick={() => onEdit(project.id)}>
                    <PencilIcon /> Editar
                  </Button>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
