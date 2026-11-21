import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Link } from "@/i18n/navigation";

type CardProps = { className?: string; children: ReactNode } & (
  Omit<ComponentPropsWithRef<"div">, "children"> | Omit<ComponentPropsWithRef<typeof Link>, "children">
);

export function Card({ className, children, ...props }: CardProps) {
  const surface = "rounded-card border border-border bg-surface-raised p-4 shadow-card";

  if ("href" in props) {
    return (
      <Link
        {...props}
        className={cn(
          surface,
          "block transition-colors duration-(--duration-fast) ease-standard min-block-touch min-inline-touch hover:border-border-strong hover:shadow-raised active:bg-surface-sunken",
          className,
        )}
      >
        {children}
      </Link>
    );
  }

  return (
    <div {...props} className={cn(surface, className)}>
      {children}
    </div>
  );
}
