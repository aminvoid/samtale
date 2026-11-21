"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface FocusHeadingProps {
  children: ReactNode;
  className?: string;
}

/**
 * An `h1` that receives focus when it mounts (WCAG 2.4.3, system-pages spec).
 * The HTML `autofocus` attribute is ignored on content that streams in after the document
 * has loaded (for example a `notFound()` page inside the locale layout), so focus is moved here.
 */
export function FocusHeading({ children, className }: FocusHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h1 ref={ref} tabIndex={-1} className={cn("text-h1", className)}>
      {children}
    </h1>
  );
}
