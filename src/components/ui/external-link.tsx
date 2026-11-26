import type { ReactNode } from "react";
import { IconExternalLink } from "./icon";

export function ExternalLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-control text-ui text-accent underline min-block-touch min-inline-touch"
    >
      {children}
      <IconExternalLink size={16} />
    </a>
  );
}
