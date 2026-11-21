import type { AriaAttributes, ReactNode } from "react";

type DanishTextProps = AriaAttributes & {
  as?: "bdi" | "span" | "p" | "div" | "blockquote" | "li" | "h2" | "h3";
  id?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Every block of Danish goes through this component (ADR-0004 §3). It isolates its own direction, so
 * no nested <bdi> is needed inside it. Danish inside a Persian sentence uses the <da> message tag instead.
 */
export function DanishText({ as: Component = "span", children, ...rest }: DanishTextProps) {
  return (
    <Component {...rest} lang="da" dir="ltr">
      {children}
    </Component>
  );
}
