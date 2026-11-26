"use client";

import {
  useId,
  type ComponentPropsWithRef,
  type MouseEvent,
  type SyntheticEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { IconLoaderCircle } from "./icon";

const variants = {
  primary: "border-transparent bg-accent text-accent-contrast hover:bg-accent-hover active:bg-accent-active",
  secondary:
    "border-border-strong bg-surface-raised text-text hover:bg-surface-sunken active:border-text-muted active:bg-surface-sunken",
  tertiary: "border-transparent text-accent hover:bg-accent-subtle active:bg-accent-subtle",
  destructive:
    "border-transparent bg-danger text-danger-contrast hover:brightness-90 active:brightness-90 dark:hover:brightness-110 dark:active:brightness-110",
  "destructive-tertiary": "border-transparent text-danger hover:bg-danger-subtle active:bg-danger-subtle",
  "icon-only":
    "border-transparent text-text-muted hover:bg-surface-sunken hover:text-text active:bg-surface-sunken",
};

const sizes = {
  md: "min-block-touch px-4",
  lg: "min-block-touch-primary px-5",
};

export type ButtonProps = Omit<
  ComponentPropsWithRef<"button">,
  "aria-disabled" | "aria-busy" | "children"
> & {
  size?: keyof typeof sizes;
  block?: boolean;
  icon?: ReactElement;
  loading?: boolean;
  disabledReason?: string;
} & (
    | { variant: "icon-only"; "aria-label": string; icon: ReactElement; children?: never }
    | { variant?: Exclude<keyof typeof variants, "icon-only">; children: ReactNode }
  );

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  icon,
  loading = false,
  disabled = false,
  disabledReason,
  type = "button",
  className,
  children,
  "aria-describedby": describedBy,
  onClick,
  onPointerDown,
  onMouseDown,
  onKeyDown,
  onKeyUp,
  ...props
}: ButtonProps) {
  const reasonId = useId();
  const iconOnly = variant === "icon-only";
  const textVariant = variant === "tertiary" || variant === "destructive-tertiary";
  const unavailable = disabledReason !== undefined;
  const muted = disabled || unavailable;
  // Unavailable and loading buttons stay focusable so their reason or busy state can be heard; they
  // only refuse activation. A native button (not Base UI's) keeps this primitive out of every page's
  // first load (home JS budget, ADR-0014).
  const inert = !disabled && (unavailable || loading);
  // Like Base UI's focusable-when-disabled state: the caller's activation handlers don't run.
  const guard =
    <E extends SyntheticEvent<HTMLButtonElement>>(handler: ((event: E) => void) | undefined) =>
    (event: E) => {
      if (!inert) handler?.(event);
    };
  const button = (
    <button
      {...props}
      type={type}
      disabled={disabled}
      aria-disabled={inert || undefined}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (inert) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      onPointerDown={guard(onPointerDown)}
      onMouseDown={guard(onMouseDown)}
      onKeyDown={guard(onKeyDown)}
      onKeyUp={guard(onKeyUp)}
      aria-busy={loading || undefined}
      aria-describedby={unavailable ? [describedBy, reasonId].filter(Boolean).join(" ") : describedBy}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control border py-2 text-(length:--text-ui)/(--leading-fa-ui) font-semibold transition-colors duration-(--duration-fast) ease-standard min-inline-touch",
        iconOnly ? "p-0 block-touch inline-touch" : sizes[size],
        // Split the 20 px spinner and 8 px gap between both sides when idle.
        !icon && !loading && "gap-0 before:shrink-0 before:inline-3.5 after:shrink-0 after:inline-3.5",
        block && !iconOnly && "inline-full",
        !muted && variants[variant],
        muted && "cursor-not-allowed border-transparent text-text-muted",
        muted && !textVariant && "bg-surface-sunken",
        unavailable && !disabled && !textVariant && "border-dashed border-border-strong",
        loading && "cursor-wait",
        className,
      )}
    >
      {loading ? <IconLoaderCircle className="motion-safe:animate-spin" /> : icon}
      {children != null && <span className="min-inline-0">{children}</span>}
    </button>
  );

  return (
    <span
      className={cn(
        unavailable ? "inline-flex flex-col items-start gap-1" : "contents",
        unavailable && block && "inline-full",
      )}
    >
      {button}
      {unavailable && (
        <span id={reasonId} className="text-caption text-text-muted">
          {disabledReason}
        </span>
      )}
    </span>
  );
}
