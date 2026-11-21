import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { DanishText } from "./danish-text";

type TermLabelProps = {
  variant?: "inline" | "chip";
  className?: string;
  children: ReactNode;
};

export function TermLabel({ variant = "inline", className, children }: TermLabelProps) {
  return (
    <DanishText
      as="bdi"
      className={cn(
        "text-(length:--text-da-label)/(--text-da-label--line-height) font-semibold text-text-muted tabular-nums",
        variant === "chip" && "inline-block rounded-chip border border-border px-2",
        className,
      )}
    >
      {children}
    </DanishText>
  );
}
