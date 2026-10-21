"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/cn";

/** Lightweight side drawer (Radix Dialog): Esc, overlay tap, focus trap and focus return come built in. */
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetTitle = SheetPrimitive.Title;

const SIDES = {
  left: "left-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  right: "right-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
} as const;

function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: keyof typeof SIDES }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-eerie/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <SheetPrimitive.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-[82vw] max-w-80 flex-col bg-card shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out",
          SIDES[side],
          className,
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger };
