import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { IconBadgeCheck, IconBookOpen, IconPenLine } from "./icon";

const sourceIcons = {
  siri: IconBadgeCheck,
  booklet: IconBookOpen,
  app: IconPenLine,
  "app-from-siri": IconPenLine,
  "booklet-picture": IconBookOpen,
};

type SourceLabelProps = {
  variant: keyof typeof sourceIcons;
  className?: string;
  children: ReactNode;
};

export function SourceLabel({ variant, className, children }: SourceLabelProps) {
  const SourceIcon = sourceIcons[variant];
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 text-(length:--text-caption)/(--text-caption--line-height) text-text-muted",
        className,
      )}
    >
      <SourceIcon size={16} className="self-center" />
      <span>{children}</span>
    </span>
  );
}
