"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useDirection } from "@base-ui/react/direction-provider";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./icon-button";

export type DialogProps = Pick<
  BaseDialog.Root.Props,
  "open" | "defaultOpen" | "onOpenChange" | "disablePointerDismissal"
> &
  Pick<BaseDialog.Popup.Props, "initialFocus" | "finalFocus"> & {
    title: ReactNode;
    closeLabel: string;
    description?: ReactNode;
    children?: ReactNode;
    /** A native button or a primitive that renders one, such as Button or IconButton. */
    trigger?: ReactElement;
    className?: string;
    presentation?: "dialog" | "sheet" | "drawer" | "fullscreen-mobile";
  };

export function Dialog({
  title,
  closeLabel,
  description,
  children,
  trigger,
  className,
  initialFocus,
  finalFocus,
  presentation = "dialog",
  ...props
}: DialogProps) {
  const direction = useDirection();
  const sheet = presentation === "sheet";
  const drawer = presentation === "drawer";
  const fullscreen = presentation === "fullscreen-mobile";

  return (
    <BaseDialog.Root {...props} modal>
      {trigger && <BaseDialog.Trigger render={trigger} />}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-scrim transition-opacity ease-standard data-ending-style:opacity-0 data-starting-style:opacity-0",
            sheet || drawer
              ? "duration-(--duration-slow)"
              : "duration-(--duration-base) data-ending-style:duration-(--duration-fast)",
          )}
        />
        <BaseDialog.Viewport
          dir={direction}
          className={cn(
            "fixed inset-0 z-50 grid overscroll-contain",
            drawer ? "justify-items-end" : sheet ? "items-end" : "place-items-center",
            fullscreen ? "md:p-4" : !drawer && !sheet && "p-4",
          )}
        >
          <BaseDialog.Popup
            initialFocus={initialFocus}
            finalFocus={finalFocus}
            className={cn(
              "overflow-auto overscroll-contain bg-surface-raised p-6 shadow-overlay inline-full",
              "transition-opacity ease-standard data-ending-style:opacity-0 data-starting-style:opacity-0",
              "motion-safe:transition-[opacity,scale,translate]",
              drawer
                ? "drawer-motion duration-(--duration-slow) block-full max-block-dvh max-inline-80"
                : sheet
                  ? "rounded-ss-sheet rounded-se-sheet pbe-[max(--spacing(6),env(safe-area-inset-bottom))] duration-(--duration-slow) max-block-[85dvh] motion-safe:data-ending-style:translate-y-full motion-safe:data-starting-style:translate-y-full"
                  : "rounded-sheet duration-(--duration-base) max-block-full max-inline-dialog data-ending-style:duration-(--duration-fast) motion-safe:data-ending-style:scale-98 motion-safe:data-starting-style:scale-98 md:max-inline-120",
              fullscreen &&
                "rounded-none block-dvh max-inline-none md:rounded-sheet md:block-auto md:max-block-full md:max-inline-dialog",
              className,
            )}
          >
            {sheet && (
              <div aria-hidden className="mx-auto mbe-4 rounded-full bg-border-strong block-1 inline-9" />
            )}
            <div className="flex items-start justify-between gap-2">
              <BaseDialog.Title className="self-center text-h2">{title}</BaseDialog.Title>
              <BaseDialog.Close render={<IconButton icon="x" label={closeLabel} className="shrink-0" />} />
            </div>
            {description != null && (
              <BaseDialog.Description className="mbs-2 text-body">{description}</BaseDialog.Description>
            )}
            {children != null && <div className="mbs-4">{children}</div>}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
