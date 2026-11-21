import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Disclosure } from "./disclosure";
import { Icon, type IconName } from "./icon";
import { DismissibleInfoNote } from "./dismissible-info-note";

type InfoNoteProps = {
  children: ReactNode;
  icon?: IconName;
  className?: string;
} & (
  | { variant?: "standard" | "compact" }
  | { variant: "collapsible"; label: ReactNode }
  | { variant: "dismissible"; dismissLabel: string; onDismiss?: () => void }
);

export function InfoNote({ children, icon = "info", className, ...props }: InfoNoteProps) {
  const surface = "rounded-card bg-accent-subtle p-4";

  if (props.variant === "collapsible") {
    return (
      <Disclosure label={props.label} icon={icon} className={cn(surface, className)}>
        <div className="text-body">{children}</div>
      </Disclosure>
    );
  }

  const compact = props.variant === "compact";
  const note = (
    <>
      <Icon name={icon} size={compact ? 16 : 20} className="mbs-1 text-accent" />
      <div className={cn("grow min-inline-0", compact ? "text-caption" : "text-body")}>{children}</div>
    </>
  );
  const layout = cn("flex items-start gap-2", !compact && surface, className);

  if (props.variant === "dismissible") {
    return (
      <DismissibleInfoNote label={props.dismissLabel} onDismiss={props.onDismiss} className={layout}>
        {note}
      </DismissibleInfoNote>
    );
  }

  return <div className={layout}>{note}</div>;
}
