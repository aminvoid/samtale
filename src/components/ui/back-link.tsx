import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { IconChevronLeft } from "./icon";

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mbe-2 inline-flex items-center gap-2 rounded-control text-ui font-semibold text-accent min-block-touch min-inline-touch hover:underline"
    >
      <IconChevronLeft />
      {children}
    </Link>
  );
}
