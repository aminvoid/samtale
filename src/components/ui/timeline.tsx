import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { IconArrowRight } from "./icon";

type Segment = { key: string; label: ReactNode; detail?: ReactNode; emphasized?: boolean };

export function Timeline({ segments }: { segments: readonly Segment[] }) {
  return (
    <ol role="list" className="rounded-card border border-border bg-surface-raised p-4 md:flex md:p-5">
      {segments.map(({ key, label, detail, emphasized }) => (
        <li
          key={key}
          className={cn(
            "group relative flex gap-3 pbe-4 min-inline-0 last:pbe-0 md:flex-col md:pbe-0 md:min-block-0 md:not-last:pe-3",
            emphasized ? "min-block-36 md:flex-3" : "min-block-12 md:flex-1",
            "last:min-block-0",
          )}
        >
          <div
            aria-hidden="true"
            className="relative flex shrink-0 justify-center inline-3 md:items-center md:justify-start md:inline-auto"
          >
            <span className="absolute inset-bs-4 inset-be-0 -mbe-4 bg-border-strong inline-0.5 group-last:hidden md:hidden" />
            <span className="relative mbs-2 shrink-0 rounded-full bg-accent block-3 inline-3 md:mbs-0" />
            <span className="hidden items-center gap-1 text-text-muted md:flex md:grow md:ps-1 group-last:md:hidden">
              <span className="grow bg-border-strong block-0.5" />
              <IconArrowRight size={16} />
            </span>
          </div>
          <div className="min-inline-0">
            <p className="text-label">{label}</p>
            {detail && <div className="mbs-1 text-caption text-text-muted">{detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
