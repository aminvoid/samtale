"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SwitchProps = Pick<
  BaseSwitch.Root.Props,
  | "id"
  | "checked"
  | "defaultChecked"
  | "onCheckedChange"
  | "disabled"
  | "name"
  | "form"
  | "value"
  | "uncheckedValue"
> & {
  label: ReactNode;
  disabledReason?: string;
  className?: string;
};

export function Switch({ label, disabledReason, className, ...props }: SwitchProps) {
  const reasonId = useId();
  const direction = useDirection();
  const unavailable = disabledReason !== undefined;

  return (
    <div className={className}>
      <BaseSwitch.Root
        {...props}
        nativeButton
        render={<button />}
        dir={direction}
        readOnly={unavailable}
        aria-disabled={unavailable || undefined}
        aria-describedby={unavailable ? reasonId : undefined}
        className={cn(
          "group flex items-center gap-2 rounded-control px-2 py-1 text-start text-(length:--text-ui)/(--leading-fa-ui) min-block-touch min-inline-touch",
          unavailable || props.disabled
            ? "cursor-not-allowed text-text-muted"
            : "transition-colors duration-(--duration-fast) ease-standard hover:bg-surface-sunken active:bg-surface-sunken",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "relative shrink-0 rounded-full border border-border-strong bg-surface-sunken block-6.5 inline-touch",
            "group-data-checked:border-accent group-data-checked:bg-accent",
            unavailable &&
              "border-dashed group-data-checked:border-border-strong group-data-checked:bg-surface-sunken",
          )}
        >
          <BaseSwitch.Thumb className="absolute start-0.5 inset-bs-0.5 rounded-full border border-border-strong bg-text-muted shadow-card block-5 inline-5 data-checked:start-5 data-checked:bg-surface-raised motion-safe:transition-[inset-inline-start] motion-safe:duration-(--duration-fast) motion-safe:ease-standard" />
        </span>
        <span>{label}</span>
      </BaseSwitch.Root>
      {unavailable && (
        <p
          id={reasonId}
          className="mbs-1 text-(length:--text-caption)/(--text-caption--line-height) text-text-muted"
        >
          {disabledReason}
        </p>
      )}
    </div>
  );
}
