"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

export function Modal({
  trigger,
  title,
  description,
  children,
  variant,
}: {
  trigger: React.ReactElement;
  title: string;
  description: string;
  children: (close: () => void) => React.ReactNode;
  variant?: "dark";
}) {
  const [open, setOpen] = useState(false);
  const dark = variant === "dark";
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={trigger} />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Popup
          className={
            dark
              ? "fixed left-1/2 top-1/2 z-50 w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#161b22] p-6 text-white shadow-2xl"
              : "fixed left-1/2 top-1/2 z-50 w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl"
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              <Dialog.Description
                className={
                  dark
                    ? "mt-1 text-sm text-[#8b949e]"
                    : "mt-1 text-sm text-muted-foreground"
                }
              >
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className={
                dark
                  ? "rounded-lg p-1 text-[#8b949e] hover:bg-white/5 hover:text-white"
                  : "rounded-lg p-1 text-muted-foreground hover:bg-muted"
              }
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="mt-5">{children(() => setOpen(false))}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
