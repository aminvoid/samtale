import type { ReactNode } from "react";
import { IconInfo, type IconComponent } from "./icon";
import { InfoNoteBody, infoNoteLayout } from "./info-note-layout";

type InfoNoteProps = {
  children: ReactNode;
  icon?: IconComponent;
  className?: string;
  variant?: "standard" | "compact";
};

/**
 * A static note. It imports no client components, so pages that only show static notes don't ship
 * the collapsible or dismissible variants (home JS budget, ADR-0014). Those are `CollapsibleInfoNote`
 * and `DismissibleInfoNote`.
 */
export function InfoNote({ children, icon = IconInfo, className, variant = "standard" }: InfoNoteProps) {
  const compact = variant === "compact";
  return (
    <div className={infoNoteLayout(compact, className)}>
      <InfoNoteBody icon={icon} compact={compact}>
        {children}
      </InfoNoteBody>
    </div>
  );
}
