"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Dark toasts with a colored progress feel, as in the "Avisos (toast + deshacer)" mockup. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      duration={6000}
      offset={24}
      mobileOffset={{ bottom: 88, left: 12, right: 12 }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "group relative flex w-full items-start gap-3 overflow-hidden rounded-2xl bg-eerie p-4 pr-10 text-near-white shadow-2xl md:w-[420px]",
          title: "text-sm font-bold",
          description: "mt-0.5 text-xs text-near-white/70",
          actionButton: "ml-auto shrink-0 rounded-lg border border-near-white/25 px-3 py-1.5 text-xs font-bold text-near-white hover:bg-near-white/10",
          cancelButton: "shrink-0 rounded-lg px-2 py-1.5 text-xs text-near-white/70",
          closeButton: "!absolute !top-3 !right-3 !left-auto !border-0 !bg-transparent !text-near-white/60",
          icon: "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-near-white/10",
        },
      }}
      closeButton
      {...props}
    />
  );
}

export { Toaster };
