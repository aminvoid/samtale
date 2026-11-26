import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Disclosure } from "./disclosure";
import { IconInfo, type IconComponent } from "./icon";
import { infoNoteSurface } from "./info-note-layout";

type CollapsibleInfoNoteProps = {
  label: ReactNode;
  children: ReactNode;
  icon?: IconComponent;
  className?: string;
};

/** An info note whose body opens from a labelled toggle. */
export function CollapsibleInfoNote({
  label,
  children,
  icon: NoteIcon = IconInfo,
  className,
}: CollapsibleInfoNoteProps) {
  return (
    <Disclosure label={label} icon={<NoteIcon />} className={cn(infoNoteSurface, className)}>
      <div className="text-body">{children}</div>
    </Disclosure>
  );
}
