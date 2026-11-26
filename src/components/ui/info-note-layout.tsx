import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { IconComponent } from "./icon";

export const infoNoteSurface = "rounded-card bg-accent-subtle p-4";

/** The icon and body shared by every info note variant. No client code, so it can render anywhere. */
export function InfoNoteBody({
  icon: NoteIcon,
  compact = false,
  children,
}: {
  icon: IconComponent;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <NoteIcon size={compact ? 16 : 20} className="mbs-1 text-accent" />
      <div className={cn("grow min-inline-0", compact ? "text-caption" : "text-body")}>{children}</div>
    </>
  );
}

export function infoNoteLayout(compact: boolean, className?: string) {
  return cn("flex items-start gap-2", !compact && infoNoteSurface, className);
}
