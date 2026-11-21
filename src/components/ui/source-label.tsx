import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./icon";

const sourceIcons = {
  siri: "badge-check",
  booklet: "book-open",
  app: "pen-line",
  "app-from-siri": "pen-line",
  "booklet-picture": "book-open",
} satisfies Record<string, IconName>;

type SourceLabelProps = {
  variant: keyof typeof sourceIcons;
  className?: string;
  children: ReactNode;
};

export function SourceLabel({ variant, className, children }: SourceLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 text-(length:--text-caption)/(--text-caption--line-height) text-text-muted",
        className,
      )}
    >
      <Icon name={sourceIcons[variant]} size={16} className="self-center" />
      <span>{children}</span>
    </span>
  );
}
