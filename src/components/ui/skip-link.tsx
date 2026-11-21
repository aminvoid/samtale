import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SkipLinkProps = { children: ReactNode; className?: string };

export function SkipLink({ children, className }: SkipLinkProps) {
  return (
    <a href="#main" className={cn("skip-link hover:bg-accent-hover", className)}>
      {children}
    </a>
  );
}
