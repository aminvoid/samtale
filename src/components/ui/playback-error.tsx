import type { ReactNode } from "react";
import { Icon } from "./icon";
import { LiveRegion } from "./live-region";

export function PlaybackError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <>
      {children != null && (
        <span id={id} className="inline-flex items-center gap-1 text-caption text-danger">
          <Icon name="circle-alert" size={16} />
          {children}
        </span>
      )}
      <LiveRegion>{children}</LiveRegion>
    </>
  );
}
