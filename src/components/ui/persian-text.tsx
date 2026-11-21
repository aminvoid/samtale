import type { AriaAttributes, ReactNode } from "react";
import { getDirection } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";

type PersianTextProps = AriaAttributes & {
  as?: "span" | "p" | "div" | "blockquote" | "li" | "h2" | "h3";
  variant?: "body" | "translation";
  id?: string;
  className?: string;
  children: ReactNode;
};

export function PersianText({
  as: Component = "span",
  variant = "body",
  className,
  children,
  ...props
}: PersianTextProps) {
  return (
    <Component
      {...props}
      lang="fa"
      dir={getDirection("fa")}
      className={cn(
        variant === "translation"
          ? "text-(length:--text-fa-translation)/(--text-fa-translation--line-height) text-text-muted"
          : "text-body",
        className,
      )}
    >
      {children}
    </Component>
  );
}
