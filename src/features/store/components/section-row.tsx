"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileTextIcon, GripVerticalIcon, PencilIcon, Trash2Icon, UploadIcon, XIcon } from "lucide-react";
import type { PublicationSection } from "@/contracts/publication";
import { cn } from "@/shared/lib/cn";
import { formatBytes } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { PDF_MIME } from "../lib/pdf-validation";

function IconAction({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={danger ? "hover:border-destructive/40 hover:text-destructive" : undefined}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export interface SectionRowActions {
  onEdit: (section: PublicationSection) => void;
  onDelete: (section: PublicationSection) => void;
  onPickPdf: (section: PublicationSection, file: File) => void;
  onRemovePdf: (section: PublicationSection) => void;
}

/** One sortable row: drag handle (pointer + keyboard), label/description, PDF chip and actions. */
export function SectionRow({
  section,
  position,
  canWrite,
  uploading,
  actions,
}: {
  section: PublicationSection;
  position: number;
  canWrite: boolean;
  uploading: boolean;
  actions: SectionRowActions;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: section.id, disabled: !canWrite });
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex flex-wrap items-start gap-x-3 gap-y-2 rounded-2xl border-[1.5px] border-border bg-card p-3 md:p-3.5",
        isDragging && "relative z-10 shadow-lg ring-2 ring-tangerine/40",
      )}
    >
      {canWrite ? (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reordenar ${section.label}. Posición ${position}`}
          className="mt-0.5 inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/30 active:cursor-grabbing"
        >
          <GripVerticalIcon className="size-4" />
        </button>
      ) : (
        <span className="w-2" aria-hidden />
      )}
      <span
        aria-hidden
        className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-tangerine/15 text-[11px] font-extrabold text-tangerine"
      >
        {position}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] leading-snug font-bold break-words">{section.label}</p>
        {section.description && <p className="mt-0.5 text-xs text-muted-foreground">{section.description}</p>}
        {section.pdf && (
          <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg bg-muted py-1 pr-1 pl-2.5 text-xs">
            <FileTextIcon className="size-3.5 shrink-0 text-tangerine" />
            <a href={section.pdf.url} target="_blank" rel="noreferrer" className="min-w-0 truncate font-semibold hover:underline">
              {section.pdf.originalName ?? "documento.pdf"}
            </a>
            <span className="shrink-0 text-muted-foreground">{formatBytes(section.pdf.sizeBytes)}</span>
            {canWrite && (
              <button
                type="button"
                aria-label={`Quitar el PDF de ${section.label}`}
                onClick={() => actions.onRemovePdf(section)}
                className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-destructive"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
        )}
      </div>
      {canWrite && (
        <div className="ml-auto flex basis-full justify-end gap-1.5 md:basis-auto">
          <input
            ref={fileRef}
            type="file"
            accept={PDF_MIME}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) actions.onPickPdf(section, file);
            }}
          />
          <IconAction
            label={uploading ? "Subiendo PDF…" : section.pdf ? "Reemplazar PDF" : "Subir PDF"}
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon />
          </IconAction>
          <IconAction label="Editar sección" onClick={() => actions.onEdit(section)}>
            <PencilIcon />
          </IconAction>
          <IconAction label="Eliminar sección" danger onClick={() => actions.onDelete(section)}>
            <Trash2Icon />
          </IconAction>
        </div>
      )}
    </li>
  );
}
