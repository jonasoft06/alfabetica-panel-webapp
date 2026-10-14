"use client";

import { useId, useState } from "react";
import { Trash2Icon, TriangleAlertIcon, XIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalTitle } from "@/shared/ui/modal";

type Safeguard = { type: "checkbox"; label: string } | { type: "keyword"; keyword: string } | { type: "none" };

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  /** Items listed under "SE ELIMINARÁ". */
  consequences?: React.ReactNode[];
  consequencesTitle?: string;
  footnote?: React.ReactNode;
  safeguard?: Safeguard;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: "warning" | "trash";
  pending?: boolean;
  onConfirm: () => void;
}

/**
 * Destructive confirmation used for "quitar relación" and "eliminar".
 * Forces an explicit acknowledgement (checkbox or typed keyword) before enabling the action.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <Modal open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <ConfirmDialogContent {...props} />}
    </Modal>
  );
}

function ConfirmDialogContent({
  title,
  description,
  consequences,
  consequencesTitle = "Se eliminará",
  footnote,
  safeguard = { type: "none" },
  confirmLabel,
  cancelLabel = "Cancelar",
  icon = "warning",
  pending,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  const [checked, setChecked] = useState(false);
  const [typed, setTyped] = useState("");
  const fieldId = useId();
  const ready = safeguard.type === "none" || (safeguard.type === "checkbox" ? checked : typed.trim().toUpperCase() === safeguard.keyword.toUpperCase());
  const Icon = icon === "trash" ? Trash2Icon : TriangleAlertIcon;

  return (
    <ModalContent size="sm" spine="bg-destructive" hideClose role="alertdialog">
      <ModalBody className="pt-6">
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <ModalTitle className="text-xl">{title}</ModalTitle>
            <ModalDescription className="mt-1.5 leading-relaxed">{description}</ModalDescription>
          </div>
        </div>

        {consequences && consequences.length > 0 && (
          <div className="mt-5 rounded-2xl bg-destructive/[0.07] px-4 py-4">
            <p className="eyebrow !text-destructive">{consequencesTitle}</p>
            <ul className="mt-2.5 space-y-2">
              {consequences.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-eerie/85">
                  <XIcon className="mt-0.5 size-3.5 shrink-0 text-destructive" strokeWidth={3} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {footnote && <p className="mt-3 text-[11px] text-muted-foreground">{footnote}</p>}
          </div>
        )}

        {safeguard.type === "checkbox" && (
          <label htmlFor={fieldId} className="mt-5 flex cursor-pointer items-start gap-3 text-[13px]">
            <Checkbox
              id={fieldId}
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
              className="mt-0.5 data-[state=checked]:border-destructive data-[state=checked]:bg-destructive"
            />
            {safeguard.label}
          </label>
        )}

        {safeguard.type === "keyword" && (
          <div className="mt-5">
            <label htmlFor={fieldId} className="text-[13px]">
              Para confirmar, escribe <strong className="font-extrabold">{safeguard.keyword}</strong>
            </label>
            <Input id={fieldId} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={safeguard.keyword} autoComplete="off" className="mt-2" />
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={!ready || pending}>
          <Trash2Icon /> {pending ? "Procesando…" : confirmLabel}
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}
