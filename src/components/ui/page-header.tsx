import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: ReactNode;
  titleClassName?: string;
};

export function PageHeader({ title, subtitle, back, titleClassName }: PageHeaderProps) {
  return (
    <header>
      {back}
      <h1 tabIndex={-1} className={cn("text-h1", titleClassName)}>
        {title}
      </h1>
      {subtitle && <div className="mbs-2 text-lead text-text-muted">{subtitle}</div>}
    </header>
  );
}
