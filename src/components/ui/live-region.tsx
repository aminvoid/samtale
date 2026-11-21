import type { ReactNode } from "react";

type LiveRegionProps = { children?: ReactNode };

export function LiveRegion({ children }: LiveRegionProps) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {children}
    </div>
  );
}
