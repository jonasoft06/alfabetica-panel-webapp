"use client";

import { useState } from "react";
import type { PublicationListItem } from "@/contracts/publication";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { ReadOnlyBanner } from "@/shared/components/feedback/read-only-banner";
import { cn } from "@/shared/lib/cn";
import { formatRelative } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from "@/shared/ui/modal";
import { Skeleton } from "@/shared/ui/skeleton";
import { usePublication } from "../hooks/use-publications";
import { TYPE_LABELS, TYPE_TONES } from "../lib/publication-types";
import { PublicationDetailsForm } from "./publication-details-form";
import { PublicationMediaPanel } from "./publication-media-panel";
import { PublicationSectionsPanel } from "./publication-sections-panel";

type Tab = "details" | "media" | "sections";

export interface PublicationModalProps {
  item: PublicationListItem | null;
  canWrite: boolean;
  onClose: () => void;
}

export function PublicationModal(props: PublicationModalProps) {
  return (
    <Modal open={!!props.item} onOpenChange={(open) => !open && props.onClose()}>
      {props.item && <PublicationModalContent key={props.item.projectId} {...props} item={props.item} />}
    </Modal>
  );
}

function PublicationModalContent({ item, canWrite, onClose }: PublicationModalProps & { item: PublicationListItem }) {
  const [tab, setTab] = useState<Tab>("details");
  const { data: detail, error, isPending, refetch } = usePublication(item.projectId);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "details", label: "Ficha" },
    { id: "media", label: "Portada y galería" },
    { id: "sections", label: "Secciones", count: item.sectionsCount },
  ];
  // Panels stay mounted (hidden) so unsaved form edits survive a tab switch.
  const panel = (id: Tab) => cn("min-h-0 flex-1 flex-col", tab === id ? "flex" : "hidden");

  return (
    <ModalContent placement="side" size="lg">
      <ModalHeader className="pb-0">
        <div className="flex items-center gap-2">
          <Badge tone={TYPE_TONES[detail?.type ?? item.type]}>{TYPE_LABELS[detail?.type ?? item.type]}</Badge>
          <Badge tone={(detail?.isPublished ?? item.isPublished) ? "turquoise" : "neutral"}>
            {(detail?.isPublished ?? item.isPublished) ? "Publicado" : "No publicado"}
          </Badge>
        </div>
        <ModalTitle className="mt-2">{item.title}</ModalTitle>
        <ModalDescription>
          {item.subtitle ? `${item.subtitle} · ` : ""}actualizado {formatRelative(detail?.updatedAt ?? item.updatedAt).toLowerCase()}
        </ModalDescription>
        <div role="tablist" aria-label="Secciones de la ficha" className="-mx-5 mt-4 flex gap-1 overflow-x-auto px-5 [scrollbar-width:none] md:-mx-7 md:px-7">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`pub-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`pub-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px inline-flex h-10 shrink-0 items-center gap-2 border-b-[3px] px-3 text-sm font-bold whitespace-nowrap outline-none transition-colors focus-visible:bg-muted",
                tab === t.id ? "border-tangerine text-eerie" : "border-transparent text-muted-foreground hover:text-eerie",
              )}
            >
              {t.label}
              {t.count !== undefined && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-extrabold">{t.count}</span>}
            </button>
          ))}
        </div>
      </ModalHeader>

      {!canWrite && <ReadOnlyBanner moduleLabel="Tienda" className="mx-5 mt-4 md:mx-7" />}

      <div role="tabpanel" id="pub-panel-details" aria-labelledby="pub-tab-details" className={panel("details")}>
        {error ? (
          <div className="p-5">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : isPending ? (
          <div className="space-y-4 p-5 md:px-7">
            <Skeleton className="h-24" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <PublicationDetailsForm projectId={item.projectId} title={item.title} detail={detail} canWrite={canWrite} onClose={onClose} className="flex" />
        )}
      </div>
      <div role="tabpanel" id="pub-panel-media" aria-labelledby="pub-tab-media" className={panel("media")}>
        <PublicationMediaPanel projectId={item.projectId} title={item.title} canWrite={canWrite} onClose={onClose} className="flex min-h-0 flex-1 flex-col" />
      </div>
      <div role="tabpanel" id="pub-panel-sections" aria-labelledby="pub-tab-sections" className={panel("sections")}>
        <PublicationSectionsPanel
          projectId={item.projectId}
          title={item.title}
          type={detail?.type}
          canWrite={canWrite}
          onClose={onClose}
          className="flex min-h-0 flex-1 flex-col"
        />
      </div>
    </ModalContent>
  );
}
