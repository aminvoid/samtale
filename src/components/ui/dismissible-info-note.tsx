"use client";

import { useState, type ReactNode } from "react";
import { IconInfo, IconX, type IconComponent } from "./icon";
import { IconButton } from "./icon-button";
import { InfoNoteBody, infoNoteLayout } from "./info-note-layout";

type DismissibleInfoNoteProps = {
  dismissLabel: string;
  children: ReactNode;
  icon?: IconComponent;
  className?: string;
  onDismiss?: () => void;
};

/** An info note with a named close button. */
export function DismissibleInfoNote({
  dismissLabel,
  children,
  icon = IconInfo,
  className,
  onDismiss,
}: DismissibleInfoNoteProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={infoNoteLayout(false, className)}>
      <InfoNoteBody icon={icon}>{children}</InfoNoteBody>
      <IconButton
        label={dismissLabel}
        icon={<IconX />}
        className="shrink-0"
        onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}
      />
    </div>
  );
}
