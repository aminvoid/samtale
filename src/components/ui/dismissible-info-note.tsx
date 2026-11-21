"use client";

import { useState, type ReactNode } from "react";
import { IconButton } from "./icon-button";

type DismissibleInfoNoteProps = {
  label: string;
  children: ReactNode;
  className: string;
  onDismiss?: () => void;
};

export function DismissibleInfoNote({ label, children, className, onDismiss }: DismissibleInfoNoteProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={className}>
      {children}
      <IconButton
        label={label}
        icon="x"
        className="shrink-0"
        onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}
      />
    </div>
  );
}
