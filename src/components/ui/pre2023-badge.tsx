import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Disclosure } from "./disclosure";
import { InfoNote } from "./info-note";

type Pre2023BadgeProps = {
  children: ReactNode;
  className?: string;
} & ({ variant?: "plain" } | { variant: "explained"; explanationLabel: ReactNode; explanation: ReactNode });

export function Pre2023Badge({ children, className, ...props }: Pre2023BadgeProps) {
  const badge = (
    <span
      className={cn(
        "inline-block rounded-chip border border-border-strong px-2 text-(length:--text-caption)/(--text-caption--line-height) text-text-muted",
        className,
      )}
    >
      {children}
    </span>
  );

  if (props.variant !== "explained") return badge;

  return (
    <div className="flex flex-col items-start gap-2">
      {badge}
      <Disclosure label={props.explanationLabel} icon="circle-help">
        <InfoNote>{props.explanation}</InfoNote>
      </Disclosure>
    </div>
  );
}
