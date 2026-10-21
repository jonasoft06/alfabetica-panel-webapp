"use client";

import { CheckIcon, InfoIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";
import { describeError, type ErrorMessages } from "@/core/http/api-error";

type Action = { label: string; onClick: () => void };

const icon = (node: React.ReactNode, color: string) => <span className={color}>{node}</span>;

/** Toast helpers matching the "Avisos (toast + deshacer)" mockup. */
export const notify = {
  success: (title: string, description?: string, action?: Action) =>
    toast(title, { description, action, icon: icon(<CheckIcon className="size-4" />, "text-turquoise") }),
  removed: (title: string, description?: string, undo?: () => void) =>
    toast(title, {
      description,
      icon: icon(<Trash2Icon className="size-4" />, "text-tangerine"),
      action: undo ? { label: "Deshacer", onClick: undo } : undefined,
      duration: undo ? 8000 : 6000,
    }),
  info: (title: string, description?: string) => toast(title, { description, icon: icon(<InfoIcon className="size-4" />, "text-tan-sun") }),
  /** `messages`: Spanish text per error code, or a ready description that replaces the generic one. */
  error: (error: unknown, title = "No se pudo completar la acción", messages?: ErrorMessages | string) =>
    toast(title, {
      description: typeof messages === "string" ? messages : describeError(error, messages),
      icon: icon(<TriangleAlertIcon className="size-4" />, "text-tangerine"),
    }),
};
