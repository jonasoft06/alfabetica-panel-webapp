"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useIsDesktop } from "@/shared/hooks/use-media-query";

/**
 * Single modal primitive for the whole panel.
 * - Desktop: centered dialog (`placement="center"`) or right side panel (`placement="side"`).
 * - Mobile: always a bottom sheet, so forms stay reachable with the thumb.
 */
const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalClose = DialogPrimitive.Close;

const SIZE = { sm: "md:max-w-[560px]", md: "md:max-w-[720px]", lg: "md:max-w-[780px]" } as const;

type ModalContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
  placement?: "center" | "side";
  size?: keyof typeof SIZE;
  /** Tailwind bg-* class for the colored spine (defaults to the module accent). */
  spine?: string;
  hideClose?: boolean;
};

function ModalContent({ className, children, placement = "center", size = "md", spine = "bg-module", hideClose = false, ...props }: ModalContentProps) {
  const isDesktop = useIsDesktop();
  const isSide = isDesktop && placement === "side";
  const isSheet = !isDesktop;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-eerie/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content
        data-slot="modal-content"
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden bg-card shadow-2xl outline-none",
          isSheet &&
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom",
          isSide &&
            "top-[18px] right-[18px] bottom-[18px] w-[620px] max-w-[calc(100vw-36px)] rounded-3xl data-[state=open]:animate-in data-[state=open]:slide-in-from-right-8 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          isDesktop &&
            !isSide &&
            cn(
              "top-1/2 left-1/2 max-h-[calc(100dvh-48px)] w-[calc(100vw-48px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
              SIZE[size],
            ),
          className,
        )}
        {...props}
      >
        {isSheet && <span aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-eerie/15" />}
        <span aria-hidden className={cn("absolute top-6 bottom-6 left-0 z-10 w-1 rounded-r-sm", spine)} />
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            className="absolute top-5 right-5 inline-flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none md:top-6 md:right-6"
            aria-label="Cerrar"
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function ModalHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("shrink-0 border-b px-5 pt-5 pb-4 pr-16 md:px-7 md:pt-6", className)} {...props} />;
}

function ModalTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("font-display text-xl font-bold md:text-2xl", className)} {...props} />;
}

function ModalDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("mt-1 text-sm text-muted-foreground", className)} {...props} />;
}

function ModalBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7", className)} {...props} />;
}

function ModalFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/80 px-5 py-4 md:flex-row md:items-center md:justify-end md:px-7", className)}
      {...props}
    />
  );
}

export { Modal, ModalBody, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger };
